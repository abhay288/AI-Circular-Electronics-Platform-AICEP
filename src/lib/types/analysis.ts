export type AnalysisStatus =
  | "DRAFT"
  | "CAPTURED"
  | "PROCESSING"
  | "DETECTION_COMPLETE"
  | "PCB_ANALYSIS_COMPLETE"
  | "RUL_COMPLETE"
  | "MATERIAL_ANALYSIS_COMPLETE"
  | "REPAIR_COMPLETE"
  | "PASSPORT_READY"
  | "REPORT_READY"
  | "COMPLETED"
  | "FAILED";

export type DataClassification =
  | "measured"
  | "detected"
  | "predicted"
  | "estimated"
  | "simulated"
  | "sample";

export interface DetectedComponent {
  id: string;
  name: string;
  type: string;
  manufacturer: string;
  package: string;
  confidence: number;
  health: number;
  remainingLifeHours: number;
  remainingLifeYears: number;
  material: string;
  coordinates: { x: number; y: number; width: number; height: number };
  status: string;
  passportId: string;
  repairRecommendation: string;
}

export interface DetectionData {
  model: string;
  provider?: "MOCK" | "YOLO" | "RT-DETR" | string;
  inferenceTimeMs: number;
  confidenceAvg: number;
  componentsCount: number;
  components: DetectedComponent[];
  quality?: {
    quality: string;
    score: number;
    warnings: string[];
  };
  warnings?: string[];
}

export interface PcbAnalysisData {
  pcbId: string;
  boardModel: string;
  layerCount: number;
  traceIntegrityPercent: number;
  severedTracesRepaired: number;
  reconstructionConfidence: number;
  reconstructionType: "Demonstration reconstruction" | "Reconstruction estimate" | "Cad netlist extracted";
  damagedAreasCount?: number;
  reconstructedAreasCount?: number;
  schematics: {
    kicadFileUrl: string;
    gerberZipUrl: string;
    netlistRaw: string;
  };
}

export interface RulPredictionData {
  overallHealthScore: number;
  predictedYears: number;
  predictedHours: number;
  failureProbability: number;
  confidence: number;
  parameters: {
    operatingTempCelsius: number;
    inputVoltageVolts: number;
    operatingCycles: number;
    ageYears: number;
    wearFactor?: number;
    corrosionIndex?: number;
    electricalTestData?: string;
  };
}

export interface MetalYieldItem {
  metal: string;
  symbol: string;
  yieldGrams: number;
  marketRateUSD: number;
  estimatedValueUSD: number;
  color: string;
  recoveryPotentialPercent: number;
  confidencePercent: number;
  sourceType: "Measured" | "Estimated" | "Predicted" | "Sample";
}

export interface MaterialRecoveryData {
  pcbWeightKg: number;
  recoveryEfficiencyPercent: number;
  totalEstimatedMarketValueUSD: number;
  calculationBasis: string;
  yields: MetalYieldItem[];
}

export interface RepairIssue {
  component: string;
  condition: string;
  issue?: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  recommendation: string;
  action: "Repair" | "Replace" | "Reuse" | "Refurbish" | "Recycle";
  rationale: string;
}

export interface RepairAssessmentData {
  reportId: string;
  recommendedAction: "reuse" | "repair" | "refurbish" | "recover" | "recycle";
  primaryFault: string;
  estimatedRepairCostUSD: number;
  estimatedCO2SavingsKg: number;
  feasibilityIndexPercent: number;
  issues: RepairIssue[];
}

export interface PassportData {
  passportId: string;
  tokenId: string;
  componentId?: string;
  deviceOrigin: string;
  recoveryDate: string;
  health: number;
  remainingLifeYears: number;
  repairHistory: string[];
  reuseCount: number;
  ownership: string;
  verificationStatus: "Verified" | "Pending Verification" | "Prepared";
  blockchainStatus: "Passport Prepared" | "Verification Pending" | "Verified on Polygon";
  polygonTransactionHash?: string;
  contractAddress?: string;
  originFacility: string;
  manufactureYear: number;
  reuseCycleCount: number;
  isVerified: boolean;
  qrDataUri: string;
}

export interface EnvironmentalMetric {
  name: string;
  value: number;
  unit: string;
  calculationBasis: string;
  status: "Estimated" | "Calculated Estimate" | "ESG Reporting Estimate";
}

export interface CarbonImpactData {
  co2AvoidedKg: number;
  energySavedKWh: number;
  waterSavedLiters: number;
  eWasteDivertedKg: number;
  circularityScorePercent: number;
  materialsRecoveredPercent?: number;
  componentsReusedCount?: number;
  calculationBasis: string;
  metrics?: Record<string, EnvironmentalMetric>;
}

export interface ReportData {
  reportId: string;
  generatedAt: string;
  version: string;
  isReady: boolean;
  downloadPdfUrl?: string;
  downloadJsonUrl?: string;
  downloadCsvUrl?: string;
}

export interface ExecutiveSummaryData {
  overallHealthPercent: number;
  classification: string;
  potentialValueUSD: number;
  estimatedRemainingLifeYears: number;
  componentsDetectedCount: number;
  recommendedAction: string;
  confidencePercent: number;
}

export interface AnalysisSession {
  id: string; // e.g. "ECI-2026-7740"
  userId: string;
  sourceType: "upload" | "camera" | "sample";
  sampleId?: string;
  deviceType: string;
  deviceName: string;
  imageUrl: string;
  status: AnalysisStatus;
  dataClassification: DataClassification;

  // Module lifecycle payloads
  detection: DetectionData;
  pcbAnalysis: PcbAnalysisData;
  rulPrediction: RulPredictionData;
  materialRecovery: MaterialRecoveryData;
  repairAssessment: RepairAssessmentData;
  passport: PassportData;
  carbonImpact: CarbonImpactData;
  report: ReportData;

  executiveSummary: ExecutiveSummaryData;
  imageQuality?: {
    quality: "good" | "acceptable" | "poor";
    resolution: string;
    lightingScore: number;
    visibilityPercent: number;
    estimatedComponentsVisible: number;
  };

  createdAt: string;
  updatedAt: string;

  // Aliases for seamless backward compatibility
  sessionId?: string;
  detectionResult?: DetectionData;
  reconstructionResult?: PcbAnalysisData;
  rulResult?: RulPredictionData;
  metalResult?: MaterialRecoveryData;
  repairResult?: RepairAssessmentData;
  passportResult?: PassportData;
  passportId?: string;
  carbonResult?: CarbonImpactData;
  reportId?: string;
  image?: string;
}

export interface IngestDraft {
  sourceType: "sample" | "upload" | "camera";
  sampleId?: string;
  deviceName: string;
  deviceType: string;
  datasetName: string;
  imageUrl: string;
  fileName?: string;
  fileSizeBytes?: number;
  imageQuality: {
    quality: "good" | "acceptable" | "poor";
    resolution: string;
    lightingScore: number;
    visibilityPercent: number;
    estimatedComponentsVisible: number;
  };
  status: "Ready for Analysis" | "Validating";
}

export interface RecentSessionMeta {
  id: string;
  deviceName: string;
  deviceType: string;
  sourceType: "sample" | "upload" | "camera";
  status: AnalysisStatus;
  createdAt: string;
  updatedAt: string;
  healthScore?: number;
  componentCount?: number;
  dataClassification: DataClassification;
}

