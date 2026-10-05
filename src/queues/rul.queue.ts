import { Queue } from "bullmq";
import IORedis from "ioredis";

export interface RULJobPayload {
  analysisId: string;
  sampleId?: string;
  sourceType?: "SAMPLE" | "UPLOAD" | "CAMERA";
}

let redisConnection: IORedis | null = null;
let rulQueue: Queue<RULJobPayload> | null = null;

const REDIS_URL = process.env.REDIS_URL;

if (REDIS_URL) {
  try {
    redisConnection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    redisConnection.on("error", (err) => {
      console.warn(`[BullMQ RULQueue] Redis connection issue: ${err.message}. Fallback mode active.`);
    });

    rulQueue = new Queue<RULJobPayload>("rul-queue", {
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
    console.warn(`[BullMQ RULQueue] Redis initialization skipped: ${err.message}`);
    rulQueue = null;
  }
}

/**
 * Enqueues an RUL Prediction & Health Assessment job with BullMQ idempotency.
 * Idempotency Key: `${payload.analysisId}-rul-prediction`
 */
export async function enqueueRULJob(payload: RULJobPayload) {
  const idempotencyJobId = `${payload.analysisId}-rul-prediction`;

  if (rulQueue && redisConnection && redisConnection.status === "ready") {
    try {
      const job = await rulQueue.add("process-rul", payload, {
        jobId: idempotencyJobId,
      });
      return {
        success: true,
        queued: true,
        jobId: job.id,
        mode: "BULLMQ_REDIS",
      };
    } catch (err: any) {
      console.warn(`[RULQueue] BullMQ dispatch failed (${err.message}), using async fallback.`);
    }
  }

  // Resilient fallback for serverless or environments without active Redis
  const { runRULWorkerJob } = await import("./rul.worker");
  setImmediate(async () => {
    try {
      await runRULWorkerJob(payload);
    } catch (workerErr: any) {
      console.error(`[RULQueue Fallback] Worker execution error:`, workerErr.message);
    }
  });

  return {
    success: true,
    queued: true,
    jobId: idempotencyJobId,
    mode: "ASYNC_IN_PROCESS",
  };
}

export { rulQueue, redisConnection };
