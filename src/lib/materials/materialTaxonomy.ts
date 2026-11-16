/**
 * EcoIntel Material Recovery Intelligence — Canonical Taxonomy & Evidence Model
 *
 * Defines material categories, evidence levels, source types, recovery scenarios,
 * and strongly typed data contracts for physical material estimation.
 */

export type MaterialCategory =
  | "PRECIOUS_METAL"
  | "BASE_METAL"
  | "CRITICAL_MATERIAL"
  | "OTHER";

export type EvidenceLevel =
  | "MEASURED"
  | "KNOWN"
  | "DATABASE_DERIVED"
  | "ESTIMATED"
  | "INFERRED"
  | "SIMULATED"
  | "UNKNOWN";

export type SourceType =
  | "MEASURED"
  | "MANUFACTURER_DATASHEET"
  | "AUTHORITATIVE_DATABASE"
  | "LITERATURE"
  | "INTERNAL_DATABASE"
  | "MODEL_ESTIMATE"
  | "SYNTHETIC_DEMO"
  | "UNKNOWN";

export type MassSource =
  | "MEASURED"
  | "KNOWN"
  | "DATASHEET"
  | "DATABASE"
  | "ESTIMATED";

export type RecoveryPriority = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

export type RecoveryScenarioType = "conservative" | "typical" | "optimistic";

export interface MaterialEvidence {
  type: "DATABASE" | "COMPONENT_TYPE" | "PACKAGE" | "SUBSTRATE" | "SPECTROMETRY" | "BOM" | "VISUAL_INFERENCE";
  source: string;
  value?: string;
  confidence?: number;
}

export interface IMassBasis {
  massValue: number;
  massUnit: "g" | "kg" | "mg";
  massSource: MassSource;
  massConfidence: number;
  estimatedBoardMassGrams: number;
  boardAreaCm2?: number;
  calculationMethod: string;
}

export interface IMaterialSummaryItem {
  material: string;
  symbol: string;
  atomicNumber: number;
  category: MaterialCategory;
  estimatedMassGrams: number;
  minMassGrams: number;
  maxMassGrams: number;
  recoverableMassGrams: number;
  evidenceLevel: EvidenceLevel;
  confidence: number;
  primarySources: string[];
  unit: "g" | "mg" | "kg";
  notes?: string;
}

export interface IPreciousMetalItem {
  metal: "Gold" | "Silver" | "Palladium" | "Platinum";
  symbol: "Au" | "Ag" | "Pd" | "Pt";
  presence: "DETECTED_ESTIMATED" | "PROBABLE" | "POSSIBLE" | "INSUFFICIENT_EVIDENCE";
  estimatedMassMg: number;
  minMassMg: number;
  maxMassMg: number;
  recoverableMassMg: number;
  typicalRecoveryRate: number; // e.g. 0.85
  evidenceLevel: EvidenceLevel;
  confidence: number;
  evidence: MaterialEvidence[];
  contributingComponentCount: number;
  indicativeMarketRateUSDPerGram?: number;
  indicativeEstimatedValueUSD?: number;
}

export interface IComponentMaterialContribution {
  componentId: string;
  componentType: string;
  packageName?: string;
  partNumber?: string;
  estimatedMassGrams: number;
  recoveryPriority: RecoveryPriority;
  materials: Array<{
    material: string;
    symbol: string;
    category: MaterialCategory;
    massFractionTypical: number;
    estimatedMassGrams: number;
    recoverableMassGrams: number;
    evidenceLevel: EvidenceLevel;
    confidence: number;
  }>;
  primaryRecoverableMetal?: string;
  confidence: number;
  notes?: string;
}

export interface IScenarioDetail {
  scenario: RecoveryScenarioType;
  description: string;
  assumption: string;
  averageRecoveryEfficiency: number; // e.g. 0.70, 0.85, 0.94
  recoverableTotalMassGrams: number;
  recoverablePreciousMetalsMg: {
    gold: number;
    silver: number;
    palladium: number;
    platinum: number;
  };
  recoverableBaseMetalsGrams: {
    copper: number;
    aluminum: number;
    tin: number;
    nickel: number;
    iron: number;
  };
}

export interface IRecoveryScenarios {
  conservative: IScenarioDetail;
  typical: IScenarioDetail;
  optimistic: IScenarioDetail;
}

export interface IMaterialSourceRecord {
  material: string;
  sourceType: SourceType;
  reference: string;
  qualityRating: "PEER_REVIEWED_LITERATURE" | "INDUSTRY_STANDARD" | "ESTIMATED_MODEL" | "SYNTHETIC_BENCHMARK";
  lastVerified?: string;
}

export interface IDataCompleteness {
  score: number; // 0 - 100
  percentage: number;
  availableInputs: string[];
  missingInputs: string[];
}

export interface IMaterialConfidence {
  score: number; // 0 - 1
  level: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  factors: {
    componentDetectionConfidence: number;
    compositionSourceQuality: number;
    massConfidence: number;
    metadataCompleteness: number;
  };
}

export interface ComponentMaterialInput {
  componentId: string;
  componentType: string;
  packageType?: string;
  manufacturer?: string;
  partNumber?: string;
  quantity?: number;
  estimatedMassGrams?: number;
  detectionConfidence?: number;
  materialEvidence?: MaterialEvidence[];
}

export interface PCBMaterialInput {
  boardType?: string;
  boardAreaCm2?: number;
  layerCount?: number;
  traceAreaPercent?: number;
  substrateType?: string;
  surfaceFinish?: "ENIG" | "HASL" | "OSP" | "IMMERSION_SILVER" | "IMMERSION_TIN" | "UNKNOWN";
  copperWeightOz?: number;
}

export interface BOMInput {
  bomAvailable: boolean;
  items?: Array<{
    partNumber: string;
    description: string;
    quantity: number;
    manufacturer?: string;
  }>;
}

export interface MaterialRecoveryInput {
  analysisId: string;
  sampleId?: string;
  boardType?: string;
  boardAreaCm2?: number;
  boardMassGrams?: number;
  estimatedBoardMassGrams?: number;
  componentCount?: number;
  components?: ComponentMaterialInput[];
  pcbAnalysis?: PCBMaterialInput;
  bom?: BOMInput;
  manufacturer?: string;
  partNumber?: string;
  additionalMetadata?: Record<string, unknown>;
}

export interface ModelInfo {
  provider: string;
  modelVersion: string;
  databaseVersion: string;
  methodology: string;
  supportedMaterials: string[];
  supportedPreciousMetals: string[];
  scientificDisclaimer: string;
}
