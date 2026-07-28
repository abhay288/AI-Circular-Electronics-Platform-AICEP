import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPcbAnalysis extends Document {
  scanId: string;
  boardModel: string;
  originalImageUrl: string;
  reconstructedTopologyUrl?: string;
  damageSeverity: "minor" | "moderate" | "severe" | "catastrophic";
  detectedComponentsCount: number;
  copperTraceIntegrityPercent: number;
  repairabilityScore: number; // 0 - 100
  aiModelVersion: string;
  analyzedByUserId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PcbAnalysisSchema: Schema<IPcbAnalysis> = new Schema(
  {
    scanId: { type: String, required: true, unique: true, index: true },
    boardModel: { type: String, required: true },
    originalImageUrl: { type: String, required: true },
    reconstructedTopologyUrl: { type: String },
    damageSeverity: {
      type: String,
      enum: ["minor", "moderate", "severe", "catastrophic"],
      default: "moderate",
    },
    detectedComponentsCount: { type: Number, default: 0 },
    copperTraceIntegrityPercent: { type: Number, default: 0 },
    repairabilityScore: { type: Number, default: 0 },
    aiModelVersion: { type: String, default: "YOLOv8-EcoPCB-v2.4" },
    analyzedByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const PcbAnalysis: Model<IPcbAnalysis> =
  mongoose.models.PcbAnalysis || mongoose.model<IPcbAnalysis>("PcbAnalysis", PcbAnalysisSchema);
