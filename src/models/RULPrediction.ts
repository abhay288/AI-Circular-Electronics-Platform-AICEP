import mongoose, { Schema, Model } from "mongoose";

export interface IHealthFactor {
  factor: string;
  impact: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidence: string;
}

export interface IFailureMode {
  name: string;
  risk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  evidence: string[];
  confidence: number;
}

export interface IComponentRUL {
  componentId: string;
  componentType: string;
  healthScore: number;
  healthStatus: "HEALTHY" | "GOOD" | "FAIR" | "DEGRADED" | "CRITICAL" | "UNKNOWN";
  estimatedRULHours: number;
  estimatedRULYears: number;
  riskLevel: string;
  confidence: number;
  primaryContributingFactor: string;
}

export interface IRULPrediction {
  analysisId: string;
  componentId?: string;

  modelProvider: "MOCK" | "XGBOOST" | "LSTM" | "PHYSICS_ML";
  modelName: string;
  modelVersion: string;
  datasetVersion: string;
  featureVersion: string;

  // Health Assessment
  healthScore: number;
  healthStatus: "HEALTHY" | "GOOD" | "FAIR" | "DEGRADED" | "CRITICAL" | "UNKNOWN";
  healthConfidence: number;
  healthFactors: IHealthFactor[];

  // RUL Metrics & Uncertainty
  rulHours: number;
  rulDays: number;
  rulMonths: number;
  rulYears: number;
  rulCycles: number;

  predictionInterval: {
    lowerBoundHours: number;
    upperBoundHours: number;
    lowerBoundYears: number;
    upperBoundYears: number;
    confidenceIntervalPercent: number;
  };

  confidence: number;
  uncertaintyHours: number;
  failureRisk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "UNKNOWN";
  riskLevel: string;

  contributingFactors: string[];
  failureModes: IFailureMode[];
  components: IComponentRUL[];

  inputFeatures: Record<string, any>;
  dataCompleteness: number; // 0-100%
  missingFeatures: string[];
  limitations: string[];
  provenance: "PREDICTED" | "ESTIMATED" | "SIMULATED" | "MEASURED";
  status: "COMPLETED" | "PARTIAL" | "INSUFFICIENT_DATA" | "FAILED";

  // Legacy field aliases for UI backwards compatibility
  estimatedHours?: number;
  estimatedYears?: number;
  temperature?: number;
  voltage?: number;
  operationalCycles?: number;
  age?: number;
  wear?: number;
  corrosion?: number;
  model?: string;
  version?: string;
  provider?: string;
  predictionRange?: {
    minYears: number;
    maxYears: number;
    confidenceIntervalPercent: number;
  };

  createdAt?: Date;
  updatedAt?: Date;
  uncertainty?: number;
  isSynthetic?: boolean;
}

const RULPredictionSchema = new Schema<IRULPrediction>(
  {
    analysisId: { type: String, required: true, index: true },
    componentId: { type: String, index: true },

    modelProvider: {
      type: String,
      enum: ["MOCK", "XGBOOST", "LSTM", "PHYSICS_ML"],
      default: "MOCK",
      index: true,
    },
    modelName: { type: String, default: "EcoIntel-Degradation-XGBoost" },
    modelVersion: { type: String, default: "v1.2.0" },
    datasetVersion: { type: String, default: "synthetic-reliability-v1" },
    featureVersion: { type: String, default: "rul-features-v1" },

    healthScore: { type: Number, default: 85 },
    healthStatus: {
      type: String,
      enum: ["HEALTHY", "GOOD", "FAIR", "DEGRADED", "CRITICAL", "UNKNOWN"],
      default: "GOOD",
    },
    healthConfidence: { type: Number, default: 0.88 },
    healthFactors: { type: Schema.Types.Mixed, default: [] },

    rulHours: { type: Number, default: 42000 },
    rulDays: { type: Number, default: 1750 },
    rulMonths: { type: Number, default: 57.5 },
    rulYears: { type: Number, default: 4.8 },
    rulCycles: { type: Number, default: 1800 },

    predictionInterval: {
      type: Schema.Types.Mixed,
      default: {
        lowerBoundHours: 35000,
        upperBoundHours: 49000,
        lowerBoundYears: 4.0,
        upperBoundYears: 5.6,
        confidenceIntervalPercent: 90,
      },
    },

    confidence: { type: Number, default: 0.88 },
    uncertaintyHours: { type: Number, default: 7000 },
    failureRisk: {
      type: String,
      enum: ["LOW", "MODERATE", "HIGH", "CRITICAL", "UNKNOWN"],
      default: "LOW",
    },
    riskLevel: { type: String, default: "LOW" },

    contributingFactors: { type: [String], default: [] },
    failureModes: { type: Schema.Types.Mixed, default: [] },
    components: { type: Schema.Types.Mixed, default: [] },

    inputFeatures: { type: Schema.Types.Mixed, default: {} },
    dataCompleteness: { type: Number, default: 80 },
    missingFeatures: { type: [String], default: [] },
    limitations: {
      type: [String],
      default: [
        "Visual PCB surface condition alone does not reveal internal silicon junction dielectric breakdown.",
        "Predictions use Arrhenius thermal acceleration (Ea = 0.7 eV) and IPC-9701 solder fatigue heuristics.",
        "Field reliability requires four-wire Kelvin electrical continuity and operational logging telemetry.",
      ],
    },
    provenance: {
      type: String,
      enum: ["PREDICTED", "ESTIMATED", "SIMULATED", "MEASURED"],
      default: "PREDICTED",
    },
    status: {
      type: String,
      enum: ["COMPLETED", "PARTIAL", "INSUFFICIENT_DATA", "FAILED"],
      default: "COMPLETED",
      index: true,
    },

    // Legacy fields
    estimatedHours: { type: Number, default: 42000 },
    estimatedYears: { type: Number, default: 4.8 },
    temperature: { type: Number, default: 42.5 },
    voltage: { type: Number, default: 3.3 },
    operationalCycles: { type: Number, default: 1420 },
    age: { type: Number, default: 2.5 },
    wear: { type: Number, default: 12.0 },
    corrosion: { type: Number, default: 4.5 },
    model: { type: String, default: "Arrhenius-Degradation-XGB" },
    version: { type: String, default: "v1.2.0" },
    provider: { type: String, default: "MOCK" },
    predictionRange: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

RULPredictionSchema.index({ analysisId: 1, status: 1 });
RULPredictionSchema.index({ analysisId: 1, componentId: 1 });
RULPredictionSchema.index({ createdAt: -1 });

export const RULPrediction: Model<IRULPrediction> =
  mongoose.models.RULPrediction ||
  mongoose.model<IRULPrediction>("RULPrediction", RULPredictionSchema);

export default RULPrediction;
