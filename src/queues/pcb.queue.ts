import { Queue } from "bullmq";
import IORedis from "ioredis";

export interface PCBJobPayload {
  analysisId: string;
  detectionResultId?: string;
  assetId?: string;
  sourceType?: "SAMPLE" | "UPLOAD" | "CAMERA";
}

let redisConnection: IORedis | null = null;
let pcbQueue: Queue<PCBJobPayload> | null = null;

const REDIS_URL = process.env.REDIS_URL;

if (REDIS_URL) {
  try {
    redisConnection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    redisConnection.on("error", (err) => {
      console.warn(`[BullMQ PCBQueue] Redis connection issue: ${err.message}. Fallback mode active.`);
    });

    pcbQueue = new Queue<PCBJobPayload>("pcb-queue", {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
  } catch (err: any) {
    console.warn(`[BullMQ PCBQueue] Redis initialization skipped: ${err.message}`);
    pcbQueue = null;
  }
}

/**
 * Enqueues a PCB Analysis job with BullMQ idempotency.
 * Idempotency Key: `${payload.analysisId}-pcb-analysis`
 */
export async function enqueuePCBJob(payload: PCBJobPayload) {
  const idempotencyJobId = `${payload.analysisId}-pcb-analysis`;

  if (pcbQueue && redisConnection && redisConnection.status === "ready") {
    try {
      const job = await pcbQueue.add("process-pcb", payload, {
        jobId: idempotencyJobId,
      });
      return {
        success: true,
        queued: true,
        jobId: job.id,
        mode: "BULLMQ_REDIS",
      };
    } catch (err: any) {
      console.warn(`[PCBQueue] BullMQ dispatch failed (${err.message}), using async fallback.`);
    }
  }

  // Resilient fallback for serverless or local environments without active Redis
  const { runPCBWorkerJob } = await import("./pcb.worker");
  setImmediate(async () => {
    try {
      await runPCBWorkerJob(payload);
    } catch (workerErr: any) {
      console.error(`[PCBQueue Fallback] Worker execution error:`, workerErr.message);
    }
  });

  return {
    success: true,
    queued: true,
    jobId: idempotencyJobId,
    mode: "ASYNC_IN_PROCESS",
  };
}

export { pcbQueue, redisConnection };
