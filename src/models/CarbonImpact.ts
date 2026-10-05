import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICarbonImpact extends Document {
  analysisId: string;
  co2AvoidedKg: number;
  energySavedKWh: number;
  waterSavedLiters: number;
  ewasteDivertedKg: number;
  circularityScorePercent: number;
  methodology: string;
  confidence: number;
  calculationVersion: string;
  status: "ESTIMATED" | "CALCULATED" | "SIMULATED";
  createdAt: Date;
}

const CarbonImpactSchema = new Schema<ICarbonImpact>(
  {
    analysisId: { type: String, required: true, unique: true, index: true },
    co2AvoidedKg: { type: Number, default: 28.4 },
    energySavedKWh: { type: Number, default: 412 },
    waterSavedLiters: { type: Number, default: 1850 },
    ewasteDivertedKg: { type: Number, default: 0.28 },
    circularityScorePercent: { type: Number, default: 94.2 },
    methodology: {
      type: String,
      default: "ISO 14040/14044 Life-Cycle Inventory (LCI) Circular E-Waste Avoidance Model v2.1",
    },
    confidence: { type: Number, default: 0.94 },
    calculationVersion: { type: String, default: "2.1.0" },
    status: {
      type: String,
      enum: ["ESTIMATED", "CALCULATED", "SIMULATED"],
      default: "ESTIMATED",
    },
  },
  { timestamps: true }
);

export const CarbonImpact: Model<ICarbonImpact> =
  mongoose.models.CarbonImpact ||
  mongoose.model<ICarbonImpact>("CarbonImpact", CarbonImpactSchema);

export default CarbonImpact;
