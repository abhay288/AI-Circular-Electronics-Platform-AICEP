import mongoose, { Schema, Model } from "mongoose";

export interface IRepairIssue {
  componentId?: string;
  componentName: string;
  issue: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  recommendation: string;
  reason: string;
  suggestedAction: string;
}

export interface IRepairAssessment {
  analysisId: string;
  recommendedAction: "REUSE" | "REPAIR" | "REFURBISH" | "RECOVER" | "RECYCLE";
  primaryFault: string;
  estimatedRepairCostINR: number;
  estimatedRepairCostUSD: number;
  estimatedCO2SavingsKg: number;
  feasibilityIndexPercent: number;
  confidence: number;
  issues: IRepairIssue[];
  provider: "MOCK" | "AI_REPAIR";
  createdAt?: Date;
  updatedAt?: Date;
}

const RepairAssessmentSchema = new Schema<IRepairAssessment>(
  {
    analysisId: { type: String, required: true, unique: true, index: true },
    recommendedAction: {
      type: String,
      enum: ["REUSE", "REPAIR", "REFURBISH", "RECOVER", "RECYCLE"],
      default: "REFURBISH",
    },
    primaryFault: { type: String, default: "Thermal stress detected on power regulation circuit" },
    estimatedRepairCostINR: { type: Number, default: 1250 },
    estimatedRepairCostUSD: { type: Number, default: 14.5 },
    estimatedCO2SavingsKg: { type: Number, default: 28.4 },
    feasibilityIndexPercent: { type: Number, default: 92 },
    confidence: { type: Number, default: 0.94 },
    issues: { type: Schema.Types.Mixed, default: [] },
    provider: {
      type: String,
      enum: ["MOCK", "AI_REPAIR"],
      default: "MOCK",
    },
  },
  { timestamps: true }
);

export const RepairAssessment: Model<IRepairAssessment> =
  mongoose.models.RepairAssessment ||
  mongoose.model<IRepairAssessment>("RepairAssessment", RepairAssessmentSchema);

export default RepairAssessment;
