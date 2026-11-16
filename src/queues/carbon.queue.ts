import { Queue } from "bullmq";
import IORedis from "ioredis";

export const CARBON_QUEUE_NAME = "carbon-impact-analysis";

export interface CarbonJobData {
  analysisId: string;
  organizationId?: string;
  userId?: string;
  baselineScenario?: string;
  circularScenario?: string;
  transportDistanceKm?: number;
}

let redisConnection: IORedis | null = null;
let carbonQueueInstance: Queue<CarbonJobData> | null = null;

export function getCarbonQueue(): Queue<CarbonJobData> | null {
  const REDIS_URL = process.env.REDIS_URL;
  if (!REDIS_URL) {
    return null;
  }
  if (!carbonQueueInstance) {
    try {
      if (!redisConnection) {
        redisConnection = new IORedis(REDIS_URL, {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          retryStrategy: (times) => Math.min(times * 100, 3000),
        });
        redisConnection.on("error", (err) => {
          console.warn(`[BullMQ CarbonQueue] Redis issue: ${err.message}. Direct fallback active.`);
        });
      }

      carbonQueueInstance = new Queue<CarbonJobData>(CARBON_QUEUE_NAME, {
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
      console.warn(`[BullMQ CarbonQueue] Redis init skipped: ${err.message}`);
      return null;
    }
  }
  return carbonQueueInstance;
}

export async function enqueueCarbonJob(
  data: CarbonJobData
): Promise<{ enqueued: boolean; jobId: string }> {
  const jobId = `carbon-${data.analysisId}`;
  const queue = getCarbonQueue();

  if (queue) {
    try {
      const job = await queue.add("calculate-impact", data, {
        jobId,
      });
      return { enqueued: true, jobId: job.id || jobId };
    } catch (err: any) {
      console.warn(`[CarbonQueue] Redis enqueue error (${err.message}), running fallback.`);
    }
  }

  // Resilient fallback direct execution when Redis is unavailable
  try {
    const { runCarbonWorkerJob } = await import("@/queues/carbon.worker");
    await runCarbonWorkerJob(data);
    return { enqueued: true, jobId: `${jobId}-direct` };
  } catch (err: any) {
    console.error(`[CarbonQueue Fallback] Worker execution error:`, err.message);
    throw err;
  }
}
