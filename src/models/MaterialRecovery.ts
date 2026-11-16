import mongoose, { Schema, Model, Document } from "mongoose";
import {
  MaterialCategory,
  EvidenceLevel,
  SourceType,
  RecoveryPriority,
  IMaterialSummaryItem,
  IPreciousMetalItem,
  IComponentMaterialContribution,
  IRecoveryScenarios,
  IMaterialSourceRecord,
  IDataCompleteness,
  IMaterialConfidence,
  IMassBasis,
} from "@/lib/materials/materialTaxonomy";

// Re-export core types for downstream consumers
export type {
  MaterialCategory,
  EvidenceLevel,
  SourceType,
  RecoveryPriority,
  IMaterialSummaryItem,
  IPreciousMetalItem,
  IComponentMaterialContribution,
  IRecoveryScenarios,
  IMaterialSourceRecord,
  IDataCompleteness,
  IMaterialConfidence,
  IMassBasis,
};

// Legacy interface support for backward compatibility
export interface IMaterialItem {
  material: string;
  symbol: string;
  atomicNum: number;
  estimatedQuantity: number;
  unit: "g" | "kg" | "mg";
  marketRateINR: number;
  marketRateUnit: string;
  estimatedValueINR: number;
  confidence: number;
  method: "ESTIMATION" | "SPECTROMETRY";
  source: "DEMO" | "MEASURED" | "DATABASE_DERIVED";
}

export interface IMaterialRecovery extends Document {
  analysisId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "INSUFFICIENT_DATA";

  // Mass Basis Information
  boardMass: IMassBasis;

  // Material Categories & Granular Summaries
  materialSummary: IMaterialSummaryItem[];
  preciousMetals: IPreciousMetalItem[];
  baseMetals: IMaterialSummaryItem[];
  criticalMaterials: IMaterialSummaryItem[];

  // Totals
  totalEstimatedMaterialMassGrams: number;
  totalRecoverableMaterialMassGrams: number;

  // Multi-scenario recovery model (Conservative, Typical, Optimistic)
  recoveryScenarios: IRecoveryScenarios;

  // Component contributions for Circular Prioritization
  componentContributions: IComponentMaterialContribution[];

  // Provenance, Confidence & Data Completeness
  confidence: IMaterialConfidence;
  dataCompleteness: IDataCompleteness;
  materialSources: IMaterialSourceRecord[];
  limitations: string[];

  // Provider & Audit Metadata
  provider: string;
  modelVersion: string;
  databaseVersion: string;

  // Legacy compatibility fields
  pcbWeightKg: number;
  recoveryEfficiencyPercent: number;
  totalEstimatedMarketValueINR: number;
  totalEstimatedMarketValueUSD: number;
  materials: IMaterialItem[];
  method: "ESTIMATION" | "SPECTROMETRY";
  source: "DEMO" | "MEASURED" | "DATABASE_DERIVED";

  createdAt?: Date;
  updatedAt?: Date;
}

const MaterialRecoverySchema = new Schema<IMaterialRecovery>(
  {
    analysisId: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "INSUFFICIENT_DATA"],
      default: "COMPLETED",
      index: true,
    },

    boardMass: {
      massValue: { type: Number, default: 0 },
      massUnit: { type: String, default: "g" },
      massSource: {
        type: String,
        enum: ["MEASURED", "KNOWN", "DATASHEET", "DATABASE", "ESTIMATED"],
        default: "ESTIMATED",
      },
      massConfidence: { type: Number, default: 0.8 },
      estimatedBoardMassGrams: { type: Number, default: 0 },
      boardAreaCm2: { type: Number },
      calculationMethod: { type: String, default: "SUBSTRATE_COMPONENT_AGGREGATION" },
    },

    materialSummary: { type: Schema.Types.Mixed, default: [] },
    preciousMetals: { type: Schema.Types.Mixed, default: [] },
    baseMetals: { type: Schema.Types.Mixed, default: [] },
    criticalMaterials: { type: Schema.Types.Mixed, default: [] },

    totalEstimatedMaterialMassGrams: { type: Number, default: 0 },
    totalRecoverableMaterialMassGrams: { type: Number, default: 0 },

    recoveryScenarios: { type: Schema.Types.Mixed, default: null },
    componentContributions: { type: Schema.Types.Mixed, default: [] },

    confidence: {
      score: { type: Number, default: 0.8 },
      level: {
        type: String,
        enum: ["HIGH", "MEDIUM", "LOW", "UNKNOWN"],
        default: "MEDIUM",
      },
      factors: {
        componentDetectionConfidence: { type: Number, default: 0.8 },
        compositionSourceQuality: { type: Number, default: 0.85 },
        massConfidence: { type: Number, default: 0.75 },
        metadataCompleteness: { type: Number, default: 0.65 },
      },
    },

    dataCompleteness: {
      score: { type: Number, default: 65 },
      percentage: { type: Number, default: 65 },
      availableInputs: { type: [String], default: [] },
      missingInputs: { type: [String], default: [] },
    },

    materialSources: { type: Schema.Types.Mixed, default: [] },
    limitations: { type: [String], default: [] },

    provider: { type: String, default: "mock" },
    modelVersion: { type: String, default: "1.0.0" },
    databaseVersion: { type: String, default: "mat-comp-v1.0" },

    // Legacy compatibility fields
    pcbWeightKg: { type: Number, default: 0.28 },
    recoveryEfficiencyPercent: { type: Number, default: 85.0 },
    totalEstimatedMarketValueINR: { type: Number, default: 0 },
    totalEstimatedMarketValueUSD: { type: Number, default: 0 },
    materials: { type: Schema.Types.Mixed, default: [] },
    method: {
      type: String,
      enum: ["ESTIMATION", "SPECTROMETRY"],
      default: "ESTIMATION",
    },
    source: {
      type: String,
      enum: ["DEMO", "MEASURED", "DATABASE_DERIVED"],
      default: "DEMO",
    },
  },
  { timestamps: true }
);

// Performance indexes
MaterialRecoverySchema.index({ createdAt: -1 });

export const MaterialRecovery: Model<IMaterialRecovery> =
  mongoose.models.MaterialRecovery ||
  mongoose.model<IMaterialRecovery>("MaterialRecovery", MaterialRecoverySchema);

export default MaterialRecovery;
