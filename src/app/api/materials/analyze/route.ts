import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AnalysisSession } from "@/models/AnalysisSession";
import { Component } from "@/models/Component";
import { PCBAnalysis } from "@/models/PCBAnalysis";
import { MaterialRecovery } from "@/models/MaterialRecovery";
import { AuditLog } from "@/models/AuditLog";
import { materialRecoveryService } from "@/providers/materials/materials.provider";
import { MaterialAnalyzeRequestSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const rawBody = await req.json();

    const parseResult = MaterialAnalyzeRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid Material analysis request parameters",
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const {
      analysisId,
      boardMassGrams,
      boardAreaCm2,
      manufacturer,
      partNumber,
      additionalMetadata,
    } = parseResult.data;

    const session = await AnalysisSession.findOne({
      $or: [{ analysisId }, { sessionId: analysisId }],
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `Analysis session '${analysisId}' was not found.`,
          },
        },
        { status: 404 }
      );
    }

    const startTime = Date.now();

    // 1. Load Phase 2 Components & Phase 3 PCBAnalysis
    const [components, pcbDoc] = await Promise.all([
      Component.find({ analysisId: session.analysisId }).lean(),
      PCBAnalysis.findOne({ analysisId: session.analysisId }).lean(),
    ]);

    let calcBoardAreaCm2 = boardAreaCm2;
    if (!calcBoardAreaCm2 && pcbDoc?.board?.estimatedPhysicalWidthMm && pcbDoc?.board?.estimatedPhysicalHeightMm) {
      calcBoardAreaCm2 = +(
        (pcbDoc.board.estimatedPhysicalWidthMm * pcbDoc.board.estimatedPhysicalHeightMm) /
        100
      ).toFixed(2);
    } else if (!calcBoardAreaCm2 && pcbDoc?.board?.widthPixels && pcbDoc?.board?.heightPixels) {
      const approxW = pcbDoc.board.widthPixels / 10;
      const approxH = pcbDoc.board.heightPixels / 10;
      calcBoardAreaCm2 = +((approxW * approxH) / 100).toFixed(2);
    }

    // 2. Run Material Recovery Provider
    const matOutput = await materialRecoveryService.estimate({
      analysisId: session.analysisId,
      sampleId: session.sampleId,
      boardMassGrams: boardMassGrams || session.metadata?.boardMassGrams,
      boardAreaCm2: calcBoardAreaCm2,
      componentCount: components.length,
      components: components.map((c: any) => ({
        componentId: c.serialNumber || c.name || String(c._id),
        componentType: c.type || "Component",
        packageType: c.package || "SMD",
        manufacturer: c.manufacturer,
        partNumber: c.partNumber,
        estimatedMassGrams: c.metadata?.massGrams,
        detectionConfidence: c.confidence,
      })),
      pcbAnalysis: {
        boardType: (pcbDoc as any)?.boardModel || "FR-4 Substrate",
        boardAreaCm2: calcBoardAreaCm2,
        layerCount: pcbDoc?.layers?.estimatedCount || 2,
        surfaceFinish: "ENIG",
      },
      manufacturer,
      partNumber,
      additionalMetadata,
    });

    // 3. Upsert MaterialRecovery document
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

    // 4. Sync component-level material profiles
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

        await Component.updateOne(
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
              marketplaceEligible: contrib.recoveryPriority === "HIGH" || contrib.recoveryPriority === "MEDIUM",
            },
          }
        );
      }
    }

    // 5. Update session
    session.materialRecoveryId = matDoc._id;
    session.metalResult = {
      pcbWeightKg: matOutput.pcbWeightKg,
      recoveryEfficiencyPercent: matOutput.recoveryEfficiencyPercent,
      totalEstimatedMarketValueINR: matOutput.totalEstimatedMarketValueINR,
      totalEstimatedMarketValueUSD: matOutput.totalEstimatedMarketValueUSD,
      totalEstimatedMaterialMassGrams: matOutput.totalEstimatedMaterialMassGrams,
      totalRecoverableMaterialMassGrams: matOutput.totalRecoverableMaterialMassGrams,
      preciousMetalsCount: matOutput.preciousMetals.filter((p: any) => p.presence === "DETECTED_ESTIMATED").length,
      yields: (matOutput.materials || []).map((m: any) => ({
        metal: m.material,
        symbol: m.symbol,
        yieldGrams: m.estimatedQuantity,
        marketRateINR: m.marketRateINR,
        marketRateUSD: +(m.marketRateINR / 86.5).toFixed(2),
        estimatedValueINR: m.estimatedValueINR,
        estimatedValueUSD: +(m.estimatedValueINR / 86.5).toFixed(2),
      })),
    };
    session.status = "MATERIAL_COMPLETE";
    session.stageStatuses.materials = "completed";
    session.stageStatuses.repair = "pending";
    session.currentStage = "REPAIR";
    session.progress = Math.max(session.progress, 75);
    session.markModified("stageStatuses");
    await session.save();

    // 6. Audit Log
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
        provider: matOutput.provider,
        durationMs: Date.now() - startTime,
      },
    });

    return NextResponse.json({
      success: true,
      materialRecoveryId: matDoc._id,
      analysisId: session.analysisId,
      status: matDoc.status,
      materialRecovery: matDoc,
    });
  } catch (error: any) {
    console.error("[API Material Analyze Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MATERIAL_ANALYSIS_ERROR",
          message: error.message || "Material recovery analysis failed",
        },
      },
      { status: 500 }
    );
  }
}
