import { SAMPLE_DATASETS } from "@/lib/data/sampleDatasets";
import {
  AnalysisSession as IAnalysisSession,
  AnalysisStatus as IAnalysisStatus,
  DetectionData,
  PcbAnalysisData,
  RulPredictionData,
  MaterialRecoveryData,
  RepairAssessmentData,
  PassportData,
  CarbonImpactData,
  ReportData,
} from "@/lib/types/analysis";

// Local in-memory cache for fast lookups
const sessionCache = new Map<string, IAnalysisSession>();

export function convertSampleToSession(
  dataset: any,
  status: IAnalysisStatus = "COMPLETED",
  customId?: string
): IAnalysisSession {
  const id = customId || `ECI-2026-${dataset.id === "router-board" ? "7740" : Math.floor(1000 + Math.random() * 9000)}`;

  // Enrich metal yields with confidence and potential if needed
  const enrichedYields = (dataset.metals?.yields || []).map((y: any) => ({
    ...y,
    recoveryPotentialPercent: y.recoveryPotentialPercent || Math.round(92 + Math.random() * 7),
    confidencePercent: y.confidencePercent || Math.round(94 + Math.random() * 5),
    sourceType: "Sample" as const,
  }));

  // Ensure repair issues have clear rationale
  const enrichedIssues = (dataset.repair?.issues || []).map((issue: any) => ({
    ...issue,
    condition: issue.issue || "Thermal or physical aging",
    rationale:
      issue.rationale ||
      `Diagnostic scan identified operational wear within ${issue.severity} severity envelope. Recommending ${issue.action || "inspection"}.`,
    confidence: issue.confidence || 94,
    action: (issue.action || "Repair") as any,
  }));

  const sessionObj: IAnalysisSession = {
    id,
    userId: "usr_lab_operator_01",
    sourceType: "sample",
    sampleId: dataset.id,
    deviceType: dataset.deviceType,
    deviceName: dataset.name,
    imageUrl: dataset.image,
    status,
    dataClassification: "sample",

    detection: {
      model: dataset.detection.model,
      inferenceTimeMs: dataset.detection.inferenceTimeMs,
      confidenceAvg: dataset.detection.confidenceAvg,
      componentsCount: dataset.detection.componentsCount,
      components: dataset.detection.components,
    },

    pcbAnalysis: {
      pcbId: dataset.reconstruction.pcbId,
      boardModel: dataset.reconstruction.boardModel,
      layerCount: dataset.reconstruction.layerCount,
      traceIntegrityPercent: dataset.reconstruction.traceIntegrityPercent,
      severedTracesRepaired: dataset.reconstruction.severedTracesRepaired,
      reconstructionConfidence: dataset.reconstruction.reconstructionConfidence,
      reconstructionType: "Demonstration reconstruction",
      damagedAreasCount: dataset.reconstruction.severedTracesRepaired || 0,
      reconstructedAreasCount: dataset.reconstruction.severedTracesRepaired || 0,
      schematics: dataset.reconstruction.schematics,
    },

    rulPrediction: {
      overallHealthScore: dataset.rul.overallHealthScore,
      predictedYears: dataset.rul.predictedYears,
      predictedHours: dataset.rul.predictedHours,
      failureProbability: dataset.rul.failureProbability,
      confidence: dataset.rul.confidence,
      parameters: {
        operatingTempCelsius: dataset.rul.parameters.operatingTempCelsius,
        inputVoltageVolts: dataset.rul.parameters.inputVoltageVolts,
        operatingCycles: dataset.rul.parameters.operatingCycles,
        ageYears: dataset.rul.parameters.ageYears,
        wearFactor: 12,
        corrosionIndex: 4,
        electricalTestData: "Pass · 50-Ohm Controlled Impedance",
      },
    },

    materialRecovery: {
      pcbWeightKg: dataset.metals.pcbWeightKg,
      recoveryEfficiencyPercent: dataset.metals.recoveryEfficiencyPercent,
      totalEstimatedMarketValueUSD: dataset.metals.totalEstimatedMarketValueUSD,
      calculationBasis: "Calculated from board area, copper layer count, and spectro-spatial surface contact gold estimate.",
      yields: enrichedYields,
    },

    repairAssessment: {
      reportId: dataset.repair.reportId,
      recommendedAction: dataset.repair.recommendedAction,
      primaryFault: dataset.repair.primaryFault,
      estimatedRepairCostUSD: dataset.repair.estimatedRepairCostUSD,
      estimatedCO2SavingsKg: dataset.repair.estimatedCO2SavingsKg,
      feasibilityIndexPercent: dataset.repair.feasibilityIndexPercent,
      issues: enrichedIssues,
    },

    passport: {
      passportId: dataset.passport.passportId,
      tokenId: dataset.passport.tokenId,
      componentId: `${dataset.id.toUpperCase()}-MAIN`,
      deviceOrigin: dataset.passport.originFacility || "EcoIntel Circular Inspection Lab 01",
      recoveryDate: new Date().toISOString().split("T")[0],
      health: dataset.rul.overallHealthScore,
      remainingLifeYears: dataset.rul.predictedYears,
      repairHistory: ["Optical Saliency Inspection Verified", "IPC-A-610 Class 3 Integrity Passed"],
      reuseCount: dataset.passport.reuseCycleCount || 0,
      ownership: "Certified Circular Custody",
      verificationStatus: "Prepared",
      blockchainStatus: "Passport Prepared",
      contractAddress: dataset.passport.contractAddress || "0x3B82F6e71C7656EC7ab88b098defB751B7401B5f",
      originFacility: dataset.passport.originFacility || "EcoIntel Telecom Lab 07",
      manufactureYear: dataset.passport.manufactureYear || 2024,
      reuseCycleCount: dataset.passport.reuseCycleCount || 0,
      isVerified: true,
      qrDataUri: dataset.passport.qrDataUri,
    },

    carbonImpact: {
      co2AvoidedKg: dataset.carbon.co2AvoidedKg,
      energySavedKWh: dataset.carbon.energySavedKWh,
      waterSavedLiters: dataset.carbon.waterSavedLiters,
      eWasteDivertedKg: dataset.carbon.eWasteDivertedKg,
      circularityScorePercent: dataset.carbon.circularityScorePercent,
      materialsRecoveredPercent: dataset.metals.recoveryEfficiencyPercent,
      componentsReusedCount: dataset.componentCount,
      calculationBasis: "Estimated from component reuse scenario. Calculation status: Calculated Estimate (Scope 3 GHG Protocol).",
    },

    report: {
      reportId: `REP-${id}`,
      generatedAt: new Date().toISOString(),
      version: "2.4.0",
      isReady: status === "COMPLETED",
    },

    executiveSummary: {
      ...dataset.executiveSummary,
      confidencePercent: Math.round(dataset.detection.confidenceAvg),
    },

    imageQuality: {
      quality: "good",
      resolution: dataset.hardwareSpecs?.dimensions || "2400 x 1600 px",
      lightingScore: 98,
      visibilityPercent: 96,
      estimatedComponentsVisible: dataset.componentCount,
    },

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    // Backward compatibility mappings
    sessionId: id,
    detectionResult: dataset.detection,
    reconstructionResult: dataset.reconstruction,
    rulResult: dataset.rul,
    metalResult: dataset.metals,
    repairResult: dataset.repair,
    passportResult: dataset.passport,
    passportId: dataset.passport.passportId,
    carbonResult: dataset.carbon,
    reportId: `REP-${id}`,
    image: dataset.image,
  };

  sessionCache.set(id, sessionObj);
  return sessionObj;
}

export const defaultRouterSession = convertSampleToSession(
  SAMPLE_DATASETS["router-board"] || SAMPLE_DATASETS["laptop-motherboard"],
  "COMPLETED",
  "ECI-2026-7740"
);

export class AnalysisService {
  async getSession(id: string): Promise<IAnalysisSession> {
    if (sessionCache.has(id)) {
      return sessionCache.get(id)!;
    }

    try {
      const res = await fetch(`/api/sessions?sessionId=${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          sessionCache.set(id, data.session);
          return data.session;
        }
      }
    } catch (e) {
      console.warn("API getSession fallback:", e);
    }

    // Check localStorage
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("ecointel_active_analysis_session_v2");
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed?.id === id || parsed?.sessionId === id) {
            sessionCache.set(id, parsed);
            return parsed;
          }
        }
      } catch (err) {
        // ignore
      }
    }

    // If ID references a known sample
    const matchingSample = Object.values(SAMPLE_DATASETS).find((s) => s.id === id);
    if (matchingSample) {
      return convertSampleToSession(matchingSample, "COMPLETED", id);
    }

    // Default to router board sample with this id
    return convertSampleToSession(SAMPLE_DATASETS["router-board"], "COMPLETED", id);
  }

  async saveSession(session: IAnalysisSession): Promise<IAnalysisSession> {
    sessionCache.set(session.id, session);
    if (session.sessionId) sessionCache.set(session.sessionId, session);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ecointel_active_analysis_session_v2", JSON.stringify(session));
      } catch (e) {
        console.warn("Local storage write error:", e);
      }
    }

    // Background sync to API
    try {
      fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session),
      }).catch((e) => console.warn("Background session sync:", e));
    } catch (err) {
      // ignore
    }

    return session;
  }

  async getDetection(sessionId: string): Promise<DetectionData> {
    const session = await this.getSession(sessionId);
    return session.detection;
  }

  async getPCBAnalysis(sessionId: string): Promise<PcbAnalysisData> {
    const session = await this.getSession(sessionId);
    return session.pcbAnalysis;
  }

  async getRUL(sessionId: string): Promise<RulPredictionData> {
    const session = await this.getSession(sessionId);
    return session.rulPrediction;
  }

  async getMaterials(sessionId: string): Promise<MaterialRecoveryData> {
    const session = await this.getSession(sessionId);
    return session.materialRecovery;
  }

  async getRepair(sessionId: string): Promise<RepairAssessmentData> {
    const session = await this.getSession(sessionId);
    return session.repairAssessment;
  }

  async getPassport(sessionId: string): Promise<PassportData> {
    const session = await this.getSession(sessionId);
    return session.passport;
  }

  async getCarbon(sessionId: string): Promise<CarbonImpactData> {
    const session = await this.getSession(sessionId);
    return session.carbonImpact;
  }
}

export const analysisService = new AnalysisService();
