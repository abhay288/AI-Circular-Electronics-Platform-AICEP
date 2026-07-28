import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRepairReport extends Document {
  reportId: string;
  pcbAnalysisId: mongoose.Types.ObjectId;
  recommendedAction: "reflow" | "reballing" | "component_swap" | "full_recycle";
  estimatedRepairCostUSD: number;
  estimatedCO2SavingsKg: number;
  feasibilityIndexPercent: number;
  diagnosticNotes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RepairReportSchema: Schema<IRepairReport> = new Schema(
  {
    reportId: { type: String, required: true, unique: true, index: true },
    pcbAnalysisId: { type: Schema.Types.ObjectId, ref: "PcbAnalysis", required: true },
    recommendedAction: {
      type: String,
      enum: ["reflow", "reballing", "component_swap", "full_recycle"],
      required: true,
    },
    estimatedRepairCostUSD: { type: Number, required: true },
    estimatedCO2SavingsKg: { type: Number, required: true },
    feasibilityIndexPercent: { type: Number, required: true },
    diagnosticNotes: [{ type: String }],
  },
  { timestamps: true }
);

export const RepairReport: Model<IRepairReport> =
  mongoose.models.RepairReport ||
  mongoose.model<IRepairReport>("RepairReport", RepairReportSchema);
