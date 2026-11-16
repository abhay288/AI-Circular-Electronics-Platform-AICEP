import { Worker, Job } from "bullmq";
import connectDB from "@/lib/db";
import AnalysisSession from "@/models/AnalysisSession";
import DetectionResult from "@/models/DetectionResult";
import Component from "@/models/Component";
import PCBAnalysis from "@/models/PCBAnalysis";
import MaterialRecovery from "@/models/MaterialRecovery";
import AuditLog from "@/models/AuditLog";
import materialRecoveryService from "@/providers/materials/materials.provider";
import { MaterialJobPayload, redisConnection } from "./material.queue";
import { ComponentMaterialInput, PCBMaterialInput } from "@/lib/materials/materialTaxonomy";

/**
 * Core asynchronous execution unit for Material Recovery Intelligence.
 * Can be invoked directly via in-process async scheduler or BullMQ worker.
 */
export async function runMaterialWorkerJob(payload: MaterialJobPayload) {
  const startTime = Date.now();
  const { analysisId } = payload;

  await connectDB();

  const session = await AnalysisSession.findOne({ analysisId });
  if (!session) {
    throw new Error(`[MaterialWorker] AnalysisSession ${analysisId} not found.`);
  }

  try {
    // 1. Update session status to MATERIALS_PROCESSING
    session.status = "MATERIALS_PROCESSING";
    session.currentStage = "MATERIALS";
    session.stageStatuses = {
      ...(session.stageStatuses || {}),
      materials: "processing",
    };
    session.progress = Math.max(session.progress, 68);
    session.markModified("stageStatuses");
    await session.save();

    // Audit: MATERIAL_ANALYSIS_STARTED
    await AuditLog.create({
      analysisId: session.analysisId,
      userId: session.userId ? String(session.userId) : "system-user",
      organizationId: session.organizationId ? String(session.organizationId) : undefined,
      action: "MATERIAL_ANALYSIS_STARTED",
      resource: "AnalysisSession",
      resourceId: session.analysisId,
      metadata: {
        stage: "MATERIALS",
        provider: process.env.MATERIAL_PROVIDER || "mock",
        durationMs: 0,
      },
    });

    // 2. Load Phase 2 & Phase 3 records in parallel
    const [components, pcbDoc] = await Promise.all([
      Component.find({ analysisId: session.analysisId }).lean(),
      PCBAnalysis.findOne({ analysisId: session.analysisId }).lean(),
    ]);

    // 3. Assemble MaterialRecoveryInput contract
    const componentInputs: ComponentMaterialInput[] = components.map((c: any) => ({
      componentId: c.serialNumber || c.name || String(c._id),
      componentType: c.type || "Component",
      packageType: c.package || "SMD",
      manufacturer: c.manufacturer,
      partNumber: c.partNumber,
      estimatedMassGrams: c.metadata?.massGrams,
      detectionConfidence: c.confidence,
    }));

    let boardAreaCm2: number | undefined;
    if (pcbDoc?.board?.estimatedPhysicalWidthMm && pcbDoc?.board?.estimatedPhysicalHeightMm) {
      boardAreaCm2 = +(
        (pcbDoc.board.estimatedPhysicalWidthMm * pcbDoc.board.estimatedPhysicalHeightMm) /
        100
      ).toFixed(2);
    } else if (pcbDoc?.board?.widthPixels && pcbDoc?.board?.heightPixels) {
      // Approximate physical area assuming 10 pixels/mm standard inspection resolution
      const approxW = pcbDoc.board.widthPixels / 10;
      const approxH = pcbDoc.board.heightPixels / 10;
      boardAreaCm2 = +((approxW * approxH) / 100).toFixed(2);
    }

    const pcbMaterialInput: PCBMaterialInput = {
      boardType: (pcbDoc as any)?.boardModel || "FR-4 Multi-layer Substrate",
      boardAreaCm2,
      layerCount: pcbDoc?.layers?.estimatedCount || 2,
      surfaceFinish: "ENIG",
    };

    // 4. Run Material Recovery Provider
    const matOutput = await materialRecoveryService.estimate({
      analysisId: session.analysisId,
      sampleId: session.sampleId,
      boardMassGrams: payload.boardMassGrams || session.metadata?.boardMassGrams,
      boardAreaCm2,
      componentCount: components.length,
      components: componentInputs,
      pcbAnalysis: pcbMaterialInput,
      additionalMetadata: payload.additionalMetadata,
    });

    // 5. Persist MaterialRecovery document (Idempotent upsert)
    const matDoc = await MaterialRecovery.findOneAndUpdate(
      { analysisId: session.analysisId },
      {
        analysisId: session.analysisId,
        status: matOutput.status === "INSUFFICIENT_DATA" ? "INSUFFICIENT_DATA" : "COMPLETED",
        boardMass: matOutput.boardMass,
        materialSummary: matOutput.materialSummary,
        preciousMetals: matOutput.preciousMetals,
        baseMetals: matOutput.baseMetals,
        criticalMaterials: matOutput.criticalMaterials,
        totalEstimatedMaterialMassGrams: matOutput.totalEstimatedMaterialMassGrams,
        totalRecoverableMaterialMassGrams: matOutput.totalRecoverableMaterialMassGrams,
        recoveryScenarios: matOutput.recoveryScenarios,
        componentContributions: matOutput.componentContributions,
        confidence: matOutput.confidence,
        dataCompleteness: matOutput.dataCompleteness,
        materialSources: matOutput.materialSources,
        limitations: matOutput.limitations,
        provider: matOutput.provider,
        modelVersion: matOutput.modelVersion,
        databaseVersion: matOutput.databaseVersion,

        // Legacy compatibility
        pcbWeightKg: matOutput.pcbWeightKg,
        recoveryEfficiencyPercent: matOutput.recoveryEfficiencyPercent,
        totalEstimatedMarketValueINR: matOutput.totalEstimatedMarketValueINR,
        totalEstimatedMarketValueUSD: matOutput.totalEstimatedMarketValueUSD,
        materials: matOutput.materials,
        method: matOutput.method,
        source: matOutput.source,
      },
      { upsert: true, new: true }
    );

    // 6. Update individual Component records with material profiles & recovery priority
    if (matOutput.componentContributions && matOutput.componentContributions.length > 0) {
      for (const contrib of matOutput.componentContributions) {
        let goldG = 0;
        let silverG = 0;
        let copperG = 0;
        let palladiumG = 0;

        for (const m of contrib.materials || []) {
          if (m.material === "Gold") goldG += m.estimatedMassGrams;
          if (m.material === "Silver") silverG += m.estimatedMassGrams;
          if (m.material === "Copper") copperG += m.estimatedMassGrams;
          if (m.material === "Palladium") palladiumG += m.estimatedMassGrams;
        }

        await Component.findOneAndUpdate(
          {
            analysisId: session.analysisId,
            $or: [{ serialNumber: contrib.componentId }, { name: contrib.componentId }],
          },
          {
            $set: {
              "materialProfile.goldGrams": goldG,
              "materialProfile.silverGrams": silverG,
              "materialProfile.copperGrams": copperG,
              "materialProfile.palladiumGrams": palladiumG,
              "metadata.recoveryPriority": contrib.recoveryPriority,
              "metadata.primaryRecoverableMetal": contrib.primaryRecoverableMetal,
              // Components with high recovery priority or reusable health are circular assets
              marketplaceEligible: contrib.recoveryPriority === "HIGH" || contrib.recoveryPriority === "MEDIUM",
            },
          }
        );
      }
    }

    // 7. Update AnalysisSession
    session.materialRecoveryId = matDoc._id;
    session.metalResult = {
      pcbWeightKg: matOutput.pcbWeightKg,
      recoveryEfficiencyPercent: matOutput.recoveryEfficiencyPercent,
      totalEstimatedMarketValueINR: matOutput.totalEstimatedMarketValueINR,
      totalEstimatedMarketValueUSD: matOutput.totalEstimatedMarketValueUSD,
      totalEstimatedMaterialMassGrams: matOutput.totalEstimatedMaterialMassGrams,
      totalRecoverableMaterialMassGrams: matOutput.totalRecoverableMaterialMassGrams,
      preciousMetalsCount: matOutput.preciousMetals.filter((p) => p.presence === "DETECTED_ESTIMATED").length,
      yields: matOutput.materials.map((m) => ({
        metal: m.material,
        symbol: m.symbol,
        yieldGrams: m.estimatedQuantity,
        marketRateINR: m.marketRateINR,
        marketRateUSD: +(m.marketRateINR / 86.5).toFixed(2),
        estimatedValueINR: m.estimatedValueINR,
        estimatedValueUSD: +(m.estimatedValueINR / 86.5).toFixed(2),
      })),
    };

    // Lifecycle progression: Halts at MATERIAL_COMPLETE / currentStage = "REPAIR"
    session.status = "MATERIAL_COMPLETE";
    session.currentStage = "REPAIR"; // Phase 5 complete, Phase 6 Repair queued/pending
    session.stageStatuses.materials = "completed";
    session.stageStatuses.repair = "pending";
    session.progress = Math.max(session.progress, 75);
    session.markModified("stageStatuses");
    await session.save();

    // Audit: MATERIAL_ANALYSIS_COMPLETED
    await AuditLog.create({
      analysisId: session.analysisId,
      userId: session.userId ? String(session.userId) : "system-user",
      organizationId: session.organizationId ? String(session.organizationId) : undefined,
      action: "MATERIAL_ANALYSIS_COMPLETED",
      resource: "MaterialRecovery",
      resourceId: String(matDoc._id),
      metadata: {
        totalMaterialMassGrams: matOutput.totalEstimatedMaterialMassGrams,
        recoverableMassGrams: matOutput.totalRecoverableMaterialMassGrams,
        confidenceScore: matOutput.confidence.score,
        provider: matOutput.provider,
        modelVersion: matOutput.modelVersion,
        durationMs: Date.now() - startTime,
      },
    });

    return {
      success: true,
      materialRecoveryId: matDoc._id,
      status: "MATERIAL_COMPLETE",
      totalMaterialMassGrams: matOutput.totalEstimatedMaterialMassGrams,
      recoverableMassGrams: matOutput.totalRecoverableMaterialMassGrams,
    };
  } catch (err: any) {
    console.error(`[MaterialWorker Error on ${analysisId}]:`, err.message);

    session.status = "MATERIALS_FAILED";
    session.error = {
      code: "MATERIAL_ANALYSIS_FAILED",
      message: err.message || "Material recovery analysis failed.",
      stage: "MATERIALS",
    };
    session.stageStatuses.materials = "failed";
    session.markModified("stageStatuses");
    await session.save();

    // Audit: MATERIAL_ANALYSIS_FAILED
    await AuditLog.create({
      analysisId: session.analysisId,
      userId: session.userId ? String(session.userId) : "system-user",
      organizationId: session.organizationId ? String(session.organizationId) : undefined,
      action: "MATERIAL_ANALYSIS_FAILED",
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
let materialWorker: Worker<MaterialJobPayload> | null = null;

if (redisConnection && process.env.REDIS_URL) {
  try {
    materialWorker = new Worker<MaterialJobPayload>(
      "material-analysis",
      async (job: Job<MaterialJobPayload>) => {
        console.log(`[MaterialWorker] Processing job ${job.id} for analysis ${job.data.analysisId}`);
        return await runMaterialWorkerJob(job.data);
      },
      {
        connection: redisConnection,
        concurrency: 4,
      }
    );

    materialWorker.on("completed", (job) => {
      console.log(`[MaterialWorker] Job ${job.id} completed successfully.`);
    });

    materialWorker.on("failed", (job, err) => {
      console.error(`[MaterialWorker] Job ${job?.id} failed:`, err.message);
    });
  } catch (err: any) {
    console.warn(`[MaterialWorker] Failed to initialize BullMQ Worker:`, err.message);
  }
}

export { materialWorker };
