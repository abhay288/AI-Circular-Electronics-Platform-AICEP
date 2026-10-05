import mongoose, { Schema, Model } from "mongoose";

export interface IDetectionResult {
  analysisId: string;
  components: Array<{
    componentId: string;
    type: string;
    name: string;
    manufacturer: string;
    partNumber: string;
    package: string;
    boundingBox: { x: number; y: number; width: number; height: number };
    confidence: number;
    condition: string;
    healthScore: number;
    marketplaceEligible: boolean;
  }>;
  totalDetected: number;
  confidenceAvg: number;
  processingTimeMs: number;
  model: string;
  version: string;
  provider: "MOCK" | "YOLO" | "RT-DETR";
  status: "DEMO" | "PROD";
  createdAt?: Date;
  updatedAt?: Date;
}

const DetectionResultSchema = new Schema<IDetectionResult>(
  {
    analysisId: { type: String, required: true, unique: true, index: true },
    components: { type: Schema.Types.Mixed, default: [] },
    totalDetected: { type: Number, default: 0 },
    confidenceAvg: { type: Number, default: 0 },
    processingTimeMs: { type: Number, default: 0 },
    model: { type: String, default: "YOLOv11-Circular-Ewaste" },
    version: { type: String, default: "2.4.0" },
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
