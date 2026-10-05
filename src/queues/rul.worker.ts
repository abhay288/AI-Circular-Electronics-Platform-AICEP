import { Worker, Job } from "bullmq";
import dbConnect from "@/lib/db";
import { AnalysisSession } from "@/models/AnalysisSession";
import { Component } from "@/models/Component";
import { PCBAnalysis } from "@/models/PCBAnalysis";
import { RULPrediction } from "@/models/RULPrediction";
import { AuditLog } from "@/models/AuditLog";
import { rulService } from "@/providers/rul/rul.provider";
import { redisConnection, RULJobPayload } from "./rul.queue";

/**
 * Core business logic for executing a Health Assessment & RUL Prediction Job
 */
export async function runRULWorkerJob(payload: RULJobPayload) {
  await dbConnect();
  const { analysisId } = payload;

  const session = await AnalysisSession.findOne({
    $or: [{ analysisId }, { sessionId: analysisId }],
  });
  if (!session) {
    throw new Error(`AnalysisSession not found for analysisId=${analysisId}`);
  }

  // Idempotency check: if RUL prediction is already completed, do not duplicate
  const existingRUL = await RULPrediction.findOne({ analysisId: session.analysisId });
  if (existingRUL && (session.status === "RUL_COMPLETE" || session.stageStatuses?.rul === "completed")) {
    console.log(`[RULWorker] RUL Prediction already completed for analysisId=${session.analysisId}. Skipping duplicate work.`);
    return {
      success: true,
      rulPredictionId: existingRUL._id,
      reused: true,
    };
  }

  const startTime = Date.now();

  // Audit: RUL_PREDICTION_STARTED
  await AuditLog.create({
    analysisId: session.analysisId,
    userId: session.userId ? String(session.userId) : "system-user",
    action: "RUL_PREDICTION_STARTED",
    resource: "AnalysisSession",
    resourceId: session.analysisId,
    metadata: {
      provider: process.env.RUL_PROVIDER || "mock",
      sampleId: session.sampleId,
      timestamp: new Date().toISOString(),
    },
  });

  // Update session stage
  session.status = "RUL_PROCESSING";
  session.currentStage = "RUL";
  session.stageStatuses.rul = "processing";
  session.progress = Math.max(session.progress, 55);
  session.markModified("stageStatuses");
  await session.save();

  try {
    // 1. Load Phase 2 Components
    const componentDocs = await Component.find({ analysisId: session.analysisId });

    // 2. Load Phase 3 PCB Analysis
    const pcbDoc = await PCBAnalysis.findOne({ analysisId: session.analysisId });
    const pcbIntegrity =
      pcbDoc?.reconstruction?.visualIntegrityEstimate ||
      pcbDoc?.metrics?.visualIntegrityScore ||
      92.0;

    // Build component feature inputs
    const featureComponents = componentDocs.map((c) => ({
      componentId: c.serialNumber || String(c._id),
      componentType: c.type || "IC",
      manufacturer: c.manufacturer,
      partNumber: c.partNumber,
      packageType: c.package,
      visualDamageSeverity: pcbDoc?.damagedRegions?.length ? "MEDIUM" : "NONE",
      hasCorrosion: pcbDoc?.damagedRegions?.some((d) => d.type === "corrosion") || false,
      hasThermalDamage: pcbDoc?.damagedRegions?.some((d) => d.type === "burn_mark") || false,
    }));

    // 3. Call RUL Service (chooses Mock or XGBoost based on config)
    const rulOutput = await rulService.predict({
      analysisId: session.analysisId,
      sampleId: session.sampleId,
      pcbIntegrityScore: pcbIntegrity,
      temperatureC: session.rulResult?.parameters?.operatingTempCelsius || 45.0,
      voltageV: session.rulResult?.parameters?.inputVoltageVolts || 3.3,
      operatingCycles: session.rulResult?.parameters?.operatingCycles || 1800,
      componentAgeYears: session.rulResult?.parameters?.ageYears || 2.0,
      components: featureComponents,
    });

    // 4. Idempotent upsert of RULPrediction document
    const rulDoc = await RULPrediction.findOneAndUpdate(
      { analysisId: session.analysisId },
      {
        analysisId: session.analysisId,
        modelProvider: rulOutput.modelProvider || "MOCK",
        modelName: rulOutput.modelName || "EcoIntel-Degradation-XGBoost",
        modelVersion: rulOutput.modelVersion || "v1.2.0",
        datasetVersion: rulOutput.datasetVersion || "synthetic-reliability-v1",
        featureVersion: rulOutput.featureVersion || "rul-features-v1",

        healthScore: rulOutput.healthScore,
        healthStatus: rulOutput.healthStatus,
        healthConfidence: rulOutput.healthConfidence || rulOutput.confidence,
        healthFactors: rulOutput.healthFactors || [],

        rulHours: rulOutput.rulHours,
        rulDays: rulOutput.rulDays || Math.round(rulOutput.rulHours / 24),
        rulMonths: rulOutput.rulMonths || +(rulOutput.rulHours / 730).toFixed(1),
        rulYears: rulOutput.rulYears,
        rulCycles: rulOutput.rulCycles || 1800,

        predictionInterval: rulOutput.predictionInterval,
        confidence: rulOutput.confidence,
        uncertaintyHours: rulOutput.uncertaintyHours || Math.round(rulOutput.rulHours * 0.15),
        failureRisk: rulOutput.failureRisk || "LOW",
        riskLevel: rulOutput.riskLevel || "LOW",

        contributingFactors: rulOutput.contributingFactors || [],
        failureModes: rulOutput.failureModes || [],
        components: rulOutput.components || [],

        inputFeatures: rulOutput.inputFeatures || {},
        dataCompleteness: rulOutput.dataCompleteness || 80,
        missingFeatures: rulOutput.missingFeatures || [],
        limitations: rulOutput.limitations || [],
        provenance: rulOutput.provenance || "PREDICTED",
        status: rulOutput.status || "COMPLETED",

        // Legacy compatibility
        estimatedHours: rulOutput.rulHours,
        estimatedYears: rulOutput.rulYears,
        temperature: rulOutput.temperature || 45.0,
        voltage: rulOutput.voltage || 3.3,
        operationalCycles: rulOutput.rulCycles || 1800,
        age: rulOutput.age || 2.0,
        wear: rulOutput.wear || 14.0,
        corrosion: rulOutput.corrosion || 4.5,
        model: rulOutput.model || "Arrhenius-Degradation-XGB",
        version: rulOutput.version || "v1.2.0",
        provider: rulOutput.provider || "MOCK",
        predictionRange: rulOutput.predictionRange,
      },
      { upsert: true, new: true }
    );

    // 5. Update individual Component records with predicted health & RUL
    if (rulOutput.components && rulOutput.components.length > 0) {
      for (const compRes of rulOutput.components) {
        await Component.findOneAndUpdate(
          { analysisId: session.analysisId, serialNumber: compRes.componentId },
          {
            $set: {
              healthScore: compRes.healthScore,
              condition: compRes.healthStatus === "HEALTHY" || compRes.healthStatus === "GOOD" ? "REUSABLE" : "REFURBISHABLE",
              estimatedRUL: {
                hours: compRes.estimatedRULHours,
                years: compRes.estimatedRULYears,
              },
            },
          }
        );
      }
    }

    // 6. Update AnalysisSession
    session.rulPredictionId = rulDoc._id;
    session.rulResult = {
      overallHealthScore: rulOutput.healthScore,
      predictedYears: rulOutput.rulYears,
      predictedHours: rulOutput.rulHours,
      failureProbability: +(100 - rulOutput.healthScore).toFixed(1),
      confidence: rulOutput.confidence,
      parameters: {
        operatingTempCelsius: rulOutput.inputFeatures?.temperatureC || 45.0,
        inputVoltageVolts: rulOutput.inputFeatures?.voltageV || 3.3,
        operatingCycles: rulOutput.rulCycles || 1800,
        ageYears: rulOutput.inputFeatures?.componentAgeYears || 2.0,
      },
    };

    session.status = "RUL_COMPLETE";
    session.currentStage = "MATERIALS"; // Phase 5 queued, Phase 4 stops here
    session.stageStatuses.rul = "completed";
    session.stageStatuses.materials = "pending";
    session.progress = Math.max(session.progress, 65);
    session.markModified("stageStatuses");
    await session.save();

    // Audit: RUL_PREDICTION_COMPLETED
    await AuditLog.create({
      analysisId: session.analysisId,
      userId: session.userId ? String(session.userId) : "system-user",
      action: "RUL_PREDICTION_COMPLETED",
      resource: "RULPrediction",
      resourceId: String(rulDoc._id),
      metadata: {
        healthScore: rulOutput.healthScore,
        rulYears: rulOutput.rulYears,
        confidence: rulOutput.confidence,
        durationMs: Date.now() - startTime,
      },
    });

    return {
      success: true,
      rulPredictionId: rulDoc._id,
      status: "RUL_COMPLETE",
      healthScore: rulOutput.healthScore,
      healthStatus: rulOutput.healthStatus,
      rulYears: rulOutput.rulYears,
    };
  } catch (err: any) {
    console.error(`[RULWorker Error on ${analysisId}]:`, err.message);

    session.status = "RUL_FAILED";
    session.error = {
      code: "RUL_PREDICTION_FAILED",
      message: err.message || "Health & RUL assessment failed.",
      stage: "RUL",
    };
    session.stageStatuses.rul = "failed";
    session.markModified("stageStatuses");
    await session.save();

    // Audit: RUL_PREDICTION_FAILED
    await AuditLog.create({
      analysisId: session.analysisId,
      userId: session.userId ? String(session.userId) : "system-user",
      action: "RUL_PREDICTION_FAILED",
      resource: "AnalysisSession",
      resourceId: session.analysisId,
      metadata: {
        error: err.message,
        durationMs: Date.now() - startTime,
      },
    });

    throw err;
  }
}

// Start BullMQ Worker if Redis connection is active
let rulWorker: Worker<RULJobPayload> | null = null;

if (redisConnection && process.env.REDIS_URL) {
  try {
    rulWorker = new Worker<RULJobPayload>(
      "rul-queue",
      async (job: Job<RULJobPayload>) => {
        console.log(`[BullMQ RULWorker] Processing job ${job.id} for analysisId=${job.data.analysisId}`);
        return runRULWorkerJob(job.data);
      },
      {
        connection: redisConnection,
        concurrency: 2,
      }
    );

    rulWorker.on("completed", (job) => {
      console.log(`[BullMQ RULWorker] Job ${job.id} completed successfully.`);
    });

    rulWorker.on("failed", (job, err) => {
      console.error(`[BullMQ RULWorker] Job ${job?.id} failed:`, err.message);
    });
  } catch (workerInitErr: any) {
    console.warn(`[BullMQ RULWorker] Worker initialization skipped: ${workerInitErr.message}`);
  }
}

export { rulWorker };
