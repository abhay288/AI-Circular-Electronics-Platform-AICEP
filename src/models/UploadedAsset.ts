import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUploadedAsset extends Document {
  analysisId: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  storageUrl: string;
  publicId?: string;
  dimensions?: { width: number; height: number };
  qualityMetrics?: {
    quality: "GOOD" | "ACCEPTABLE" | "POOR";
    resolution: "HIGH" | "MEDIUM" | "LOW";
    pcbVisibility: number;
    brightness: number;
    contrast: number;
    blurScore: number;
    warnings: string[];
    recommendation?: string;
  };
  uploadedAt: Date;
}

const UploadedAssetSchema = new Schema<IUploadedAsset>(
  {
    analysisId: { type: String, required: true, index: true },
    originalFileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    storageUrl: { type: String, required: true },
    publicId: { type: String },
    dimensions: {
      width: { type: Number },
      height: { type: Number },
    },
    qualityMetrics: { type: Schema.Types.Mixed },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const UploadedAsset: Model<IUploadedAsset> =
  mongoose.models.UploadedAsset ||
  mongoose.model<IUploadedAsset>("UploadedAsset", UploadedAssetSchema);

export default UploadedAsset;
