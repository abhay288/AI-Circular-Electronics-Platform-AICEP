import mongoose, { Schema, Model } from "mongoose";

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
  source: "DEMO" | "MEASURED";
}

export interface IMaterialRecovery {
  analysisId: string;
  pcbWeightKg: number;
  recoveryEfficiencyPercent: number;
  totalEstimatedMarketValueINR: number;
  totalEstimatedMarketValueUSD: number;
  materials: IMaterialItem[];
  method: "ESTIMATION" | "SPECTROMETRY";
  source: "DEMO" | "MEASURED";
  createdAt?: Date;
  updatedAt?: Date;
}

const MaterialRecoverySchema = new Schema<IMaterialRecovery>(
  {
    analysisId: { type: String, required: true, unique: true, index: true },
    pcbWeightKg: { type: Number, default: 0.28 },
    recoveryEfficiencyPercent: { type: Number, default: 98.4 },
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
      enum: ["DEMO", "MEASURED"],
      default: "DEMO",
    },
  },
  { timestamps: true }
);

export const MaterialRecovery: Model<IMaterialRecovery> =
  mongoose.models.MaterialRecovery ||
  mongoose.model<IMaterialRecovery>("MaterialRecovery", MaterialRecoverySchema);

export default MaterialRecovery;
