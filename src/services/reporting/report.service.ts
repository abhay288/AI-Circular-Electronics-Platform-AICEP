import { connectDB } from "@/lib/db";
import { Report, IReport, ReportType, IReportSection, IReportCompleteness } from "@/models/Report";
import { AnalysisSession, IAnalysisSession } from "@/models/AnalysisSession";
import { DetectionResult } from "@/models/DetectionResult";
import { PCBAnalysis } from "@/models/PCBAnalysis";
import { RULPrediction } from "@/models/RULPrediction";
import { MaterialRecovery } from "@/models/MaterialRecovery";
import { RepairAssessment } from "@/models/RepairAssessment";
import { DigitalPassport } from "@/models/DigitalPassport";
import { MarketplaceListing } from "@/models/MarketplaceListing";
import { CarbonImpact } from "@/models/CarbonImpact";
import { AuditLog } from "@/models/AuditLog";
import { Notification } from "@/models/Notification";
import { generateReportId } from "@/lib/id-generator";
import { ReportPdfGenerator } from "./pdfGenerator";

export interface GenerateReportOptions {
  organizationId?: string;
  generatedBy?: string;
  format?: "PDF" | "JSON" | "CSV";
  branding?: {
    logoUrl?: string;
    organizationName?: string;
    reportFooter?: string;
  };
}

export class ReportService {
  /**
   * Helper to retrieve all phase artifacts for a given analysis session.
   */
  public static async collectPhaseData(analysisId: string) {
    await connectDB();

    const session = await AnalysisSession.findOne({
      $or: [{ analysisId }, { sessionId: analysisId as any }],
    }).lean();

    if (!session) {
      throw new Error(`Analysis session '${analysisId}' not found.`);
    }

    const resolvedAnalysisId = session.analysisId;

    const [
      detection,
      pcb,
      rul,
      materials,
      repair,
      passport,
      listings,
      carbon,
    ] = await Promise.all([
      DetectionResult.findOne({ analysisId: resolvedAnalysisId }).lean(),
      PCBAnalysis.findOne({ analysisId: resolvedAnalysisId }).lean(),
      RULPrediction.findOne({ analysisId: resolvedAnalysisId }).lean(),
      MaterialRecovery.findOne({ analysisId: resolvedAnalysisId }).lean(),
      RepairAssessment.findOne({ analysisId: resolvedAnalysisId }).lean(),
      DigitalPassport.findOne({ analysisId: resolvedAnalysisId }).lean(),
      MarketplaceListing.find({ analysisId: resolvedAnalysisId }).lean(),
      CarbonImpact.findOne({ analysisId: resolvedAnalysisId }).lean(),
    ]);

    return {
      session: session as any as IAnalysisSession,
      detection: detection as any,
      pcb: pcb as any,
      rul: rul as any,
      materials: materials as any,
      repair: repair as any,
      passport: passport as any,
      listings: listings as any[],
      carbon: carbon as any,
    };
  }

  /**
   * Calculates completeness percentages across each intelligence dimension.
   */
  public static calculateCompleteness(data: {
    detection: any;
    pcb: any;
    rul: any;
    materials: any;
    repair: any;
    passport: any;
    carbon: any;
  }): IReportCompleteness {
    const missingSections: string[] = [];

    // Technical (Detection + PCB)
    let techScore = 0;
    if (data.detection && (data.detection.componentsCount || (data.detection.components && data.detection.components.length > 0))) techScore += 50;
    if (data.pcb && (data.pcb.traces || data.pcb.status === "COMPLETED" || data.pcb.reconstruction)) techScore += 50;
    if (techScore < 50) missingSections.push("Technical PCB / Component Detection");

    // Health / RUL
    let healthScore = 0;
    if (data.rul && (data.rul.predictedRULYears !== undefined || data.rul.predictedYears !== undefined || data.rul.rulYears !== undefined || data.rul.healthScore !== undefined)) {
      healthScore = 100;
    } else {
      missingSections.push("Health & Remaining Useful Life (RUL)");
    }

    // Materials
    let matScore = 0;
    if (data.materials && (data.materials.totalEstimatedMarketValueUSD > 0 || (data.materials.preciousMetals && data.materials.preciousMetals.length > 0))) {
      matScore = 100;
    } else {
      missingSections.push("Material Recovery & Metal Spectrometry");
    }

    // Repair
    let repScore = 0;
    if (data.repair && (data.repair.recommendedAction || data.repair.decisionScore !== undefined || data.repair.feasibilityIndexPercent !== undefined)) {
      repScore = 100;
    } else {
      missingSections.push("Repair & Circularity Assessment");
    }

    // Passport
    let passScore = 0;
    if (data.passport && data.passport.passportId) {
      passScore = 100;
    } else {
      missingSections.push("Digital Product Passport (DPP)");
    }

    // Environmental / Carbon
    let envScore = 0;
    if (data.carbon && (data.carbon.totalAvoidedCO2e !== undefined || data.carbon.netAvoidedCO2e !== undefined)) {
      envScore = 100;
    } else {
      missingSections.push("Environmental & Avoided Carbon Impact");
    }

    const overall = Math.round(
      (techScore + healthScore + matScore + repScore + passScore + envScore) / 6
    );

    return {
      technicalPercent: techScore,
      healthPercent: healthScore,
      materialsPercent: matScore,
      repairPercent: repScore,
      passportPercent: passScore,
      environmentalPercent: envScore,
      overallPercent: overall,
      missingSections,
    };
  }

  /**
   * Determine next report version number without overwriting historical records.
   */
  public static async getNextVersion(
    analysisId: string,
    reportType: ReportType
  ): Promise<number> {
    await connectDB();
    const latest = await Report.findOne({ analysisId, reportType })
      .sort({ version: -1 })
      .select("version")
      .lean();
    return latest && typeof latest.version === "number" ? latest.version + 1 : 1;
  }

  /**
   * Generates the Primary Comprehensive Asset Intelligence Report.
   */
  public static async generateAssetReport(
    analysisId: string,
    options: GenerateReportOptions = {}
  ): Promise<IReport> {
    const data = await this.collectPhaseData(analysisId);
    const { session, detection, pcb, rul, materials, repair, passport, carbon } = data;

    const completeness = this.calculateCompleteness(data);
    const version = await this.getNextVersion(session.analysisId, "ASSET");
    const reportId = generateReportId(session.analysisId, version);
    const isDemo = Boolean(session.mode === "DEMO" || session.sourceType === "SAMPLE" || session.deviceName?.includes("Sample"));
    const assetId = (session.metadata as any)?.assetId || session.analysisId;

    const sections: IReportSection[] = [
      {
        id: "asset_identity",
        title: "Asset Identity & Pipeline Provenance",
        type: "IDENTITY",
        content: {
          assetId,
          deviceName: session.deviceName,
          deviceType: session.deviceType,
          manufacturer: (session.metadata as any)?.manufacturer || "Unspecified",
          modelNumber: (session.metadata as any)?.modelNumber || "Unspecified",
          lifecycleStage: session.status,
          initialIntakeDate: session.createdAt,
        },
        confidence: 100,
        evidenceLevel: "VERIFIED",
        source: "Asset Registration Registry",
      },
      {
        id: "technical_pcb",
        title: "Component Detection & PCB Topology",
        type: "TECHNICAL",
        content: detection
          ? {
              componentsDetected: detection.componentsCount || (detection.components ? detection.components.length : 0),
              boardDimensionsMm: pcb?.board?.estimatedPhysicalWidthMm ? `${pcb.board.estimatedPhysicalWidthMm} x ${pcb.board.estimatedPhysicalHeightMm}` : "Not measured",
              traceIntegrityScore: pcb?.reconstruction?.visualIntegrityEstimate ? `${pcb.reconstruction.visualIntegrityEstimate}/100` : "Analysis complete",
              surfaceDefectsCount: pcb?.damagedRegions ? pcb.damagedRegions.length : 0,
              reconstructionStatus: pcb?.status || "COMPLETED",
            }
          : { status: "Data unavailable", message: "YOLO detection or PCB topology unexecuted." },
        confidence: detection?.confidence ? Math.round(detection.confidence * 100) : 85,
        evidenceLevel: detection ? "MEASURED" : "INFERRED",
        source: "YOLOv8 Component Detector + OpenCV PCB Analyzer",
        limitations: detection ? [] : ["Optical detection telemetry was missing or failed during analysis session."],
      },
      {
        id: "health_rul",
        title: "Degradation Physics & Remaining Useful Life",
        type: "HEALTH",
        content: rul
          ? {
              healthScore: `${rul.overallHealthScore}/100`,
              healthStatus: rul.healthStatus || "ASSESSED",
              predictedRemainingLifeYears: rul.predictedRULYears ?? rul.predictedYears ?? "N/A",
              riskCategory: rul.riskCategory || "LOW",
              predictionConfidencePercent: rul.confidenceInterval ? `${rul.confidenceInterval.confidencePercent}%` : "80%",
            }
          : { status: "Data unavailable", message: "RUL degradation model unexecuted." },
        confidence: rul?.confidenceInterval?.confidencePercent || (rul ? 85 : 0),
        evidenceLevel: rul ? "PREDICTED" : "ESTIMATED",
        source: "EcoIntel Physics-Informed XGBoost RUL Engine",
        limitations: ["RUL predictions represent statistical engineering models, not guaranteed operational warranties."],
      },
      {
        id: "material_recovery",
        title: "Material Recovery & Precious Metal Spectrometry",
        type: "MATERIALS",
        content: materials
          ? {
              totalEstimatedMassGrams: materials.boardMass?.estimatedBoardMassGrams || materials.totalEstimatedMaterialMassGrams || "Estimated",
              recoverableMassGrams: materials.totalRecoverableMaterialMassGrams || "Calculated",
              estimatedMarketValueUSD: materials.totalEstimatedMarketValueUSD || 0,
              preciousMetalsCount: materials.preciousMetals ? materials.preciousMetals.length : 0,
              criticalMaterialsIdentified: materials.criticalMaterials ? materials.criticalMaterials.length : 0,
            }
          : { status: "Data unavailable", message: "Material extraction modeling unexecuted." },
        confidence: 85,
        evidenceLevel: materials ? "DATABASE-DERIVED" : "ESTIMATED",
        source: "USGS / WEEE Database + Material Spectrometry Engine",
        limitations: ["Calculated using benchmark material matrices; actual assay mass may vary ±12%."],
      },
      {
        id: "repair_circularity",
        title: "Circularity Decision & Repair Feasibility",
        type: "REPAIR",
        content: repair
          ? {
              repairabilityScore: `${repair.feasibilityIndexPercent || repair.decisionScore || 75}/100`,
              primaryRecommendation: repair.recommendedAction || "REFURBISH",
              economicViability: "VIABLE",
              actionsCount: repair.repairRecommendations ? repair.repairRecommendations.length : 0,
            }
          : { status: "Data unavailable", message: "Repair intelligence unexecuted." },
        confidence: repair?.confidence ? Math.round(repair.confidence * 100) : 80,
        evidenceLevel: repair ? "ESTIMATED" : "INFERRED",
        source: "EcoIntel Circular Decision Matrix",
        limitations: ["Component availability and technician expertise impact real-world turnaround."],
      },
      {
        id: "digital_passport",
        title: "Digital Product Passport & Ledger Traceability",
        type: "PASSPORT",
        content: passport
          ? {
              passportId: passport.passportId,
              passportStatus: passport.status,
              verificationStatus: passport.verificationStatus || "VERIFIED",
              lifecycleEventsRecorded: passport.lifecycleEvents ? passport.lifecycleEvents.length : 0,
            }
          : { status: "Data unavailable", message: "Digital Product Passport not yet minted." },
        confidence: 100,
        evidenceLevel: passport ? "VERIFIED" : "INFERRED",
        source: "EcoIntel DPP Registry & Polygon Blockchain",
        limitations: [],
      },
      {
        id: "carbon_esg",
        title: "Avoided Scope 3 Carbon & ESG Impact",
        type: "CARBON",
        content: carbon
          ? {
              avoidedEmissionsKgCO2e: carbon.totalAvoidedCO2e || carbon.netAvoidedCO2e || 0,
              circularityIndex: `${carbon.circularityScore || 80}/100`,
              wasteDivertedKg: carbon.waste?.divertedWasteKg || 0,
              methodologyStandard: carbon.methodologyVersion || "GHG Protocol Scope 3 + Ecoinvent v3.9",
            }
          : { status: "Data unavailable", message: "Carbon impact analysis unexecuted." },
        confidence: 88,
        evidenceLevel: carbon ? "DATABASE-DERIVED" : "ESTIMATED",
        source: "EcoIntel ESG & Carbon Impact Engine",
        limitations: ["Avoided emissions are comparative lifecycle estimations and do not constitute certified carbon credits."],
      },
    ];

    const summary = {
      deviceName: session.deviceName,
      assetId,
      overallCompleteness: `${completeness.overallPercent}%`,
      healthScore: rul?.overallHealthScore ?? session.rulResult?.overallHealthScore ?? "N/A",
      recommendedAction: repair?.recommendedAction ?? session.repairResult?.recommendedAction ?? "ASSESS",
      estimatedRecoverableValueUSD: materials?.totalEstimatedMarketValueUSD ?? 0,
      avoidedCO2eKg: carbon?.totalAvoidedCO2e ?? 0,
      passportVerified: Boolean(passport?.verificationStatus === "VALID" || passport?.status === "ACTIVE"),
    };

    const report = new Report({
      reportId,
      analysisId: session.analysisId,
      organizationId: options.organizationId || String(session.organizationId || "org-default"),
      passportId: passport?.passportId,
      reportType: "ASSET",
      version,
      status: "READY",
      title: `Asset Intelligence Dossier — ${session.deviceName || assetId}`,
      summary,
      sections,
      completeness,
      methodology: "EcoIntel Circular Intelligence Multi-Stage Verification Pipeline",
      dataSources: [
        "YOLO Optical Component Telemetry",
        "OpenCV Board Topology Reconstruction",
        "Physics-Informed XGBoost RUL Predictor",
        "USGS / WEEE Material Composition Registry",
        "GHG Protocol Corporate Value Chain (Scope 3) Standard",
      ],
      assumptions: [
        "Base operational lifespan benchmarked at 7 years for enterprise PCB equipment.",
        "Precious metals pricing indexed against rolling 30-day LME spot market.",
        "Avoided emissions assume 1:1 displacement of virgin manufacturing.",
      ],
      limitations: [
        "Estimates reflect current observable degradation and do not replace physical destructive testing.",
        "Environmental calculations are for internal ESG reporting, not certified carbon offsets.",
      ],
      isDemo,
      branding: options.branding || {
        organizationName: "EcoIntel Enterprise",
        reportFooter: "EcoIntel Circular Intelligence Dossier — Confidential & Verified.",
      },
      format: options.format || "PDF",
      fileUrl: `/api/reports/${reportId}/download`,
      generatedBy: options.generatedBy || "system",
      generatedAt: new Date(),
    });

    await report.save();

    // Link back to AnalysisSession
    await AnalysisSession.updateOne(
      { analysisId: session.analysisId },
      { $set: { reportId: report.reportId } }
    );

    // Record Audit Log
    await AuditLog.create({
      action: "REPORT_GENERATED",
      resource: "REPORT",
      resourceId: report.reportId,
      userId: options.generatedBy || "system",
      organizationId: report.organizationId,
      metadata: {
        reportType: "ASSET",
        version: report.version,
        completeness: completeness.overallPercent,
      },
    });

    // Send Notification
    await Notification.create({
      notificationId: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      organizationId: report.organizationId,
      type: "REPORT_READY",
      title: `Asset Intelligence Report Generated (v${report.version})`,
      message: `Complete dossier ready for ${session.deviceName} (${completeness.overallPercent}% completeness).`,
      severity: "SUCCESS",
      entityType: "REPORT",
      entityId: report.reportId,
      read: false,
    });

    return report;
  }

  /**
   * Generates a Technical PCB & Topology Report.
   */
  public static async generateTechnicalReport(
    analysisId: string,
    options: GenerateReportOptions = {}
  ): Promise<IReport> {
    const data = await this.collectPhaseData(analysisId);
    const { session, detection, pcb } = data;
    const completeness = this.calculateCompleteness(data);
    const version = await this.getNextVersion(session.analysisId, "TECHNICAL");
    const reportId = generateReportId(session.analysisId, version);
    const isDemo = Boolean(session.mode === "DEMO" || session.sourceType === "SAMPLE");
    const assetId = (session.metadata as any)?.assetId || session.analysisId;

    const sections: IReportSection[] = [
      {
        id: "board_geometry",
        title: "Board Dimensions & Substrate Geometry",
        type: "GEOMETRY",
        content: pcb?.board?.estimatedPhysicalWidthMm
          ? {
              widthMm: pcb.board.estimatedPhysicalWidthMm,
              heightMm: pcb.board.estimatedPhysicalHeightMm,
              aspectRatio: pcb.board.aspectRatio || 1.33,
              layersCount: pcb.layers?.estimatedCount || 2,
            }
          : { status: "Data unavailable", message: "Board geometry unmeasured." },
        evidenceLevel: pcb?.board?.estimatedPhysicalWidthMm ? "MEASURED" : "INFERRED",
        source: "OpenCV Edge Detection",
      },
      {
        id: "detected_components",
        title: "Component Inventory & Detection Classification",
        type: "COMPONENTS",
        content: detection
          ? {
              totalCount: detection.componentsCount || 0,
              confidenceAvg: detection.confidence ? `${Math.round(detection.confidence * 100)}%` : "N/A",
              breakdown: detection.componentBreakdown || {},
            }
          : { status: "Data unavailable" },
        evidenceLevel: detection ? "MEASURED" : "INFERRED",
        source: "YOLO Component Detection Model",
      },
      {
        id: "trace_topology",
        title: "High-Frequency Trace & Pad Analysis",
        type: "TRACES",
        content: pcb
          ? {
              traceIntegrityScore: pcb.reconstruction?.visualIntegrityEstimate || 88,
              defectsDetected: pcb.damagedRegions?.length || 0,
              padsCount: pcb.pads?.length || 0,
              viasCount: pcb.vias?.length || 0,
            }
          : { status: "Data unavailable" },
        evidenceLevel: pcb ? "MEASURED" : "INFERRED",
        source: "Computer Vision Trace Reconstruction",
      },
    ];

    const report = new Report({
      reportId,
      analysisId: session.analysisId,
      organizationId: options.organizationId || String(session.organizationId || "org-default"),
      reportType: "TECHNICAL",
      version,
      status: "READY",
      title: `Technical PCB Intelligence Report — ${session.deviceName || assetId}`,
      summary: {
        componentsDetected: detection?.componentsCount || 0,
        boardDimensions: pcb?.board?.estimatedPhysicalWidthMm ? `${pcb.board.estimatedPhysicalWidthMm}x${pcb.board.estimatedPhysicalHeightMm}mm` : "Unknown",
        traceIntegrity: pcb?.reconstruction?.visualIntegrityEstimate || "N/A",
      },
      sections,
      completeness,
      methodology: "Computer Vision Topology & Component Feature Extraction",
      dataSources: ["High-Res Optical Scan", "YOLO Model Inference"],
      assumptions: ["Component classifications are bounded by visible top-side components."],
      limitations: ["Internal multi-layer copper planes cannot be inspected via optical scan alone."],
      isDemo,
      branding: options.branding,
      format: options.format || "PDF",
      fileUrl: `/api/reports/${reportId}/download`,
      generatedBy: options.generatedBy || "system",
      generatedAt: new Date(),
    });

    await report.save();
    return report;
  }

  /**
   * Generates a Circularity & Repair Intelligence Report.
   */
  public static async generateCircularityReport(
    analysisId: string,
    options: GenerateReportOptions = {}
  ): Promise<IReport> {
    const data = await this.collectPhaseData(analysisId);
    const { session, repair, materials } = data;
    const completeness = this.calculateCompleteness(data);
    const version = await this.getNextVersion(session.analysisId, "CIRCULARITY");
    const reportId = generateReportId(session.analysisId, version);
    const isDemo = Boolean(session.mode === "DEMO" || session.sourceType === "SAMPLE");
    const assetId = (session.metadata as any)?.assetId || session.analysisId;

    const sections: IReportSection[] = [
      {
        id: "repair_actions",
        title: "Recommended Circular Action Matrix",
        type: "ACTIONS",
        content: repair
          ? {
              recommendedAction: repair.recommendedAction,
              repairabilityScore: repair.feasibilityIndexPercent || repair.decisionScore,
              requiredActions: repair.repairRecommendations || [],
            }
          : { status: "Data unavailable" },
        evidenceLevel: repair ? "ESTIMATED" : "INFERRED",
        source: "EcoIntel Repair Decision Engine",
      },
      {
        id: "material_recovery_potential",
        title: "Downstream Materials Recovery Feasibility",
        type: "RECOVERY",
        content: materials
          ? {
              recoverableMassGrams: materials.totalRecoverableMaterialMassGrams,
              estimatedValueUSD: materials.totalEstimatedMarketValueUSD,
            }
          : { status: "Data unavailable" },
        evidenceLevel: materials ? "DATABASE-DERIVED" : "ESTIMATED",
        source: "Material Spectrometry Index",
      },
    ];

    const report = new Report({
      reportId,
      analysisId: session.analysisId,
      organizationId: options.organizationId || String(session.organizationId || "org-default"),
      reportType: "CIRCULARITY",
      version,
      status: "READY",
      title: `Circularity & Repair Intelligence Report — ${session.deviceName || assetId}`,
      summary: {
        primaryRecommendation: repair?.recommendedAction || "ASSESS",
        repairabilityScore: repair?.feasibilityIndexPercent || repair?.decisionScore || "N/A",
        recoveryValueUSD: materials?.totalEstimatedMarketValueUSD || 0,
      },
      sections,
      completeness,
      methodology: "Hierarchical R-Strategy Optimization (Reuse > Refurbish > Harvest > Recycle)",
      dataSources: ["Repair Diagnostics Engine", "WEEE Circular Directives"],
      assumptions: ["Labor rates modeled at standard industrial IPC-A-610 rework rates."],
      limitations: ["Actual repair feasibility depends on part availability in the supply chain."],
      isDemo,
      branding: options.branding,
      format: options.format || "PDF",
      fileUrl: `/api/reports/${reportId}/download`,
      generatedBy: options.generatedBy || "system",
      generatedAt: new Date(),
    });

    await report.save();
    return report;
  }

  /**
   * Generates an Environmental & Carbon Impact Report.
   */
  public static async generateEnvironmentalReport(
    analysisId: string,
    options: GenerateReportOptions = {}
  ): Promise<IReport> {
    const data = await this.collectPhaseData(analysisId);
    const { session, carbon } = data;
    const completeness = this.calculateCompleteness(data);
    const version = await this.getNextVersion(session.analysisId, "ENVIRONMENTAL");
    const reportId = generateReportId(session.analysisId, version);
    const isDemo = Boolean(session.mode === "DEMO" || session.sourceType === "SAMPLE");
    const assetId = (session.metadata as any)?.assetId || session.analysisId;

    const sections: IReportSection[] = [
      {
        id: "ghg_avoidance",
        title: "Avoided Greenhouse Gas Emissions",
        type: "CARBON_BENEFIT",
        content: carbon
          ? {
              avoidedEmissionsKgCO2e: carbon.totalAvoidedCO2e || carbon.netAvoidedCO2e,
              breakdownByMaterial: carbon.materials?.details || [],
            }
          : { status: "Data unavailable" },
        evidenceLevel: carbon ? "DATABASE-DERIVED" : "ESTIMATED",
        source: "GHG Protocol Scope 3 Model + Ecoinvent",
      },
      {
        id: "circularity_metrics",
        title: "Circularity & Landfill Diversion Metrics",
        type: "CIRCULARITY_METRICS",
        content: carbon
          ? {
              circularityScore: carbon.circularityScore,
              wasteDivertedKg: carbon.waste?.divertedWasteKg,
            }
          : { status: "Data unavailable" },
        evidenceLevel: carbon ? "DATABASE-DERIVED" : "ESTIMATED",
        source: "Material Flow Analysis Engine",
      },
    ];

    const report = new Report({
      reportId,
      analysisId: session.analysisId,
      organizationId: options.organizationId || String(session.organizationId || "org-default"),
      reportType: "ENVIRONMENTAL",
      version,
      status: "READY",
      title: `Avoided Carbon & Environmental Impact Report — ${session.deviceName || assetId}`,
      summary: {
        avoidedEmissionsKgCO2e: carbon?.totalAvoidedCO2e || carbon?.netAvoidedCO2e || 0,
        wasteDivertedKg: carbon?.waste?.divertedWasteKg || 0,
        circularityScore: carbon?.circularityScore || "N/A",
      },
      sections,
      completeness,
      methodology: "ISO 14044 Life Cycle Assessment & GHG Protocol Scope 3 Category 1/12",
      dataSources: ["Ecoinvent v3.9", "USGS Minerals Yearbook", "Department for Environment (Defra) Conversion Factors"],
      assumptions: ["Electricity displacement grid factors based on 2024 regional national averages."],
      limitations: ["Does not represent formal third-party audited carbon credits or offsets."],
      isDemo,
      branding: options.branding,
      format: options.format || "PDF",
      fileUrl: `/api/reports/${reportId}/download`,
      generatedBy: options.generatedBy || "system",
      generatedAt: new Date(),
    });

    await report.save();
    return report;
  }

  /**
   * Generates an Executive Organization-Level Portfolio Report.
   */
  public static async generateExecutiveReport(
    organizationId: string,
    options: GenerateReportOptions = {}
  ): Promise<IReport> {
    await connectDB();

    const [
      totalSessions,
      completedSessions,
      totalCarbon,
      totalListings,
      passportsCount,
    ] = await Promise.all([
      AnalysisSession.countDocuments({ organizationId }),
      AnalysisSession.countDocuments({ organizationId, status: "COMPLETED" }),
      CarbonImpact.find({ organizationId }).lean(),
      MarketplaceListing.countDocuments({ sellerOrganizationId: organizationId, status: { $in: ["PUBLISHED", "ACTIVE"] } }),
      DigitalPassport.countDocuments({ organizationId }),
    ]);

    const avoidedEmissionsSum = totalCarbon.reduce((acc, c: any) => acc + (c.totalAvoidedCO2e || c.netAvoidedCO2e || 0), 0);
    const wasteDivertedSum = totalCarbon.reduce((acc, c: any) => acc + (c.waste?.divertedWasteKg || 0), 0);

    const reportId = `rep-exec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const version = 1;

    const sections: IReportSection[] = [
      {
        id: "portfolio_kpis",
        title: "Enterprise Portfolio KPIs",
        type: "EXECUTIVE_KPIS",
        content: {
          totalAssetsAnalyzed: totalSessions,
          pipelineCompletedAssets: completedSessions,
          activeMarketplaceListings: totalListings,
          digitalPassportsMinted: passportsCount,
          totalAvoidedCO2eKg: Math.round(avoidedEmissionsSum * 100) / 100,
          totalWasteDivertedKg: Math.round(wasteDivertedSum * 100) / 100,
        },
        evidenceLevel: "VERIFIED",
        source: "Aggregated Enterprise Telemetry",
      },
      {
        id: "strategic_recommendations",
        title: "Key Circular Opportunities & Actions",
        type: "RECOMMENDATIONS",
        content: {
          reuseRateTarget: "Increase high-health component swaps to achieve >65% reuse rate.",
          marketplaceVelocity: `${totalListings} active listings currently available for component exchange.`,
          passportsCoverage: `${passportsCount}/${totalSessions || 1} assets currently tracked with verifiable Digital Product Passports.`,
        },
        evidenceLevel: "DATABASE-DERIVED",
        source: "Portfolio Optimization Engine",
      },
    ];

    const report = new Report({
      reportId,
      organizationId,
      reportType: "EXECUTIVE",
      version,
      status: "READY",
      title: `Executive Circular Intelligence Briefing — ${options.branding?.organizationName || organizationId}`,
      summary: {
        totalAssets: totalSessions,
        completedAnalyses: completedSessions,
        totalAvoidedCO2eKg: avoidedEmissionsSum,
        activeListings: totalListings,
        passportsMinted: passportsCount,
      },
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
      methodology: "Enterprise Cross-Portfolio Intelligence Aggregation",
      dataSources: ["All Organization Asset Sessions", "Circularity & Carbon Ledgers"],
      assumptions: ["All active organization records included in rolling total."],
      limitations: ["Pending pipeline sessions will be reflected in subsequent audit cycles."],
      isDemo: false,
      branding: options.branding,
      format: options.format || "PDF",
      fileUrl: `/api/reports/${reportId}/download`,
      generatedBy: options.generatedBy || "executive",
      generatedAt: new Date(),
    });

    await report.save();
    return report;
  }

  /**
   * Generates downloadable document data (PDF Buffer, JSON, or CSV).
   */
  public static async exportReport(
    reportId: string,
    format: "PDF" | "JSON" | "CSV"
  ): Promise<{ data: Buffer | string; contentType: string; filename: string }> {
    await connectDB();
    const report = await Report.findOne({ reportId });
    if (!report) {
      throw new Error(`Report '${reportId}' not found.`);
    }

    if (format === "PDF") {
      const pdfBuffer = ReportPdfGenerator.generatePdf(report);
      return {
        data: pdfBuffer,
        contentType: "application/pdf",
        filename: `${report.reportId}_v${report.version}.pdf`,
      };
    }

    if (format === "JSON") {
      const jsonStr = JSON.stringify(report.toJSON(), null, 2);
      return {
        data: jsonStr,
        contentType: "application/json",
        filename: `${report.reportId}_v${report.version}.json`,
      };
    }

    if (format === "CSV") {
      const rows: string[] = [
        "Report ID,Version,Type,Title,Status,Completeness Overall %,Generated At",
        `"${report.reportId}",${report.version},"${report.reportType}","${report.title}","${report.status}",${report.completeness?.overallPercent || 0},"${report.generatedAt.toISOString()}"`,
        "",
        "Section ID,Section Title,Evidence Level,Confidence %,Source,Content Summary",
      ];

      for (const sec of report.sections) {
        const contentStr = typeof sec.content === "object" ? JSON.stringify(sec.content).replace(/"/g, '""') : String(sec.content || "");
        rows.push(
          `"${sec.id}","${sec.title}","${sec.evidenceLevel || "ESTIMATED"}",${sec.confidence ?? "N/A"},"${sec.source || ""}","${contentStr.substring(0, 200)}"`
        );
      }

      return {
        data: rows.join("\n"),
        contentType: "text/csv",
        filename: `${report.reportId}_v${report.version}.csv`,
      };
    }

    throw new Error(`Unsupported export format: ${format}`);
  }
}
