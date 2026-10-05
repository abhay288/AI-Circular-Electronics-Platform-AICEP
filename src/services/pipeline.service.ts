import { connectDB } from "@/lib/db";
import {
  AnalysisSession,
  IAnalysisSession,
  AnalysisStatus,
} from "@/models/AnalysisSession";
import { DetectionResult } from "@/models/DetectionResult";
import { Component } from "@/models/Component";
import { PCBAnalysis } from "@/models/PCBAnalysis";
import { RULPrediction } from "@/models/RULPrediction";
import { MaterialRecovery } from "@/models/MaterialRecovery";
import { RepairAssessment } from "@/models/RepairAssessment";
import { DigitalPassport } from "@/models/DigitalPassport";
import { CarbonImpact } from "@/models/CarbonImpact";
import { Report } from "@/models/Report";
import { AuditLog } from "@/models/AuditLog";
import { generateReportId } from "@/lib/id-generator";

import { detectionService } from "@/providers/detection/detection.provider";
import { pcbAnalysisService } from "@/providers/pcb/pcb.provider";
import { rulService, RULInput } from "@/providers/rul/rul.provider";
import { DemoMaterialProvider } from "@/providers/materials/materials.provider";
import { MockRepairProvider } from "@/providers/repair/repair.provider";
import { MockBlockchainProvider } from "@/providers/blockchain/blockchain.provider";

export class AnalysisPipelineService {
  private detectionService = detectionService;
  private pcbService = pcbAnalysisService;
  private rulService = rulService;
  private materialProvider = new DemoMaterialProvider();
  private repairProvider = new MockRepairProvider();
  private blockchainProvider = new MockBlockchainProvider();

  /**
   * Run the complete analysis pipeline sequentially with state machine validations and stage audit logs.
   * In Phase 4, the active execution halts at RUL_COMPLETE, leaving subsequent circular stages queued/pending.
   */
  async runPipeline(analysisId: string): Promise<IAnalysisSession> {
    await connectDB();

    const session = await AnalysisSession.findOne({ analysisId });
    if (!session) {
      throw new Error(`Analysis session '${analysisId}' not found`);
    }

    // State machine check
    const validInitialStatuses: AnalysisStatus[] = ["DRAFT", "READY", "PROCESSING", "FAILED", "draft", "ready", "processing", "failed"] as any;
    if (!validInitialStatuses.includes(session.status)) {
      throw new Error(`Cannot start analysis in state '${session.status}'`);
    }

    // Set to PROCESSING
    session.status = "PROCESSING";
    session.progress = 5;
    session.currentStage = "INITIALIZATION";
    session.stageStatuses = {
      detection: "pending",
      pcb: "pending",
      rul: "pending",
      materials: "pending",
      repair: "pending",
      passport: "pending",
      carbon: "pending",
      report: "pending",
    };
    await session.save();

    await this.logAudit(session, "ANALYSIS_STARTED", "AnalysisSession", analysisId);

    try {
      // 1. DETECTION STAGE
      await this.runDetectionStage(session);

      // 2. PCB ANALYSIS STAGE
      await this.runPCBStage(session);

      // 3. RUL PREDICTION STAGE
      await this.runRULStage(session);

      // In Phase 4, pipeline execution halts at RUL_COMPLETE.
      // Stages 4-8 (Materials, Repair, Passport, Carbon, Report) remain pending/queued for Phase 5+.
      console.log(`[AnalysisPipeline] Phase 4 complete for ${analysisId}: RUL_COMPLETE, currentStage=MATERIALS.`);
      return session;
    } catch (err: any) {
      console.error(`[Analysis Pipeline Error on ${analysisId}]:`, err);
      session.status = "FAILED";
      session.error = {
        code: "PROCESSING_FAILED",
        message: err.message || "Pipeline execution failed",
        stage: session.currentStage,
      };
      await session.save();

      await this.logAudit(session, "ANALYSIS_FAILED", "AnalysisSession", analysisId, {
        error: err.message,
      });

      throw err;
    }
  }

  // --- STAGE 1: DETECTION ---
  private async runDetectionStage(session: IAnalysisSession) {
    session.currentStage = "DETECTION";
    session.stageStatuses.detection = "processing";
    session.progress = 15;
    await session.save();

    const output = await this.detectionService.detect({
      analysisId: session.analysisId,
      imageUrl: session.imageUrl || "/images/samples/router_board.jpg",
      sampleId: session.sampleId,
      mode: session.mode,
      sourceType: session.sourceType,
    });

    // Idempotent upsert of DetectionResult
    const detectionDoc = await DetectionResult.findOneAndUpdate(
      { analysisId: session.analysisId },
      {
        analysisId: session.analysisId,
        components: output.components,
        totalDetected: output.totalDetected,
        confidenceAverage: output.confidenceAverage || output.confidenceAvg,
        confidenceAvg: output.confidenceAvg,
        processingTimeMs: output.processingTimeMs,
        modelName: output.model,
        modelVersion: output.version,
        datasetVersion: output.datasetVersion || "pcb-components-v1",
        model: output.model,
        version: output.version,
        provider: output.provider,
        status: output.status,
        quality: output.quality || {
          quality: "GOOD",
          score: 0.9,
          warnings: [],
        },
        warnings: output.warnings || [],
        imageWidth: output.imageDimensions?.width || 1920,
        imageHeight: output.imageDimensions?.height || 1080,
        detections: output.detections || [],
      },
      { upsert: true, new: true }
    );

    // Idempotent upsert of individual Component records with unique sequential IDs
    await Component.deleteMany({ analysisId: session.analysisId });
    const componentDocs = output.components.map((c, idx) => {
      const seq = String(idx + 1).padStart(3, "0");
      const serialNum = `CMP-ECI-${session.analysisId.slice(-4).toUpperCase()}-${seq}`;
      const centerCoord = c.center || {
        x: +(c.boundingBox.x + c.boundingBox.width / 2).toFixed(2),
        y: +(c.boundingBox.y + c.boundingBox.height / 2).toFixed(2),
      };

      return {
        analysisId: session.analysisId,
        detectionResultId: String(detectionDoc._id),
        serialNumber: serialNum,
        type: c.type,
        name: c.name,
        manufacturer: c.manufacturer,
        partNumber: c.partNumber || `${c.type.toUpperCase()}-${seq}`,
        package: c.package,
        boundingBox: c.boundingBox,
        bbox: c.boundingBox,
        center: centerCoord,
        confidence: c.confidence,
        condition: "UNKNOWN" as const,
        healthScore: 0,
        estimatedRUL: { hours: 0, years: 0 },
        marketplaceEligible: false,
      };
    });

    if (componentDocs.length > 0) {
      await Component.insertMany(componentDocs);
    }

    session.detectionId = detectionDoc._id;
    session.detectionResult = {
      model: output.model,
      inferenceTimeMs: output.processingTimeMs,
      componentsCount: output.totalDetected,
      components: output.components,
      confidenceAvg: +(output.confidenceAvg * 100).toFixed(1),
    };
    session.status = "DETECTION_COMPLETE";
    session.stageStatuses.detection = "completed";
    session.progress = 25;
    await session.save();

    await this.logAudit(session, "DETECTION_COMPLETED", "DetectionResult", String(detectionDoc._id));
  }

  // --- STAGE 2: PCB ANALYSIS ---
  private async runPCBStage(session: IAnalysisSession) {
    session.currentStage = "PCB";
    session.stageStatuses.pcb = "processing";
    session.progress = 35;
    await session.save();

    await this.logAudit(session, "PCB_ANALYSIS_STARTED", "AnalysisSession", session.analysisId);

    const pcbOutput = await this.pcbService.analyze({
      analysisId: session.analysisId,
      sampleId: session.sampleId,
      imageUrl: session.imageUrl || "/images/samples/router_board.jpg",
      detections: session.detectionResult?.components || [],
    });

    await this.logAudit(session, "PCB_GEOMETRY_DETECTED", "PCBAnalysis", session.analysisId);
    await this.logAudit(session, "TRACE_ANALYSIS_COMPLETED", "PCBAnalysis", session.analysisId);
    await this.logAudit(session, "TOPOLOGY_GENERATED", "PCBAnalysis", session.analysisId);
    await this.logAudit(session, "DAMAGE_ANALYSIS_COMPLETED", "PCBAnalysis", session.analysisId);
    await this.logAudit(session, "RECONSTRUCTION_COMPLETED", "PCBAnalysis", session.analysisId);

    const pcbDoc = await PCBAnalysis.findOneAndUpdate(
      { analysisId: session.analysisId },
      { ...pcbOutput, analysisId: session.analysisId },
      { upsert: true, new: true }
    );

    session.pcbAnalysisId = pcbDoc._id;
    session.reconstructionResult = {
      pcbId: `PCB-${session.analysisId}`,
      boardModel: pcbOutput.boardType || "Multi-layer FR-4 Substrate",
      layerCount: pcbOutput.layers?.estimatedCount || pcbOutput.layerCount || 2,
      traceIntegrityPercent: pcbOutput.metrics?.visualIntegrityScore || pcbOutput.traceContinuity || 90,
      severedTracesRepaired: pcbOutput.reconstructedRegions?.[0]?.repairedTraces || 1,
      reconstructionConfidence: +( (pcbOutput.reconstruction?.overallReconstructionConfidence || 85) / 100 ).toFixed(2),
      schematics: pcbOutput.schematics || {},
    };
    session.status = "PCB_COMPLETE";
    session.stageStatuses.pcb = "completed";
    session.progress = 45;
    await session.save();

    await this.logAudit(session, "PCB_ANALYSIS_COMPLETED", "PCBAnalysis", String(pcbDoc._id));
  }

  // --- STAGE 3: RUL PREDICTION ---
  private async runRULStage(session: IAnalysisSession) {
    session.currentStage = "RUL";
    session.stageStatuses.rul = "processing";
    session.progress = 55;
    session.markModified("stageStatuses");
    await session.save();

    await this.logAudit(session, "RUL_PREDICTION_STARTED", "AnalysisSession", session.analysisId);

    const [components, pcbDoc] = await Promise.all([
      Component.find({ analysisId: session.analysisId }).lean(),
      PCBAnalysis.findOne({ analysisId: session.analysisId }).lean(),
    ]);

    const damaged = pcbDoc?.damagedRegions || [];
    const corrosionCount = damaged.filter((d: any) => d.type === "corrosion").length;
    const thermalCount = damaged.filter((d: any) => d.type === "burn_mark" || d.type === "discoloration").length;
    const physicalCount = damaged.filter((d: any) => d.type === "crack" || d.type === "physical_damage").length;
    const traceCount = damaged.filter((d: any) => d.type === "scratched_trace" || d.type === "broken_trace").length;

    const visualIntegrity = pcbDoc?.metrics?.visualIntegrityScore ?? 85;
    const topologyRisk = pcbDoc?.reconstruction?.visualIntegrityEstimate 
      ? Math.max(0, 100 - pcbDoc.reconstruction.visualIntegrityEstimate) 
      : 15;

    const rulInput: RULInput = {
      analysisId: session.analysisId,
      sampleId: session.sampleId,
      pcbIntegrityScore: visualIntegrity,
      topologyRiskScore: topologyRisk,
      visualHealthScore: visualIntegrity,
      corrosionScore: corrosionCount * 15,
      thermalDamageScore: thermalCount * 20,
      physicalDamageScore: physicalCount * 10,
      traceDamageScore: traceCount * 15,
      components: components.map((c) => ({
        componentId: c.serialNumber || String(c._id),
        componentType: c.type,
        manufacturer: c.manufacturer,
        partNumber: c.partNumber,
        packageType: c.package,
        visualDamageSeverity: (c.condition === "DEGRADED" || c.condition === "FAILED") ? "HIGH" : "LOW",
        hasCorrosion: false,
        hasThermalDamage: false,
        connectedTracesCount: 2,
      })),
    };

    const rulOutput = await this.rulService.predict(rulInput);

    const rulDoc = await RULPrediction.findOneAndUpdate(
      { analysisId: session.analysisId },
      { ...rulOutput, analysisId: session.analysisId },
      { upsert: true, new: true }
    );

    // Sync component-level health and RUL back to Component documents
    if (rulOutput.components && rulOutput.components.length > 0) {
      for (const compRul of rulOutput.components) {
        const mappedCondition = compRul.healthStatus === "HEALTHY" 
          ? "MINT" 
          : compRul.healthStatus === "CRITICAL" 
          ? "FAILED" 
          : (compRul.healthStatus as "GOOD" | "FAIR" | "DEGRADED" | "UNKNOWN");

        await Component.updateOne(
          {
            analysisId: session.analysisId,
            $or: [{ serialNumber: compRul.componentId }, { name: compRul.componentId }],
          },
          {
            $set: {
              condition: mappedCondition,
              healthScore: compRul.healthScore,
              estimatedRUL: {
                hours: compRul.estimatedRULHours,
                years: compRul.estimatedRULYears,
              },
              marketplaceEligible: compRul.healthScore >= 70,
            },
          }
        );
      }
    }

    session.rulPredictionId = rulDoc._id;
    session.rulResult = {
      overallHealthScore: rulOutput.healthScore,
      predictedYears: rulOutput.rulYears,
      predictedHours: rulOutput.rulHours,
      failureProbability: +(100 - rulOutput.healthScore).toFixed(1),
      confidence: rulOutput.confidence,
      parameters: {
        operatingTempCelsius: rulOutput.inputFeatures?.temperatureC ?? 45,
        inputVoltageVolts: rulOutput.inputFeatures?.voltageV ?? 5.0,
        operatingCycles: rulOutput.inputFeatures?.operatingCycles ?? 1200,
        ageYears: rulOutput.inputFeatures?.componentAgeYears ?? 2.5,
      },
    };
    session.status = "RUL_COMPLETE";
    session.stageStatuses.rul = "completed";
    session.currentStage = "MATERIALS";
    session.markModified("stageStatuses");
    session.progress = 65;
    await session.save();

    await this.logAudit(session, "RUL_PREDICTION_COMPLETED", "RULPrediction", String(rulDoc._id), {
      healthScore: rulOutput.healthScore,
      healthStatus: rulOutput.healthStatus,
      rulYears: rulOutput.rulYears,
      provider: rulOutput.modelProvider,
    });
  }

  // --- STAGE 4: MATERIAL RECOVERY ---
  private async runMaterialStage(session: IAnalysisSession) {
    session.currentStage = "MATERIALS";
    session.stageStatuses.materials = "processing";
    session.progress = 70;
    await session.save();

    const matOutput = await this.materialProvider.estimate({
      analysisId: session.analysisId,
      sampleId: session.sampleId,
    });

    const matDoc = await MaterialRecovery.findOneAndUpdate(
      { analysisId: session.analysisId },
      { analysisId: session.analysisId, ...matOutput },
      { upsert: true, new: true }
    );

    session.materialRecoveryId = matDoc._id;
    session.metalResult = {
      pcbWeightKg: matOutput.pcbWeightKg,
      recoveryEfficiencyPercent: matOutput.recoveryEfficiencyPercent,
      totalEstimatedMarketValueINR: matOutput.totalEstimatedMarketValueINR,
      totalEstimatedMarketValueUSD: matOutput.totalEstimatedMarketValueUSD,
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
    session.status = "MATERIAL_COMPLETE";
    session.stageStatuses.materials = "completed";
    session.progress = 78;
    await session.save();

    await this.logAudit(session, "MATERIAL_RECOVERY_COMPLETED", "MaterialRecovery", String(matDoc._id));
  }

  // --- STAGE 5: REPAIR INTELLIGENCE ---
  private async runRepairStage(session: IAnalysisSession) {
    session.currentStage = "REPAIR";
    session.stageStatuses.repair = "processing";
    session.progress = 82;
    await session.save();

    const repairOutput = await this.repairProvider.assess({
      analysisId: session.analysisId,
      sampleId: session.sampleId,
    });

    const repDoc = await RepairAssessment.findOneAndUpdate(
      { analysisId: session.analysisId },
      { analysisId: session.analysisId, ...repairOutput },
      { upsert: true, new: true }
    );

    session.repairAssessmentId = repDoc._id;
    session.repairResult = {
      reportId: `REP-${session.analysisId}`,
      recommendedAction: repairOutput.recommendedAction.toLowerCase() as any,
      primaryFault: repairOutput.primaryFault,
      estimatedRepairCostINR: repairOutput.estimatedRepairCostINR,
      estimatedRepairCostUSD: repairOutput.estimatedRepairCostUSD,
      estimatedCO2SavingsKg: repairOutput.estimatedCO2SavingsKg,
      feasibilityIndexPercent: repairOutput.feasibilityIndexPercent,
      issues: repairOutput.issues.map((i) => ({
        component: i.componentName,
        issue: i.issue,
        severity: i.severity.toLowerCase() as any,
        recommendation: i.recommendation,
        action: i.suggestedAction,
      })),
    };
    session.status = "REPAIR_COMPLETE";
    session.stageStatuses.repair = "completed";
    session.progress = 88;
    await session.save();

    await this.logAudit(session, "REPAIR_ASSESSMENT_COMPLETED", "RepairAssessment", String(repDoc._id));
  }

  // --- STAGE 6: DIGITAL PASSPORT ---
  private async runPassportStage(session: IAnalysisSession) {
    session.currentStage = "PASSPORT";
    session.stageStatuses.passport = "processing";
    session.progress = 90;
    await session.save();

    const passportOutput = await this.blockchainProvider.mintPassport({
      analysisId: session.analysisId,
      deviceOrigin: session.deviceName,
      healthScore: session.rulResult?.overallHealthScore || 92,
      estimatedRUL: {
        hours: session.rulResult?.predictedHours || 42000,
        years: session.rulResult?.predictedYears || 4.8,
      },
    });

    const passportDoc = await DigitalPassport.findOneAndUpdate(
      { analysisId: session.analysisId },
      {
        analysisId: session.analysisId,
        passportId: passportOutput.passportId,
        deviceOrigin: session.deviceName,
        healthScore: session.rulResult?.overallHealthScore || 92,
        estimatedRUL: {
          hours: session.rulResult?.predictedHours || 42000,
          years: session.rulResult?.predictedYears || 4.8,
        },
        blockchainStatus: passportOutput.blockchainStatus,
        statusLabel: passportOutput.statusLabel,
        network: passportOutput.network,
        contractAddress: passportOutput.contractAddress,
        tokenId: passportOutput.tokenId,
        transactionHash: passportOutput.transactionHash,
        verificationUrl: passportOutput.verificationUrl,
        qrCode: passportOutput.qrCode,
        ipfsHash: passportOutput.ipfsHash,
        provider: passportOutput.provider,
      },
      { upsert: true, new: true }
    );

    session.passportId = passportOutput.passportId;
    session.passportResult = {
      passportId: passportOutput.passportId,
      tokenId: passportOutput.tokenId,
      blockchainStatus: passportOutput.statusLabel,
      polygonTransactionHash: passportOutput.transactionHash,
      contractAddress: passportOutput.contractAddress,
      isVerified: passportOutput.blockchainStatus === "VERIFIED",
      qrDataUri: passportOutput.qrCode,
    };
    session.status = "PASSPORT_READY";
    session.stageStatuses.passport = "completed";
    session.progress = 94;
    await session.save();

    await this.logAudit(session, "PASSPORT_CREATED", "DigitalPassport", String(passportDoc._id));
  }

  // --- STAGE 7: CARBON IMPACT ---
  private async runCarbonStage(session: IAnalysisSession) {
    session.currentStage = "CARBON";
    session.stageStatuses.carbon = "processing";
    session.progress = 96;
    await session.save();

    const carbonDoc = await CarbonImpact.findOneAndUpdate(
      { analysisId: session.analysisId },
      {
        analysisId: session.analysisId,
        co2AvoidedKg: session.repairResult?.estimatedCO2SavingsKg || 28.4,
        energySavedKWh: 412,
        waterSavedLiters: 1850,
        ewasteDivertedKg: session.metalResult?.pcbWeightKg || 0.28,
        circularityScorePercent: 94.2,
      },
      { upsert: true, new: true }
    );

    session.carbonImpactId = carbonDoc._id;
    session.carbonResult = {
      co2AvoidedKg: carbonDoc.co2AvoidedKg,
      energySavedKWh: carbonDoc.energySavedKWh,
      waterSavedLiters: carbonDoc.waterSavedLiters,
      eWasteDivertedKg: carbonDoc.ewasteDivertedKg,
      circularityScorePercent: carbonDoc.circularityScorePercent,
    };
    session.stageStatuses.carbon = "completed";
    session.progress = 98;
    await session.save();

    await this.logAudit(session, "CARBON_IMPACT_CALCULATED", "CarbonImpact", String(carbonDoc._id));
  }

  // --- STAGE 8: REPORT PREPARATION ---
  private async runReportStage(session: IAnalysisSession) {
    session.currentStage = "REPORT";
    session.stageStatuses.report = "processing";
    await session.save();

    const reportId = generateReportId(session.analysisId);

    const reportDoc = await Report.findOneAndUpdate(
      { analysisId: session.analysisId },
      {
        reportId,
        analysisId: session.analysisId,
        status: "READY",
        format: "JSON",
        fileUrl: `/api/reports?analysisId=${session.analysisId}`,
        sections: [
          "Executive Summary",
          "Component Detection",
          "PCB Trace Topology",
          "RUL & Reliability",
          "Urban Mining Spectrometry",
          "Repair Instructions",
          "Digital Product Passport",
          "Lifecycle Carbon Assessment",
        ],
        summary: {
          overallHealthPercent: session.rulResult?.overallHealthScore || 90,
          classification: "Circularity Grade A (Repair & Reuse Preferred)",
          potentialValueUSD: session.metalResult?.totalEstimatedMarketValueUSD || 18.7,
          potentialValueINR: session.metalResult?.totalEstimatedMarketValueINR || 1617,
          estimatedRemainingLifeYears: session.rulResult?.predictedYears || 4.8,
          componentsDetectedCount: session.detectionResult?.componentsCount || 24,
          recommendedAction: session.repairResult?.recommendedAction || "refurbish",
        },
      },
      { upsert: true, new: true }
    );

    session.reportId = reportId;
    session.executiveSummary = reportDoc.summary;
    session.status = "REPORT_READY";
    session.stageStatuses.report = "completed";
    await session.save();

    await this.logAudit(session, "REPORT_GENERATED", "Report", String(reportDoc._id));
  }

  private async logAudit(
    session: IAnalysisSession,
    action: string,
    resource: string,
    resourceId: string,
    metadata?: Record<string, any>
  ) {
    try {
      await AuditLog.create({
        userId: session.userId ? String(session.userId) : "system-demo-user",
        organizationId: session.organizationId ? String(session.organizationId) : undefined,
        action,
        resource,
        resourceId,
        metadata: {
          analysisId: session.analysisId,
          stage: session.currentStage,
          ...metadata,
        },
        timestamp: new Date(),
      });
    } catch (e: any) {
      console.warn("[AuditLog Warning]", e.message);
    }
  }
}

export const analysisPipeline = new AnalysisPipelineService();
export default analysisPipeline;
