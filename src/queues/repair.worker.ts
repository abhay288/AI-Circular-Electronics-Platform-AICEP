import { Worker, Job } from "bullmq";
import connectDB from "@/lib/db";
import IORedis from "ioredis";
import AnalysisSession from "@/models/AnalysisSession";
import Component from "@/models/Component";
import PCBAnalysis from "@/models/PCBAnalysis";
import RULPrediction from "@/models/RULPrediction";
import MaterialRecovery from "@/models/MaterialRecovery";
import RepairAssessment from "@/models/RepairAssessment";
import AuditLog from "@/models/AuditLog";
import { REPAIR_QUEUE_NAME, RepairJobData } from "./repair.queue";
import { getRepairProvider } from "@/providers/repair/repair.provider";
import { DigitalPassportService } from "@/services/passport.service";

export async function runRepairWorkerJob(data: RepairJobData): Promise<any> {
  await connectDB();

  const session = await AnalysisSession.findOne({
    $or: [{ analysisId: data.analysisId }, { sessionId: data.analysisId }],
  });

  if (!session) {
    throw new Error(`[RepairWorker] AnalysisSession ${data.analysisId} not found.`);
  }

  session.currentStage = "REPAIR_PROCESSING";
  session.stageStatuses.repair = "processing";
  session.progress = Math.max(session.progress, 80);
  session.markModified("stageStatuses");
  await session.save();

  // Load context from prior stages
  const [components, pcbDoc, rulDoc, matDoc] = await Promise.all([
    Component.find({ analysisId: session.analysisId }),
    PCBAnalysis.findOne({ analysisId: session.analysisId }),
    RULPrediction.findOne({ analysisId: session.analysisId }),
    MaterialRecovery.findOne({ analysisId: session.analysisId }),
  ]);

  const repairProvider = getRepairProvider();

  const repairResult = await repairProvider.assess({
    analysisId: session.analysisId,
    sampleId: session.sampleId,
    components,
    damagedRegions: pcbDoc?.damagedRegions || [],
    traces: pcbDoc?.traces || [],
    pads: pcbDoc?.pads || [],
    rulResult: rulDoc || session.rulResult,
    materialRecoveryResult: matDoc || session.metalResult,
  });

  // Load existing doc to preserve executed / completed historical repair states
  const existingDoc = await RepairAssessment.findOne({ analysisId: session.analysisId });
  let finalRecommendations = repairResult.repairRecommendations;

  if (existingDoc && existingDoc.repairRecommendations?.length > 0) {
    finalRecommendations = repairResult.repairRecommendations.map((newRec) => {
      const match = existingDoc.repairRecommendations.find(
        (oldRec) =>
          oldRec.recommendationId === newRec.recommendationId ||
          (oldRec.componentId === newRec.componentId && oldRec.action === newRec.action)
      );
      if (match && match.status !== "RECOMMENDED") {
        return match;
      }
      return newRec;
    });

    for (const oldRec of existingDoc.repairRecommendations) {
      if (
        (oldRec.status === "COMPLETED" ||
          oldRec.status === "REJECTED" ||
          oldRec.status === "CANCELLED") &&
        !finalRecommendations.some((r) => r.recommendationId === oldRec.recommendationId)
      ) {
        finalRecommendations.push(oldRec);
      }
    }
  }

  // Idempotently upsert RepairAssessment document
  const repairDoc = await RepairAssessment.findOneAndUpdate(
    { analysisId: session.analysisId },
    {
      analysisId: session.analysisId,
      status: repairResult.status,
      overallRepairability: repairResult.overallRepairability,
      overallRecommendation: repairResult.overallRecommendation,
      decisionScore: repairResult.decisionScore,
      componentAssessments: repairResult.componentAssessments,
      repairRecommendations: finalRecommendations,
      circularityDecision: repairResult.circularityDecision,
      decisionMatrix: repairResult.decisionMatrix,
      evidence: repairResult.evidence,
      limitations: repairResult.limitations,
      provider: repairResult.provider,
      modelVersion: repairResult.modelVersion,

      // Legacy compatibility fields
      recommendedAction: (repairResult.overallRecommendation as any) || "REFURBISH",
      primaryFault:
        repairResult.repairRecommendations[0]?.reason ||
        "Thermal stress detected on power regulation circuit",
      estimatedRepairCostINR: 1250,
      estimatedRepairCostUSD: 14.5,
      estimatedCO2SavingsKg: 28.4,
      feasibilityIndexPercent: repairResult.decisionScore,
      confidence: repairResult.circularityDecision?.decisionConfidence || 0.9,
      issues: repairResult.repairRecommendations.map((r) => ({
        componentId: r.componentId,
        componentName: r.componentName || "Component",
        issue: r.reason,
        severity: (r.priority === "CRITICAL" ? "HIGH" : r.priority) as any,
        confidence: r.confidence,
        recommendation: r.expectedOutcome,
        reason: r.reason,
        suggestedAction: r.action,
      })),
    },
    { upsert: true, new: true }
  );

  // Update session
  session.repairAssessmentId = repairDoc._id;
  session.repairResult = {
    reportId: `REP-${session.analysisId}`,
    recommendedAction: repairResult.overallRecommendation.toLowerCase() as any,
    decisionScore: repairResult.decisionScore,
    overallRepairability: repairResult.overallRepairability,
    circularityRecommendation: repairResult.overallRecommendation,
    recommendationsCount: repairResult.repairRecommendations.length,
    issues: repairResult.repairRecommendations.map((r) => ({
      component: r.componentName || r.componentId || "Component",
      issue: r.reason,
      severity: r.priority.toLowerCase() as any,
      recommendation: r.expectedOutcome,
      action: r.action,
    })),
  };

  session.status = "REPAIR_COMPLETE";
  session.currentStage = "PASSPORT"; // Ready for Phase 7 Digital Product Passport
  session.stageStatuses.repair = "completed";
  session.stageStatuses.passport = "pending";
  session.progress = Math.max(session.progress, 88);
  session.markModified("stageStatuses");
  await session.save();

  // Audit Log
  await AuditLog.create({
    analysisId: session.analysisId,
    userId: session.userId ? String(session.userId) : "system-user",
    organizationId: session.organizationId ? String(session.organizationId) : undefined,
    action: "REPAIR_ASSESSMENT_COMPLETED",
    resource: "RepairAssessment",
    resourceId: String(repairDoc._id),
    metadata: {
      recommendation: repairResult.overallRecommendation,
      decisionScore: repairResult.decisionScore,
      actionableCount: repairResult.repairRecommendations.length,
    },
    timestamp: new Date(),
  });

  // Phase 7 Integration: Update or synthesize Digital Product Passport
  try {
    const passportService = new DigitalPassportService();
    await passportService.createFromAnalysis(session.analysisId, {
      actor: "Repair Intelligence Engine",
    });
  } catch (err: any) {
    console.warn(`[RepairWorker] Phase 7 Passport auto-sync notice: ${err.message}`);
  }

  return repairDoc;
}

export function createRepairWorker(): Worker | null {
  const REDIS_URL = process.env.REDIS_URL;
  if (!REDIS_URL) {
    return null;
  }

  const connection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  const worker = new Worker(
    REPAIR_QUEUE_NAME,
    async (job: Job<RepairJobData>) => {
      return runRepairWorkerJob(job.data);
    },
    { connection: connection as any, concurrency: 2 }
  );

  worker.on("completed", (job) => {
    console.log(`[RepairWorker] Job ${job.id} completed for ${job.data.analysisId}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[RepairWorker] Job ${job?.id} failed for ${job?.data.analysisId}:`, err);
  });

  return worker;
}
