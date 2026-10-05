import mongoose, { Schema, Document, Model } from "mongoose";

export interface IComponent extends Document {
  analysisId: string;
  type: string;
  name: string;
  manufacturer: string;
  partNumber: string;
  package: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  healthScore: number;
  condition: "MINT" | "GOOD" | "FAIR" | "DEGRADED" | "FAILED";
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
    type: { type: String, required: true, index: true },
    name: { type: String, required: true },
    manufacturer: { type: String, default: "Generic" },
    partNumber: { type: String, default: "N/A", index: true },
    package: { type: String, default: "SMD" },
    boundingBox: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true },
    },
    confidence: { type: Number, default: 0.95 },
    healthScore: { type: Number, default: 90 },
    condition: {
      type: String,
      enum: ["MINT", "GOOD", "FAIR", "DEGRADED", "FAILED"],
      default: "GOOD",
    },
    estimatedRUL: {
      hours: { type: Number, default: 45000 },
      years: { type: Number, default: 5.2 },
    },
    materialProfile: { type: Schema.Types.Mixed },
    marketplaceEligible: { type: Boolean, default: false, index: true },
    passportId: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

ComponentSchema.index({ analysisId: 1, marketplaceEligible: 1 });

export const Component: Model<IComponent> =
  mongoose.models.Component ||
  mongoose.model<IComponent>("Component", ComponentSchema);

export default Component;
