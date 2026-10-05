import mongoose, { Schema, Model } from "mongoose";

export interface IRULPrediction {
  analysisId: string;
  healthScore: number;
  estimatedHours: number;
  estimatedYears: number;
  confidence: number;
  temperature: number;
  voltage: number;
  operationalCycles: number;
  age: number;
  wear: number;
  corrosion: number;
  model: string;
  version: string;
  predictionRange: {
    minYears: number;
    maxYears: number;
    confidenceIntervalPercent: number;
  };
  provider: "MOCK" | "XGBOOST" | "LSTM" | "PHYSICS_ML";
  createdAt?: Date;
  updatedAt?: Date;
}

const RULPredictionSchema = new Schema<IRULPrediction>(
  {
    analysisId: { type: String, required: true, unique: true, index: true },
    healthScore: { type: Number, default: 88 },
    estimatedHours: { type: Number, default: 42000 },
    estimatedYears: { type: Number, default: 4.8 },
    confidence: { type: Number, default: 0.93 },
    temperature: { type: Number, default: 42.5 },
    voltage: { type: Number, default: 3.3 },
    operationalCycles: { type: Number, default: 1420 },
    age: { type: Number, default: 2.5 },
    wear: { type: Number, default: 12.0 },
    corrosion: { type: Number, default: 4.5 },
    model: { type: String, default: "Arrhenius-Degradation-XGB" },
    version: { type: String, default: "3.1.0" },
    predictionRange: {
      type: Schema.Types.Mixed,
      default: { minYears: 4.2, maxYears: 5.6, confidenceIntervalPercent: 95 },
    },
    provider: {
      type: String,
      enum: ["MOCK", "XGBOOST", "LSTM", "PHYSICS_ML"],
      default: "MOCK",
    },
  },
  { timestamps: true }
);

export const RULPrediction: Model<IRULPrediction> =
  mongoose.models.RULPrediction ||
  mongoose.model<IRULPrediction>("RULPrediction", RULPredictionSchema);

export default RULPrediction;
