import { Queue } from "bullmq";
import IORedis from "ioredis";
import { ReportType } from "@/models/Report";

export const REPORT_QUEUE_NAME = "report-generation";

export interface ReportJobData {
  reportId?: string;
  analysisId?: string;
  organizationId?: string;
  reportType?: ReportType;
  format?: "PDF" | "JSON" | "CSV";
  generatedBy?: string;
}

let redisConnection: IORedis | null = null;
let reportQueueInstance: Queue<ReportJobData> | null = null;

export function getReportQueue(): Queue<ReportJobData> | null {
  const REDIS_URL = process.env.REDIS_URL;
  if (!REDIS_URL) {
    return null;
  }
  if (!reportQueueInstance) {
    try {
      if (!redisConnection) {
        redisConnection = new IORedis(REDIS_URL, {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          retryStrategy: (times) => Math.min(times * 100, 3000),
        });
        redisConnection.on("error", (err) => {
          console.warn(`[BullMQ ReportQueue] Redis issue: ${err.message}. Direct fallback active.`);
        });
      }

      reportQueueInstance = new Queue<ReportJobData>(REPORT_QUEUE_NAME, {
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
      console.warn(`[BullMQ ReportQueue] Redis init skipped: ${err.message}`);
      return null;
    }
  }
  return reportQueueInstance;
}

export async function enqueueReportJob(
  data: ReportJobData
): Promise<{ enqueued: boolean; jobId: string }> {
  const jobId = `report-${data.analysisId || data.organizationId || Date.now()}`;
  const queue = getReportQueue();

  if (queue) {
    try {
      const job = await queue.add("generate-report", data, {
        jobId,
      });
      return { enqueued: true, jobId: job.id || jobId };
    } catch (err: any) {
      console.warn(`[ReportQueue] Redis enqueue error (${err.message}), running fallback.`);
    }
  }

  // Resilient fallback direct execution when Redis is unavailable
  try {
    const { runReportWorkerJob } = await import("@/queues/report.worker");
    const result = await runReportWorkerJob(data);
    return { enqueued: true, jobId: result.reportId || `${jobId}-direct` };
  } catch (err: any) {
    console.error(`[ReportQueue Fallback] Worker execution error:`, err.message);
    throw err;
  }
}
