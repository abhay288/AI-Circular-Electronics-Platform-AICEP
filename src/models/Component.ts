import mongoose, { Schema, Document, Model } from "mongoose";

export interface IComponentBbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IComponent extends Document {
  analysisId: string;
  detectionResultId?: string;
  serialNumber?: string;
  type: string;
  name: string;
  manufacturer: string;
  partNumber: string;
  package: string;
  confidence: number;
  boundingBox: IComponentBbox;
  bbox?: IComponentBbox;
  center?: { x: number; y: number };
  condition: "UNKNOWN" | "MINT" | "GOOD" | "FAIR" | "DEGRADED" | "FAILED";
  healthScore: number;
  healthStatus?: string;
  failureRisk?: string;
  estimatedRUL: {
    hours: number;
    years: number;
  };
  materialProfile?: {
    goldGrams?: number;
    copperGrams?: number;
    silverGrams?: number;
    palladiumGrams?: number;
  };
  marketplaceEligible: boolean;
  passportId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ComponentSchema = new Schema<IComponent>(
  {
    analysisId: { type: String, required: true, index: true },
    detectionResultId: { type: String, index: true },
    serialNumber: { type: String, sparse: true, index: true },
    type: { type: String, required: true, index: true },
    name: { type: String, required: true },
    manufacturer: { type: String, default: "Generic" },
    partNumber: { type: String, default: "N/A", index: true },
    package: { type: String, default: "SMD" },
    confidence: { type: Number, default: 0.95 },
    boundingBox: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true },
    },
    bbox: {
      x: { type: Number },
      y: { type: Number },
      width: { type: Number },
      height: { type: Number },
    },
    center: {
      x: { type: Number },
      y: { type: Number },
    },
    condition: {
      type: String,
      enum: ["UNKNOWN", "MINT", "GOOD", "FAIR", "DEGRADED", "FAILED"],
      default: "UNKNOWN",
    },
    healthScore: { type: Number, default: 0 },
    healthStatus: { type: String },
    failureRisk: { type: String },
    estimatedRUL: {
      hours: { type: Number, default: 0 },
      years: { type: Number, default: 0 },
    },
    materialProfile: { type: Schema.Types.Mixed },
    marketplaceEligible: { type: Boolean, default: false, index: true },
    passportId: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

ComponentSchema.index({ analysisId: 1, marketplaceEligible: 1 });
ComponentSchema.index({ analysisId: 1, type: 1 });
ComponentSchema.index({ analysisId: 1, confidence: -1 });

export const Component: Model<IComponent> =
  mongoose.models.Component ||
  mongoose.model<IComponent>("Component", ComponentSchema);

export default Component;
