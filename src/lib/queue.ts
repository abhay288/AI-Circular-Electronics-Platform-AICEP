import { analysisPipeline } from "@/services/pipeline.service";

export interface QueueJob<T = any> {
  id: string;
  name: string;
  data: T;
  timestamp: number;
}

export type JobHandler<T = any> = (job: QueueJob<T>) => Promise<any>;

/**
 * Resilient Dispatcher for the unified image-only AI analysis pipeline.
 */
class QueueManager {
  async enqueueAnalysis(analysisId: string, _assetId?: string) {
    console.log(`[QueueManager] Enqueuing unified real AI analysis pipeline for analysisId=${analysisId}`);

    // Asynchronously run the real AI pipeline without blocking HTTP response
    setImmediate(async () => {
      try {
        await analysisPipeline.runPipeline(analysisId);
        console.log(`[QueueManager] Real AI pipeline successfully completed for analysisId=${analysisId}`);
      } catch (pipeErr: any) {
        console.error(`[QueueManager] Pipeline execution error on ${analysisId}:`, pipeErr.message);
      }
    });

    return {
      jobId: `job-${analysisId}-${Date.now()}`,
      status: "enqueued",
      queue: "analysisPipelineQueue",
      mode: "UNIFIED_PIPELINE",
    };
  }
}

export const queueManager = new QueueManager();
export default queueManager;
