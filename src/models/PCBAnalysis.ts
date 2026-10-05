import mongoose, { Schema, Model } from "mongoose";

export interface IPCBAnalysis {
  analysisId: string;
  boardType: string;
  layerCount: number;
  boardDimensions: {
    widthMm: number;
    heightMm: number;
    areaCm2: number;
  };
  componentCount: number;
  traceCount: number;
  traceContinuity: number;
  boardIntegrity: number;
  damagedRegions: Array<{
    region: string;
    severity: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  reconstructedRegions: Array<{
    region: string;
    repairedTraces: number;
    confidence: number;
  }>;
  topology: {
    nodesCount: number;
    edgesCount: number;
    netlistPreview?: string;
  };
  confidence: number;
  status: "RECONSTRUCTED" | "PARTIAL" | "FAILED";
  model: string;
  version: string;
  provider: "MOCK" | "OPENCV" | "GGNT";
  createdAt?: Date;
  updatedAt?: Date;
}

const PCBAnalysisSchema = new Schema<IPCBAnalysis>(
  {
    analysisId: { type: String, required: true, unique: true, index: true },
    boardType: { type: String, default: "Multi-layer FR-4 High-Density" },
    layerCount: { type: Number, default: 4 },
    boardDimensions: {
      widthMm: { type: Number, default: 120 },
      heightMm: { type: Number, default: 85 },
      areaCm2: { type: Number, default: 102 },
    },
    componentCount: { type: Number, default: 24 },
    traceCount: { type: Number, default: 184 },
    traceContinuity: { type: Number, default: 94.5 },
    boardIntegrity: { type: Number, default: 92.0 },
    damagedRegions: { type: Schema.Types.Mixed, default: [] },
    reconstructedRegions: { type: Schema.Types.Mixed, default: [] },
    topology: { type: Schema.Types.Mixed, default: { nodesCount: 42, edgesCount: 68 } },
    confidence: { type: Number, default: 0.94 },
    status: {
      type: String,
      enum: ["RECONSTRUCTED", "PARTIAL", "FAILED"],
      default: "RECONSTRUCTED",
    },
    model: { type: String, default: "NeuroPCB-Reconstruct" },
    version: { type: String, default: "1.8.2" },
    provider: {
      type: String,
      enum: ["MOCK", "OPENCV", "GGNT"],
      default: "MOCK",
    },
  },
  { timestamps: true }
);

export const PCBAnalysis: Model<IPCBAnalysis> =
  mongoose.models.PCBAnalysis ||
  mongoose.model<IPCBAnalysis>("PCBAnalysis", PCBAnalysisSchema);

export default PCBAnalysis;
