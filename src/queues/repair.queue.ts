import { Queue } from "bullmq";
import IORedis from "ioredis";

export const REPAIR_QUEUE_NAME = "repair-analysis";

export interface RepairJobData {
  analysisId: string;
  sampleId?: string;
  triggeredBy?: string;
  userId?: string;
  organizationId?: string;
}

let redisConnection: IORedis | null = null;
let repairQueueInstance: Queue<RepairJobData> | null = null;

export function getRepairQueue(): Queue<RepairJobData> | null {
  const REDIS_URL = process.env.REDIS_URL;
  if (!REDIS_URL) {
    return null;
  }
  if (!repairQueueInstance) {
    try {
      if (!redisConnection) {
        redisConnection = new IORedis(REDIS_URL, {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          retryStrategy: (times) => Math.min(times * 100, 3000),
        });
        redisConnection.on("error", (err) => {
          console.warn(`[BullMQ RepairQueue] Redis connection issue: ${err.message}. Direct fallback active.`);
        });
      }

      repairQueueInstance = new Queue<RepairJobData>(REPAIR_QUEUE_NAME, {
        connection: redisConnection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      });
    } catch (err: any) {
      console.warn(`[BullMQ RepairQueue] Redis init skipped: ${err.message}`);
      return null;
    }
  }
  return repairQueueInstance;
}

export async function enqueueRepairJob(
  data: RepairJobData
): Promise<{ enqueued: boolean; jobId: string }> {
  const jobId = `repair-${data.analysisId}`;
  const queue = getRepairQueue();

  if (queue) {
    try {
      const job = await queue.add("assess-repair", data, {
        jobId,
      });
      return { enqueued: true, jobId: job.id || jobId };
    } catch (err: any) {
      console.warn(`[RepairQueue] Failed to enqueue to Redis (${err.message}), falling back to direct execution`);
    }
  }

  // Fallback direct execution when Redis is unavailable
  try {
    const { runRepairWorkerJob } = await import("@/queues/repair.worker");
    await runRepairWorkerJob(data);
    return { enqueued: true, jobId: `${jobId}-direct` };
  } catch (err: any) {
    console.error(`[RepairQueue Fallback] Worker execution error:`, err.message);
    throw err;
  }
}
