import { Queue } from "bullmq";
import IORedis from "ioredis";

export interface DetectionJobPayload {
  analysisId: string;
  assetId?: string;
  sourceType?: "SAMPLE" | "UPLOAD" | "CAMERA";
}

let redisConnection: IORedis | null = null;
let detectionQueue: Queue<DetectionJobPayload> | null = null;

const REDIS_URL = process.env.REDIS_URL;

if (REDIS_URL) {
  try {
    redisConnection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    redisConnection.on("error", (err) => {
      console.warn(`[BullMQ DetectionQueue] Redis connection issue: ${err.message}. Fallback mode active.`);
    });

    detectionQueue = new Queue<DetectionJobPayload>("detection-queue", {
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
    console.warn(`[BullMQ DetectionQueue] Redis initialization skipped: ${err.message}`);
    detectionQueue = null;
  }
}

/**
 * Enqueues a PCB detection job with BullMQ idempotency.
 * If Redis is unavailable, runs via asynchronous execution fallback.
 */
export async function enqueueDetectionJob(payload: DetectionJobPayload) {
  const idempotencyJobId = `${payload.analysisId}-detection`;

  if (detectionQueue && redisConnection && redisConnection.status === "ready") {
    try {
      const job = await detectionQueue.add("process-detection", payload, {
        jobId: idempotencyJobId,
      });
      return {
        success: true,
        queued: true,
        jobId: job.id,
        mode: "BULLMQ_REDIS",
      };
    } catch (err: any) {
      console.warn(`[DetectionQueue] BullMQ dispatch failed (${err.message}), using async fallback.`);
    }
  }

  // Resilient fallback for serverless or local environments without active Redis
  const { runDetectionWorkerJob } = await import("./detection.worker");
  setImmediate(async () => {
    try {
      await runDetectionWorkerJob(payload);
    } catch (workerErr: any) {
      console.error(`[DetectionQueue Fallback] Worker execution error:`, workerErr.message);
    }
  });

  return {
    success: true,
    queued: true,
    jobId: idempotencyJobId,
    mode: "ASYNC_IN_PROCESS",
  };
}

export { detectionQueue, redisConnection };
