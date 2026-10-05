import mongoose, { Schema, Model } from "mongoose";

export interface IDetectionBbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IDetectionItem {
  classId: number;
  className: string;
  confidence: number;
  bbox: IDetectionBbox;
  normalizedBbox: IDetectionBbox;
}

export interface IImageQuality {
  quality: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
  score: number;
  warnings: string[];
}

export interface IDetectionResult {
  analysisId: string;
  assetId?: string;
  modelName: string;
  modelVersion: string;
  datasetVersion?: string;
  imageWidth: number;
  imageHeight: number;
  totalDetected: number;
  detections: IDetectionItem[];
  components: Array<any>;
  confidenceAverage: number;
  confidenceAvg?: number; // legacy alias
  processingTimeMs: number;
  quality: IImageQuality;
  warnings: string[];
  provider: "MOCK" | "YOLO" | "RT-DETR";
  status: "DEMO" | "PROD";
  createdAt?: Date;
  updatedAt?: Date;
}

const DetectionResultSchema = new Schema<IDetectionResult>(
  {
    analysisId: { type: String, required: true, unique: true, index: true },
    assetId: { type: String, index: true },
    modelName: { type: String, default: "EcoIntel-PCB-YOLO" },
    modelVersion: { type: String, default: "v0.1.0" },
    datasetVersion: { type: String, default: "pcb-components-v1" },
    imageWidth: { type: Number, default: 1920 },
    imageHeight: { type: Number, default: 1080 },
    totalDetected: { type: Number, default: 0 },
    detections: { type: Schema.Types.Mixed, default: [] },
    components: { type: Schema.Types.Mixed, default: [] },
    confidenceAverage: { type: Number, default: 0 },
    confidenceAvg: { type: Number, default: 0 },
    processingTimeMs: { type: Number, default: 0 },
    quality: {
      quality: { type: String, default: "GOOD" },
      score: { type: Number, default: 0.9 },
      warnings: { type: [String], default: [] },
    },
    warnings: { type: [String], default: [] },
    provider: {
      type: String,
      enum: ["MOCK", "YOLO", "RT-DETR"],
      default: "MOCK",
    },
    status: {
      type: String,
      enum: ["DEMO", "PROD"],
      default: "DEMO",
    },
  },
  { timestamps: true }
);

export const DetectionResult: Model<IDetectionResult> =
  mongoose.models.DetectionResult ||
  mongoose.model<IDetectionResult>("DetectionResult", DetectionResultSchema);

export default DetectionResult;
