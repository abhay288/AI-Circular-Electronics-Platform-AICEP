import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrganization extends Document {
  name: string;
  legalName?: string;
  industry?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  website?: string;
  logo?: string;
  plan: "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
  settings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    legalName: { type: String, trim: true },
    industry: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String },
    country: { type: String, default: "IN" },
    website: { type: String },
    logo: { type: String },
    plan: {
      type: String,
      enum: ["STARTER", "PROFESSIONAL", "ENTERPRISE"],
      default: "PROFESSIONAL",
    },
    settings: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Organization: Model<IOrganization> =
  mongoose.models.Organization ||
  mongoose.model<IOrganization>("Organization", OrganizationSchema);

export default Organization;
