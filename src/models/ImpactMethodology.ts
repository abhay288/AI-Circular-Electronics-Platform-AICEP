import mongoose, { Schema, Document, Model } from "mongoose";

export interface IImpactMethodology extends Document {
  methodologyId: string;
  name: string;
  version: string;
  description: string;
  scope: string;
  formula: string;
  assumptions: string[];
  sources: string[];
  status: "ACTIVE" | "DEPRECATED" | "DRAFT";
  createdAt: Date;
  updatedAt: Date;
}

const ImpactMethodologySchema = new Schema<IImpactMethodology>(
  {
    methodologyId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    version: { type: String, required: true, default: "1.0" },
    description: { type: String, required: true },
    scope: { type: String, required: true, default: "Scope 3 Category 1 & Category 12 Avoided Emissions" },
    formula: { type: String, required: true },
    assumptions: { type: [String], default: [] },
    sources: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["ACTIVE", "DEPRECATED", "DRAFT"],
      default: "ACTIVE",
      index: true,
    },
  },
  { timestamps: true }
);

export const ImpactMethodology: Model<IImpactMethodology> =
  mongoose.models.ImpactMethodology ||
  mongoose.model<IImpactMethodology>("ImpactMethodology", ImpactMethodologySchema);

export default ImpactMethodology;
