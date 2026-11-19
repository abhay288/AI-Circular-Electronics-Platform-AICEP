import mongoose from "mongoose";
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
import { CarbonImpactService } from "@/services/carbon/carbonImpact.service";
import { SessionStore } from "@/lib/sessionStore";

import { detectionService } from "@/providers/detection/detection.provider";
import { pcbAnalysisService } from "@/providers/pcb/pcb.provider";
import { rulService, RULInput } from "@/providers/rul/rul.provider";
import { materialRecoveryService } from "@/providers/materials/materials.provider";
import { getRepairProvider } from "@/providers/repair/repair.provider";
import { MockBlockchainProvider } from "@/providers/blockchain/blockchain.provider";

export class AnalysisPipelineService {
  private detectionService = detectionService;
  private pcbService = pcbAnalysisService;
  private rulService = rulService;
  private materialService = materialRecoveryService;
  private repairProvider = getRepairProvider();
  private blockchainProvider = new MockBlockchainProvider();

  /**
   * Run the complete analysis pipeline sequentially with state machine validations and stage audit logs.
   * In Phase 4, the active execution halts at RUL_COMPLETE, leaving subsequent circular stages queued/pending.
   */
  async runPipeline(analysisId: string): Promise<IAnalysisSession> {
    let mongoSession: any = null;
    let memSession = SessionStore.get(analysisId);

    try {
      await connectDB();
      mongoSession = await AnalysisSession.findOne({
        $or: [{ analysisId }, { sessionId: analysisId }],
      });
      if (mongoSession && !memSession) {
        memSession = SessionStore.set(analysisId, mongoSession.toObject());
      }
    } catch (dbErr: any) {
      console.warn("[Pipeline] MongoDB connect warning, proceeding with resilient session store:", dbErr.message);
    }

    if (!mongoSession && !memSession) {
      throw new Error(`Analysis session '${analysisId}' not found`);
    }

    const sessionObj = mongoSession || memSession;

    // Set to PROCESSING in both stores
    const initialStages = {
      quality: "completed",
      detection: "processing",
      pcb: "pending",
      damage: "pending",
      ocr: "pending",
      summary: "pending",
    };

    SessionStore.update(analysisId, {
      status: "PROCESSING",
      progress: 15,
      currentStage: "DETECTION",
      stageStatuses: initialStages,
    });

    if (mongoSession) {
      mongoSession.status = "PROCESSING";
      mongoSession.progress = 15;
      mongoSession.currentStage = "DETECTION";
      mongoSession.stageStatuses = initialStages;
      await mongoSession.save().catch(() => { });
      await this.logAudit(mongoSession, "ANALYSIS_STARTED", "AnalysisSession", analysisId).catch(() => { });
    }

    try {
      // 1. IMAGE QUALITY, COMPONENT DETECTION & OPTICAL OCR
      await this.runDetectionStage(sessionObj);

      // Phase 2 Rejection Gate: If image is non-electronic, halt pipeline immediately
      if (sessionObj.status === "IMAGE_REJECTED" || (sessionObj as any).imageType === "NON_ELECTRONIC") {
        console.log(`[AnalysisPipeline] Image rejected as non-electronic for ${analysisId}. Halting downstream analysis.`);
        const rejReason = (sessionObj as any).rejectionReason || "This image does not appear to contain electronic hardware or electronic components. Please upload a clear photograph of a PCB, motherboard, electronic device, or individual electronic component.";
        const rejCat = (sessionObj as any).rejectionCategory || "NON_ELECTRONIC";

        SessionStore.update(analysisId, {
          status: "IMAGE_REJECTED",
          currentStage: "IMAGE_REJECTED",
          progress: 100,
          imageType: "NON_ELECTRONIC",
          rejectionReason: rejReason,
          rejectionCategory: rejCat,
          detectionResult: (sessionObj as any).detectionResult || {
            componentsCount: 0,
            components: [],
            confidenceAvg: 0,
            rejectionRecommendation: true,
            rejectionReason: rejReason,
            rejectionCategory: rejCat,
          },
          stageStatuses: {
            quality: "completed",
            detection: "failed",
            pcb: "failed",
            damage: "failed",
            ocr: "failed",
            summary: "completed",
          },
        });

        if (mongoSession) {
          mongoSession.status = "IMAGE_REJECTED";
          mongoSession.currentStage = "IMAGE_REJECTED";
          mongoSession.progress = 100;
          mongoSession.rejectionReason = rejReason;
          mongoSession.rejectionCategory = rejCat;
          await mongoSession.save().catch(() => { });
          await this.logAudit(mongoSession, "ANALYSIS_REJECTED", "AnalysisSession", analysisId, {
            reason: rejReason,
          }).catch(() => { });
        }
        return (mongoSession || SessionStore.get(analysisId)) as any;
      }

      // 2. PCB VISUAL STRUCTURE & TRACE INSPECTION
      await this.runPCBStage(sessionObj);

      // 3. IMAGE-BASED EVIDENCE SUMMARY
      await this.compileEvidenceSummary(sessionObj);

      const completedStages = {
        quality: "completed",
        detection: "completed",
        pcb: "completed",
        damage: "completed",
        ocr: "completed",
        summary: "completed",
      };

      SessionStore.update(analysisId, {
        status: "COMPLETED",
        progress: 100,
        currentStage: "REPORT_READY",
        stageStatuses: completedStages,
      });

      if (mongoSession) {
        mongoSession.status = "COMPLETED";
        mongoSession.progress = 100;
        mongoSession.currentStage = "REPORT_READY";
        mongoSession.stageStatuses = completedStages;
        await mongoSession.save().catch(() => { });
      }

      console.log(`[AnalysisPipeline] Strict image-only analysis completed for ${analysisId}.`);
      return (mongoSession || SessionStore.get(analysisId)) as any;
    } catch (err: any) {
      console.error(`[Analysis Pipeline Error on ${analysisId}]:`, err);
      SessionStore.update(analysisId, {
        status: "FAILED",
        error: {
          code: "PROCESSING_FAILED",
          message: err.message || "Pipeline execution failed",
          stage: sessionObj.currentStage,
        },
      });

      if (mongoSession) {
        mongoSession.status = "FAILED";
        mongoSession.error = {
          code: "PROCESSING_FAILED",
          message: err.message || "Pipeline execution failed",
          stage: mongoSession.currentStage,
        };
        await mongoSession.save().catch(() => { });
        await this.logAudit(mongoSession, "ANALYSIS_FAILED", "AnalysisSession", analysisId, {
          error: err.message,
        }).catch(() => { });
      }

      if (mongoSession) {
        mongoSession.status = "FAILED";
        mongoSession.error = {
          code: "PROCESSING_FAILED",
          message: err.message || "Pipeline execution failed",
          stage: mongoSession.currentStage,
        };
        await mongoSession.save().catch(() => { });
        await this.logAudit(mongoSession, "ANALYSIS_FAILED", "AnalysisSession", analysisId, {
          error: err.message,
        }).catch(() => { });
      }


      throw err;
    }
  }

  // --- STAGE 1: DETECTION ---
  private async runDetectionStage(session: IAnalysisSession) {
    session.currentStage = "DETECTION";
    session.stageStatuses.detection = "processing";
    session.progress = 25;
    SessionStore.update(session.analysisId, {
      currentStage: "DETECTION",
      status: "PROCESSING",
      progress: 25,
      stageStatuses: { ...session.stageStatuses, detection: "processing" },
    });
    if (typeof session.save === "function") {
      await session.save().catch(() => { });
    }

    const output = await this.detectionService.detect({
      analysisId: session.analysisId,
      imageUrl: session.imageUrl || "/images/samples/router_board.jpg",
      sampleId: session.sampleId,
      mode: session.mode,
      sourceType: session.sourceType,
    });

    // Handle Strict Rejection for Non-Electronic Content
    if (output.status === "IMAGE_REJECTED" || output.imageType === "NON_ELECTRONIC") {
      session.status = "IMAGE_REJECTED";
      session.currentStage = "IMAGE_REJECTED";
      session.progress = 100;
      session.stageStatuses = {
        quality: "completed",
        detection: "failed",
        pcb: "failed",
        damage: "failed",
        ocr: "failed",
        summary: "completed",
      };
      (session as any).imageType = "NON_ELECTRONIC";
      (session as any).rejectionReason =
        output.rejectionReason ||
        "This image does not appear to contain electronic hardware or electronic components. Please upload a clear photograph of a PCB, motherboard, electronic device, or individual electronic component.";
      (session as any).rejectionCategory = output.rejectionCategory || "NON_ELECTRONIC";
      (session as any).evidenceSummary = output.summary;
      (session as any).detectionResult = {
        model: output.model,
        componentsCount: 0,
        components: [],
        confidenceAvg: 0,
      };

      SessionStore.update(session.analysisId, {
        status: "IMAGE_REJECTED",
        currentStage: "IMAGE_REJECTED",
        progress: 100,
        imageType: "NON_ELECTRONIC",
        rejectionReason: (session as any).rejectionReason,
        rejectionCategory: (session as any).rejectionCategory,
        evidenceSummary: output.summary,
        detectionResult: (session as any).detectionResult,
        stageStatuses: session.stageStatuses,
      });

      if (typeof session.save === "function") {
        await session.save().catch(() => {});
      }
      return;
    }

    // Idempotent upsert of DetectionResult if MongoDB is active
    let detectionDoc: any = null;
    if (mongoose.connection.readyState === 1) {
      try {
        detectionDoc = await DetectionResult.findOneAndUpdate(
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
            detectionResultId: String(detectionDoc?._id || `DET-${seq}`),
            serialNumber: serialNum,
            type: c.type,
            name: c.name,
            manufacturer: c.manufacturer,
            partNumber: c.partNumber || `${c.type.toUpperCase()}-${seq}`,
            package: c.package,
            functionalRole: (c as any).functionalRole,
            description: (c as any).description,
            specifications: (c as any).specifications,
            datasheetUrl: (c as any).datasheetUrl,
            boundingBox: c.boundingBox,
            bbox: c.boundingBox,
            center: centerCoord,
            confidence: c.confidence,
            condition: c.condition || "NORMAL",
            visualCondition: (c as any).visualCondition || c.condition || "NORMAL",
            visualEvidence: (c as any).visualEvidence || "Optical evaluation completed",
            visibleMarking: (c as any).visibleMarking,
            marketplaceEligible: false,
          };
        });

        if (componentDocs.length > 0) {
          await Component.insertMany(componentDocs);
        }
      } catch (dbErr: any) {
        console.warn("[Detection Stage] MongoDB component sync deferred:", dbErr.message);
      }
    }

    session.detectionId = detectionDoc?._id;
    (session as any).imageHash = output.imageHash;
    (session as any).imageType = output.imageType;
    (session as any).imageClassification = output.imageClassification;
    (session as any).modules = output.modules;

    session.detectionResult = {
      model: output.model,
      inferenceTimeMs: output.processingTimeMs,
      componentsCount: output.totalDetected,
      components: output.components,
      confidenceAvg: +(output.confidenceAvg * 100).toFixed(1),
      visualCondition: output.visualCondition,
      imageHash: output.imageHash,
      imageType: output.imageType,
      imageClassification: output.imageClassification,
      modules: output.modules,
    };
    if (output.quality) {
      session.qualityResult = output.quality;
    }
    if ((output as any).ocr) {
      session.ocrResult = (output as any).ocr;
    }
    if ((output as any).summary) {
      session.evidenceSummary = (output as any).summary;
    }
    session.status = "DETECTION_COMPLETE";
    session.stageStatuses.detection = "completed";
    session.stageStatuses.quality = "completed";
    session.stageStatuses.ocr = "completed";
    session.progress = 50;

    SessionStore.update(session.analysisId, {
      status: "DETECTION_COMPLETE",
      currentStage: "DETECTION",
      progress: 50,
      imageHash: output.imageHash,
      imageType: output.imageType,
      imageClassification: output.imageClassification,
      modules: output.modules,
      detectionResult: session.detectionResult,
      qualityResult: session.qualityResult,
      ocrResult: session.ocrResult,
      evidenceSummary: session.evidenceSummary,
      stageStatuses: session.stageStatuses,
    });

    if (typeof session.save === "function") {
      await session.save().catch(() => { });
    }

    if (detectionDoc) {
      await this.logAudit(session, "DETECTION_COMPLETED", "DetectionResult", String(detectionDoc._id)).catch(() => { });
    }
  }

  // --- STAGE 2: PCB ANALYSIS ---
  private async runPCBStage(session: IAnalysisSession) {
    session.currentStage = "PCB";
    session.stageStatuses.pcb = "processing";
    session.stageStatuses.damage = "processing";
    session.progress = 70;
    SessionStore.update(session.analysisId, {
      currentStage: "PCB",
      progress: 70,
      stageStatuses: {
        ...session.stageStatuses,
        pcb: "processing",
        damage: "processing",
      },
    });
    if (typeof session.save === "function") {
      await session.save().catch(() => { });
    }

    const pcbOutput = await this.pcbService.analyze({
      analysisId: session.analysisId,
      sampleId: session.sampleId,
      imageUrl: session.imageUrl || "/images/samples/router_board.jpg",
      detections: session.detectionResult?.components || [],
    });

    let pcbDoc: any = null;
    if (mongoose.connection.readyState === 1) {
      try {
        pcbDoc = await PCBAnalysis.findOneAndUpdate(
          { analysisId: session.analysisId },
          { ...pcbOutput, analysisId: session.analysisId },
          { upsert: true, new: true }
        );
      } catch (dbErr: any) {
        console.warn("[PCB Stage] MongoDB pcb sync deferred:", dbErr.message);
      }
    }

    session.pcbAnalysisId = pcbDoc?._id;
    const isUnsupportedPCB =
      (pcbOutput.status as string) === "UNSUPPORTED_IMAGE" ||
      (pcbOutput.status as string) === "NOT_APPLICABLE" ||
      !pcbOutput.board ||
      ["SINGLE_COMPONENT", "ISOLATED_COMPONENT"].includes((session as any).imageType);

    session.reconstructionResult = {
      pcbId: `PCB-${session.analysisId}`,
      status: isUnsupportedPCB ? "UNSUPPORTED_IMAGE" : "COMPLETED",
      boardModel: isUnsupportedPCB ? "None (Isolated Component)" : "Visible FR-4 Substrate Surface",
      boardGeometry: pcbOutput.board || null,
      pixelDimensions: pcbOutput.board ? `${pcbOutput.board.widthPixels} x ${pcbOutput.board.heightPixels} px` : "N/A (Isolated Component)",
      visibleTracesCount: pcbOutput.traces?.length || 0,
      visiblePadsCount: pcbOutput.pads?.length || 0,
      visibleViasCount: pcbOutput.vias?.length || 0,
      traces: pcbOutput.traces || [],
      pads: pcbOutput.pads || [],
      vias: pcbOutput.vias || [],
      damagedRegions: pcbOutput.damagedRegions || [],
      limitations: isUnsupportedPCB ? [
        "Image is classified as an isolated component photograph without a PCB substrate.",
        "PCB trace mapping, pad/via localization, and board topology are strictly inapplicable.",
      ] : [
        "Internal inner-layer copper traces and buried planes cannot be determined from optical surface photography.",
        "Exact physical dimensions in millimeters require calibration target with known pixel pitch; pixel dimensions are provided.",
        "Visual trace observation does not substitute for four-wire Kelvin electrical continuity testing.",
      ],
    };
    session.status = "PCB_COMPLETE";
    session.stageStatuses.pcb = "completed";
    session.stageStatuses.damage = "completed";
    session.progress = 85;

    SessionStore.update(session.analysisId, {
      status: "PCB_COMPLETE",
      currentStage: "PCB",
      progress: 85,
      reconstructionResult: session.reconstructionResult,
      stageStatuses: session.stageStatuses,
    });

    if (typeof session.save === "function") {
      await session.save().catch(() => { });
    }

    if (pcbDoc) {
      await this.logAudit(session, "PCB_ANALYSIS_COMPLETED", "PCBAnalysis", String(pcbDoc._id)).catch(() => { });
    }
  }

  // --- STAGE 3: COMPILE EVIDENCE-BASED SUMMARY ---
  private async compileEvidenceSummary(session: IAnalysisSession) {
    session.currentStage = "SUMMARY";
    session.stageStatuses.summary = "processing";
    session.progress = 95;
    SessionStore.update(session.analysisId, {
      currentStage: "SUMMARY",
      progress: 95,
      stageStatuses: { ...session.stageStatuses, summary: "processing" },
    });
    if (typeof session.save === "function") {
      await session.save().catch(() => { });
    }

    const damaged = session.reconstructionResult?.damagedRegions || [];
    const compDamages = (session.detectionResult?.components || []).filter(
      (c: any) => c.condition && c.condition !== "NORMAL" && c.condition !== "UNKNOWN"
    );

    const totalDefects = damaged.length + compDamages.length;
    let classification = "No obvious visible damage detected.";
    let statement = "No obvious visible damage was detected in this image. This does not confirm electrical functionality.";

    const qualityScore = session.qualityResult?.score ?? 1.0;
    if (qualityScore < 0.45 || session.qualityResult?.quality === "POOR") {
      classification = "Image quality insufficient for assessment.";
      statement = "Image optical resolution, blur, or lighting is inadequate for conclusive visual inspection.";
    } else if (totalDefects >= 4) {
      classification = "Severe visible physical damage.";
      statement = `Identified ${totalDefects} visible anomalies (including localized discoloration or physical fractures).`;
    } else if (totalDefects >= 2) {
      classification = "Moderate visible physical damage.";
      statement = `Observed ${totalDefects} visible surface anomalies on component packaging or substrate.`;
    } else if (totalDefects === 1) {
      classification = "Minor visible surface damage.";
      statement = "Observed isolated surface anomaly on visible exterior.";
    }

    if (!session.evidenceSummary) {
      session.evidenceSummary = {
        classification,
        statement,
        findingsCount: totalDefects,
        opticalLimitations: [
          "Optical inspection is strictly limited to visible exterior surface features in the 2D photography.",
          "Internal silicon junction health, dielectric breakdown, and hidden BGA solder balls remain UNKNOWN.",
          "Multilayer inner copper traces and buried ground/power planes cannot be determined from optical photography.",
          "This visual analysis does not confirm electrical functionality, signal integrity, or electrical continuity.",
        ],
        recommendedManualInspections: [
          "Perform four-wire Kelvin electrical continuity testing across key power/ground rails.",
          "X-ray inspection (computed tomography) for BGA solder voids and inner-layer copper integrity.",
          "Laboratory in-circuit voltage, clock frequency, and current draw measurement under powered test conditions.",
        ],
      };
    }

    session.stageStatuses.summary = "completed";
    session.stageStatuses.ocr = "completed";
    session.progress = 100;
    session.status = "COMPLETED";
    session.currentStage = "REPORT_READY";

    SessionStore.update(session.analysisId, {
      status: "COMPLETED",
      currentStage: "REPORT_READY",
      progress: 100,
      evidenceSummary: session.evidenceSummary,
      stageStatuses: {
        quality: "completed",
        detection: "completed",
        pcb: "completed",
        damage: "completed",
        ocr: "completed",
        summary: "completed",
      },
    });

    if (typeof session.save === "function") {
      await session.save().catch(() => { });
    }

    await this.logAudit(session, "SUMMARY_COMPILED", "AnalysisSession", session.analysisId).catch(() => { });
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
    session.markModified("stageStatuses");
    await session.save();

    await this.logAudit(session, "MATERIAL_ANALYSIS_STARTED", "AnalysisSession", session.analysisId);

    const [components, pcbDoc] = await Promise.all([
      Component.find({ analysisId: session.analysisId }).lean(),
      PCBAnalysis.findOne({ analysisId: session.analysisId }).lean(),
    ]);

    let boardAreaCm2: number | undefined;
    if (pcbDoc?.board?.estimatedPhysicalWidthMm && pcbDoc?.board?.estimatedPhysicalHeightMm) {
      boardAreaCm2 = +(
        (pcbDoc.board.estimatedPhysicalWidthMm * pcbDoc.board.estimatedPhysicalHeightMm) /
        100
      ).toFixed(2);
    } else if (pcbDoc?.board?.widthPixels && pcbDoc?.board?.heightPixels) {
      const approxW = pcbDoc.board.widthPixels / 10;
      const approxH = pcbDoc.board.heightPixels / 10;
      boardAreaCm2 = +((approxW * approxH) / 100).toFixed(2);
    }

    const matOutput = await this.materialService.estimate({
      analysisId: session.analysisId,
      sampleId: session.sampleId,
      boardMassGrams: session.metadata?.boardMassGrams,
      boardAreaCm2,
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
        boardAreaCm2,
        layerCount: pcbDoc?.layers?.estimatedCount || 2,
        surfaceFinish: "ENIG",
      },
    });

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

    // Sync component-level material profiles & recovery priorities
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
    session.progress = 75;
    session.markModified("stageStatuses");
    await session.save();

    await this.logAudit(session, "MATERIAL_RECOVERY_COMPLETED", "MaterialRecovery", String(matDoc._id), {
      totalMaterialMassGrams: matOutput.totalEstimatedMaterialMassGrams,
      recoverableMassGrams: matOutput.totalRecoverableMaterialMassGrams,
      confidence: matOutput.confidence.score,
    });
  }

  // --- STAGE 5: REPAIR INTELLIGENCE ---
  private async runRepairStage(session: IAnalysisSession) {
    session.currentStage = "REPAIR";
    session.stageStatuses.repair = "processing";
    session.progress = 80;
    session.markModified("stageStatuses");
    await session.save();

    await this.logAudit(session, "REPAIR_ASSESSMENT_STARTED", "AnalysisSession", session.analysisId);

    const [components, pcbDoc, rulDoc, matDoc] = await Promise.all([
      Component.find({ analysisId: session.analysisId }),
      PCBAnalysis.findOne({ analysisId: session.analysisId }),
      RULPrediction.findOne({ analysisId: session.analysisId }),
      MaterialRecovery.findOne({ analysisId: session.analysisId }),
    ]);

    const repairOutput = await this.repairProvider.assess({
      analysisId: session.analysisId,
      sampleId: session.sampleId,
      components,
      damagedRegions: pcbDoc?.damagedRegions || [],
      traces: pcbDoc?.traces || [],
      pads: pcbDoc?.pads || [],
      rulResult: rulDoc || session.rulResult,
      materialRecoveryResult: matDoc || session.metalResult,
    });

    const repDoc = await RepairAssessment.findOneAndUpdate(
      { analysisId: session.analysisId },
      {
        analysisId: session.analysisId,
        status: repairOutput.status,
        overallRepairability: repairOutput.overallRepairability,
        overallRecommendation: repairOutput.overallRecommendation,
        decisionScore: repairOutput.decisionScore,
        componentAssessments: repairOutput.componentAssessments,
        repairRecommendations: repairOutput.repairRecommendations,
        circularityDecision: repairOutput.circularityDecision,
        decisionMatrix: repairOutput.decisionMatrix,
        evidence: repairOutput.evidence,
        limitations: repairOutput.limitations,
        provider: repairOutput.provider,
        modelVersion: repairOutput.modelVersion,

        // Legacy compatibility
        recommendedAction: (repairOutput.overallRecommendation as any) || "REFURBISH",
        primaryFault:
          repairOutput.repairRecommendations[0]?.reason ||
          "Thermal stress detected on power regulation circuit",
        estimatedRepairCostINR: 1250,
        estimatedRepairCostUSD: 14.5,
        estimatedCO2SavingsKg: 28.4,
        feasibilityIndexPercent: repairOutput.decisionScore,
        confidence: repairOutput.circularityDecision?.decisionConfidence || 0.9,
        issues: repairOutput.repairRecommendations.map((r) => ({
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

    session.repairAssessmentId = repDoc._id;
    session.repairResult = {
      reportId: `REP-${session.analysisId}`,
      recommendedAction: repairOutput.overallRecommendation.toLowerCase() as any,
      primaryFault: repairOutput.repairRecommendations[0]?.reason || "Thermal stress detected on power regulation circuit",
      estimatedRepairCostINR: 1250,
      estimatedRepairCostUSD: 14.5,
      estimatedCO2SavingsKg: 28.4,
      feasibilityIndexPercent: repairOutput.decisionScore,
      issues: repairOutput.repairRecommendations.map((r) => ({
        component: r.componentName || r.componentId || "Component",
        issue: r.reason,
        severity: r.priority.toLowerCase() as any,
        recommendation: r.expectedOutcome,
        action: r.action,
      })),
    };
    session.status = "REPAIR_COMPLETE";
    session.stageStatuses.repair = "completed";
    session.stageStatuses.passport = "pending";
    session.currentStage = "PASSPORT";
    session.progress = 88;
    session.markModified("stageStatuses");
    await session.save();

    await this.logAudit(session, "REPAIR_ASSESSMENT_COMPLETED", "RepairAssessment", String(repDoc._id), {
      recommendation: repairOutput.overallRecommendation,
      decisionScore: repairOutput.decisionScore,
      actionableCount: repairOutput.repairRecommendations.length,
    });
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

    const carbonDoc = await CarbonImpactService.calculateAssetImpact(session.analysisId, {
      organizationId: session.organizationId?.toString(),
      baselineScenario: "DISCARD",
      circularScenario: "REPAIR",
    });

    session.carbonImpactId = carbonDoc._id;
    session.carbonResult = {
      co2AvoidedKg: carbonDoc.netAvoidedCO2e,
      totalAvoidedCO2e: carbonDoc.totalAvoidedCO2e,
      grossAvoidedCO2e: carbonDoc.grossAvoidedCO2e,
      additionalImpactCO2e: carbonDoc.additionalImpactCO2e,
      netAvoidedCO2e: carbonDoc.netAvoidedCO2e,
      divertedWasteKg: carbonDoc.waste?.divertedWasteKg || 0.28,
      circularityScore: carbonDoc.circularityScore,
      dataQuality: carbonDoc.dataQuality,
      uncertainty: carbonDoc.uncertainty,
      methodology: carbonDoc.methodology,
      energySavedKWh: carbonDoc.energySavedKWh,
      waterSavedLiters: carbonDoc.waterSavedLiters,
      eWasteDivertedKg: carbonDoc.waste?.divertedWasteKg || 0.28,
      circularityScorePercent: carbonDoc.circularityScore,
    };
    session.stageStatuses.carbon = "completed";
    session.progress = 98;
    await session.save();

    await this.logAudit(session, "CARBON_IMPACT_CALCULATED", "CarbonImpact", String(carbonDoc._id), {
      netAvoidedCO2e: carbonDoc.netAvoidedCO2e,
      circularityScore: carbonDoc.circularityScore,
    });
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
        organizationId: session.organizationId || "org-default",
        reportType: "TECHNICAL",
        version: 1,
        title: session.deviceName ? `EcoIntel Assessment Report - ${session.deviceName}` : "EcoIntel Assessment Report",
        status: "READY",
        format: "JSON",
        fileUrl: `/api/reports?analysisId=${session.analysisId}`,
        sections: [
          { id: "exec-summary", title: "Executive Summary", type: "SUMMARY", content: { text: "Executive circularity assessment" }, evidenceLevel: "VERIFIED" },
          { id: "comp-detection", title: "Component Detection", type: "DETECTION", content: session.detectionResult || {}, evidenceLevel: "VERIFIED" },
          { id: "pcb-trace", title: "PCB Trace Topology", type: "PCB", content: session.reconstructionResult || {}, evidenceLevel: "VERIFIED" },
          { id: "rul-reliability", title: "RUL & Reliability", type: "RUL", content: session.rulResult || {}, evidenceLevel: "PREDICTED" },
          { id: "urban-mining", title: "Urban Mining Spectrometry", type: "METALS", content: session.metalResult || {}, evidenceLevel: "ESTIMATED" },
          { id: "repair-guide", title: "Repair Instructions", type: "REPAIR", content: session.repairResult || {}, evidenceLevel: "ESTIMATED" },
          { id: "digital-passport", title: "Digital Product Passport", type: "PASSPORT", content: session.passportResult || {}, evidenceLevel: "VERIFIED" },
          { id: "lifecycle-carbon", title: "Lifecycle Carbon Assessment", type: "CARBON", content: session.carbonResult || {}, evidenceLevel: "ESTIMATED" },
        ],
        completeness: {
          technicalPercent: 100,
          healthPercent: 100,
          materialsPercent: 100,
          repairPercent: 100,
          passportPercent: 100,
          environmentalPercent: 100,
          overallPercent: 100,
          missingSections: [],
        },
        methodology: "EcoIntel Neural Pipeline Multi-Spectral Circular Assessment",
        dataSources: ["SPECTRAL_INSPECTION", "PHYSICS_DEGRADATION_MODEL", "LCA_DATABASE"],
        assumptions: ["Standard IPC-A-610 electronic assembly reliability factors"],
        limitations: ["RUL predictions depend on operating temperature profile"],
        isDemo: session.mode === "DEMO",
        generatedBy: session.userId || "system",
        generatedAt: new Date(),
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
    if (mongoose.connection.readyState !== 1) return;
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
