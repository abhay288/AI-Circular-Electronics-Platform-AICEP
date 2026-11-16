import { Queue } from "bullmq";
import IORedis from "ioredis";

export interface MaterialJobPayload {
  analysisId: string;
  sampleId?: string;
  sourceType?: "SAMPLE" | "UPLOAD" | "CAMERA";
  boardMassGrams?: number;
  additionalMetadata?: Record<string, unknown>;
}

let redisConnection: IORedis | null = null;
let materialQueue: Queue<MaterialJobPayload> | null = null;

const REDIS_URL = process.env.REDIS_URL;

if (REDIS_URL) {
  try {
    redisConnection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    redisConnection.on("error", (err) => {
      console.warn(`[BullMQ MaterialQueue] Redis connection issue: ${err.message}. Fallback mode active.`);
    });

    materialQueue = new Queue<MaterialJobPayload>("material-analysis", {
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
    console.warn(`[BullMQ MaterialQueue] Redis initialization skipped: ${err.message}`);
    materialQueue = null;
  }
}

/**
 * Enqueues a Material Recovery & Precious Metal Estimation job with BullMQ idempotency.
 * Idempotency Key: `${payload.analysisId}-material-analysis`
 */
export async function enqueueMaterialJob(payload: MaterialJobPayload) {
  const idempotencyJobId = `${payload.analysisId}-material-analysis`;

  if (materialQueue && redisConnection && redisConnection.status === "ready") {
    try {
      const job = await materialQueue.add("process-materials", payload, {
        jobId: idempotencyJobId,
      });
      return {
        success: true,
        queued: true,
        jobId: job.id,
        mode: "BULLMQ_REDIS",
      };
    } catch (err: any) {
      console.warn(`[MaterialQueue] BullMQ dispatch failed (${err.message}), using async fallback.`);
    }
  }

  // Resilient fallback for serverless or environments without active Redis
  const { runMaterialWorkerJob } = await import("./material.worker");
  setImmediate(async () => {
    try {
      await runMaterialWorkerJob(payload);
    } catch (workerErr: any) {
      console.error(`[MaterialQueue Fallback] Worker execution error:`, workerErr.message);
    }
  });

  return {
    success: true,
    queued: true,
    jobId: idempotencyJobId,
    mode: "ASYNC_IN_PROCESS",
  };
}

export { materialQueue, redisConnection };
