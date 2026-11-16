import mongoose, { Schema, Document, Model } from "mongoose";
import { FactorSourceType } from "@/lib/carbon/carbonTaxonomy";

export interface IMaterialEmissionFactor extends Document {
  factorId: string;
  material: string;
  region: string;
  process: string;
  factor: number; // kgCO2e per unit
  unit: string;   // e.g., kgCO2e/kg
  source: string;
  sourceType: FactorSourceType;
  sourceReference?: string;
  methodology: string;
  version: string;
  status: "ACTIVE" | "INACTIVE" | "DRAFT";
  validFrom?: Date;
  validTo?: Date;
  confidence: number;
  organizationId?: string; // Optional organization-specific override
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MaterialEmissionFactorSchema = new Schema<IMaterialEmissionFactor>(
  {
    factorId: { type: String, required: true, unique: true, index: true },
    material: { type: String, required: true, index: true },
    region: { type: String, default: "GLOBAL", index: true },
    process: { type: String, required: true },
    factor: { type: Number, required: true },
    unit: { type: String, required: true, default: "kgCO2e/kg" },
    source: { type: String, required: true },
    sourceType: {
      type: String,
      enum: [
        "AUTHORITATIVE_DATABASE",
        "LITERATURE",
        "GOVERNMENT",
        "INDUSTRY_STANDARD",
        "ORGANIZATION_CONFIGURED",
        "INTERNAL_DATABASE",
        "USER_PROVIDED",
        "SYNTHETIC_DEMO",
      ],
      required: true,
      default: "LITERATURE",
    },
    sourceReference: { type: String },
    methodology: { type: String, required: true, default: "Material Displacement Method v1" },
    version: { type: String, required: true, default: "1.0" },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "DRAFT"],
      default: "ACTIVE",
      index: true,
    },
    validFrom: { type: Date },
    validTo: { type: Date },
    confidence: { type: Number, default: 0.85, min: 0, max: 1 },
    organizationId: { type: String, index: true },
    createdBy: { type: String },
  },
  { timestamps: true }
);

export const MaterialEmissionFactor: Model<IMaterialEmissionFactor> =
  mongoose.models.MaterialEmissionFactor ||
  mongoose.model<IMaterialEmissionFactor>(
    "MaterialEmissionFactor",
    MaterialEmissionFactorSchema
  );

export default MaterialEmissionFactor;
