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

import { MockDetectionProvider } from "@/providers/detection/detection.provider";
import { MockPCBProvider } from "@/providers/pcb/pcb.provider";
import { MockRULProvider } from "@/providers/rul/rul.provider";
import { DemoMaterialProvider } from "@/providers/materials/materials.provider";
import { MockRepairProvider } from "@/providers/repair/repair.provider";
import { MockBlockchainProvider } from "@/providers/blockchain/blockchain.provider";

export class AnalysisPipelineService {
  private detectionProvider = new MockDetectionProvider();
  private pcbProvider = new MockPCBProvider();
  private rulProvider = new MockRULProvider();
  private materialProvider = new DemoMaterialProvider();
  private repairProvider = new MockRepairProvider();
  private blockchainProvider = new MockBlockchainProvider();

  /**
   * Run the complete analysis pipeline sequentially with state machine validations and stage audit logs.
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

      // 4. MATERIAL RECOVERY STAGE
      await this.runMaterialStage(session);

      // 5. REPAIR INTELLIGENCE STAGE
      await this.runRepairStage(session);

      // 6. DIGITAL PASSPORT STAGE
      await this.runPassportStage(session);

      // 7. CARBON IMPACT STAGE
      await this.runCarbonStage(session);

      // 8. REPORT GENERATION STAGE
      await this.runReportStage(session);

      // 9. FINAL COMPLETION
      session.status = "COMPLETED";
      session.progress = 100;
      session.currentStage = "COMPLETED";
      await session.save();

      await this.logAudit(session, "ANALYSIS_COMPLETED", "AnalysisSession", analysisId);

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

    const output = await this.detectionProvider.detect({
      analysisId: session.analysisId,
      imageUrl: session.imageUrl,
      sampleId: session.sampleId,
      mode: session.mode,
    });

    // Idempotent upsert of DetectionResult
    const detectionDoc = await DetectionResult.findOneAndUpdate(
      { analysisId: session.analysisId },
      {
        analysisId: session.analysisId,
        components: output.components,
        totalDetected: output.totalDetected,
        confidenceAvg: output.confidenceAvg,
        processingTimeMs: output.processingTimeMs,
        model: output.model,
        version: output.version,
        provider: output.provider,
        status: output.status,
      },
      { upsert: true, new: true }
    );

    // Idempotent upsert of individual Component records
    await Component.deleteMany({ analysisId: session.analysisId });
    const componentDocs = output.components.map((c) => ({
      analysisId: session.analysisId,
      type: c.type,
      name: c.name,
      manufacturer: c.manufacturer,
      partNumber: c.partNumber,
      package: c.package,
      boundingBox: c.boundingBox,
      confidence: c.confidence,
      healthScore: c.healthScore,
      condition: c.condition,
      marketplaceEligible: c.marketplaceEligible,
      estimatedRUL: { hours: 45000, years: 5.2 },
    }));
    await Component.insertMany(componentDocs);

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

    const pcbOutput = await this.pcbProvider.analyze({
      analysisId: session.analysisId,
      sampleId: session.sampleId,
    });

    const pcbDoc = await PCBAnalysis.findOneAndUpdate(
      { analysisId: session.analysisId },
      { analysisId: session.analysisId, ...pcbOutput },
      { upsert: true, new: true }
    );

    session.pcbAnalysisId = pcbDoc._id;
    session.reconstructionResult = {
      pcbId: `PCB-${session.analysisId}`,
      boardModel: pcbOutput.boardType,
      layerCount: pcbOutput.layerCount,
      traceIntegrityPercent: pcbOutput.traceContinuity,
      severedTracesRepaired: pcbOutput.reconstructedRegions[0]?.repairedTraces || 3,
      reconstructionConfidence: pcbOutput.confidence,
      schematics: pcbOutput.schematics,
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
    await session.save();

    const rulOutput = await this.rulProvider.predict({
      analysisId: session.analysisId,
      sampleId: session.sampleId,
    });

    const rulDoc = await RULPrediction.findOneAndUpdate(
      { analysisId: session.analysisId },
      { analysisId: session.analysisId, ...rulOutput },
      { upsert: true, new: true }
    );

    session.rulPredictionId = rulDoc._id;
    session.rulResult = {
      overallHealthScore: rulOutput.healthScore,
      predictedYears: rulOutput.estimatedYears,
      predictedHours: rulOutput.estimatedHours,
      failureProbability: +(100 - rulOutput.healthScore).toFixed(1),
      confidence: rulOutput.confidence,
      parameters: {
        operatingTempCelsius: rulOutput.temperature,
        inputVoltageVolts: rulOutput.voltage,
        operatingCycles: rulOutput.operationalCycles,
        ageYears: rulOutput.age,
      },
    };
    session.status = "RUL_COMPLETE";
    session.stageStatuses.rul = "completed";
    session.progress = 65;
    await session.save();

    await this.logAudit(session, "RUL_PREDICTION_COMPLETED", "RULPrediction", String(rulDoc._id));
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
