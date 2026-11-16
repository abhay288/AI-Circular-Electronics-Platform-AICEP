import { Worker, Job } from "bullmq";
import connectDB from "@/lib/db";
import IORedis from "ioredis";
import AnalysisSession from "@/models/AnalysisSession";
import AuditLog from "@/models/AuditLog";
import { CARBON_QUEUE_NAME, CarbonJobData } from "./carbon.queue";
import { CarbonImpactService } from "@/services/carbon/carbonImpact.service";

export async function runCarbonWorkerJob(data: CarbonJobData): Promise<any> {
  await connectDB();

  const session = await AnalysisSession.findOne({
    $or: [{ analysisId: data.analysisId }, { sessionId: data.analysisId }],
  });

  if (!session) {
    throw new Error(`[CarbonWorker] AnalysisSession ${data.analysisId} not found.`);
  }

  session.currentStage = "CARBON_PROCESSING";
  session.stageStatuses.carbon = "processing";
  session.progress = Math.max(session.progress, 95);
  session.markModified("stageStatuses");
  await session.save();

  try {
    const carbonDoc = await CarbonImpactService.calculateAssetImpact(session.analysisId, {
      organizationId: data.organizationId || session.organizationId?.toString(),
      userId: data.userId || session.userId?.toString(),
      baselineScenario: (data.baselineScenario as any) || "DISCARD",
      circularScenario: (data.circularScenario as any) || "REPAIR",
      transportDistanceKm: data.transportDistanceKm,
    });

    session.carbonImpactId = carbonDoc._id;
    session.carbonResult = {
      co2AvoidedKg: carbonDoc.netAvoidedCO2e,
      totalAvoidedCO2e: carbonDoc.totalAvoidedCO2e,
      grossAvoidedCO2e: carbonDoc.grossAvoidedCO2e,
      additionalImpactCO2e: carbonDoc.additionalImpactCO2e,
      netAvoidedCO2e: carbonDoc.netAvoidedCO2e,
      divertedWasteKg: carbonDoc.waste.divertedWasteKg,
      circularityScore: carbonDoc.circularityScore,
      dataQuality: carbonDoc.dataQuality,
      uncertainty: carbonDoc.uncertainty,
      methodology: carbonDoc.methodology,
    };
    session.stageStatuses.carbon = "completed";
    session.status = "CARBON_COMPLETE";
    session.progress = Math.max(session.progress, 98);
    session.markModified("stageStatuses");
    await session.save();

    await AuditLog.create({
      analysisId: session.analysisId,
      organizationId: session.organizationId?.toString(),
      userId: data.userId || "system",
      action: "CARBON_IMPACT_CALCULATED",
      resource: "CarbonImpact",
      resourceId: String(carbonDoc._id),
      metadata: {
        netAvoidedCO2e: carbonDoc.netAvoidedCO2e,
        divertedWasteKg: carbonDoc.waste.divertedWasteKg,
        circularityScore: carbonDoc.circularityScore,
      },
      timestamp: new Date(),
    });

    return carbonDoc;
  } catch (err: any) {
    session.stageStatuses.carbon = "failed";
    session.markModified("stageStatuses");
    await session.save();
    console.error(`[CarbonWorker Error on ${session.analysisId}]:`, err);
    throw err;
  }
}

// Background Redis Worker if Redis is configured
if (process.env.REDIS_URL) {
  try {
    const workerRedis = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    const carbonWorker = new Worker<CarbonJobData>(
      CARBON_QUEUE_NAME,
      async (job: Job<CarbonJobData>) => {
        return await runCarbonWorkerJob(job.data);
      },
      { connection: workerRedis, concurrency: 2 }
    );

    carbonWorker.on("completed", (job) => {
      console.log(`[BullMQ CarbonWorker] Job ${job.id} completed for ${job.data.analysisId}`);
    });

    carbonWorker.on("failed", (job, err) => {
      console.error(`[BullMQ CarbonWorker] Job ${job?.id} failed:`, err.message);
    });
  } catch (err: any) {
    console.warn(`[BullMQ CarbonWorker] Worker registration skipped: ${err.message}`);
  }
}
