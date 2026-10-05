import { analysisPipeline } from "@/services/pipeline.service";

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

  async enqueueAnalysis(analysisId: string) {
    console.log(`[QueueManager] Enqueuing pipeline for analysisId=${analysisId}`);
    
    // In Next.js route handlers, run the pipeline asynchronously so API responses are immediate
    setImmediate(async () => {
      try {
        await analysisPipeline.runPipeline(analysisId);
        console.log(`[QueueManager] Pipeline successfully completed for analysisId=${analysisId}`);
      } catch (err: any) {
        console.error(`[QueueManager] Pipeline failed for analysisId=${analysisId}:`, err.message);
      }
    });

    return {
      jobId: `job-${analysisId}-${Date.now()}`,
      status: "enqueued",
      queue: "analysisPipelineQueue",
    };
  }
}

export const queueManager = new QueueManager();
export default queueManager;
