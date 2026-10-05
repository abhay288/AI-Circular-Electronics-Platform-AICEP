import { analysisPipeline } from "@/services/pipeline.service";
import { enqueueDetectionJob } from "@/queues/detection.queue";

export interface QueueJob<T = any> {
  id: string;
  name: string;
  data: T;
  timestamp: number;
}

export type JobHandler<T = any> = (job: QueueJob<T>) => Promise<any>;

/**
 * BullMQ / Redis Dispatcher with resilient fallback for local / serverless Next.js runtimes.
 */
class QueueManager {
  private redisUrl: string | undefined;

  constructor() {
    this.redisUrl = process.env.REDIS_URL;
  }

  async enqueueAnalysis(analysisId: string, assetId?: string) {
    console.log(`[QueueManager] Enqueuing detection & analysis pipeline for analysisId=${analysisId}`);
    
    try {
      const jobResult = await enqueueDetectionJob({ analysisId, assetId });
      return {
        jobId: jobResult.jobId,
        status: "enqueued",
        queue: "detection-queue",
        mode: jobResult.mode,
      };
    } catch (err: any) {
      console.warn(`[QueueManager] Direct queue enqueue failed (${err.message}), falling back to direct pipeline.`);
      
      setImmediate(async () => {
        try {
          await analysisPipeline.runPipeline(analysisId);
          console.log(`[QueueManager] Pipeline completed for analysisId=${analysisId}`);
        } catch (pipeErr: any) {
          console.error(`[QueueManager] Pipeline failed for analysisId=${analysisId}:`, pipeErr.message);
        }
      });

      return {
        jobId: `job-${analysisId}-${Date.now()}`,
        status: "enqueued",
        queue: "analysisPipelineQueue",
        mode: "FALLBACK_DIRECT",
      };
    }
  }
}

export const queueManager = new QueueManager();
export default queueManager;
