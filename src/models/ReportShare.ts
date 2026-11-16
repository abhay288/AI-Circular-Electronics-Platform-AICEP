import mongoose, { Schema, Document, Model } from "mongoose";

export type ReportSharePermission = "VIEW" | "DOWNLOAD";
export type ReportShareStatus = "ACTIVE" | "REVOKED" | "EXPIRED";

export interface IReportShare extends Document {
  shareId: string;
  reportId: string;
  shareToken: string;
  createdBy: string;
  organizationId: string;
  expiresAt: Date;
  permissions: ReportSharePermission[];
  status: ReportShareStatus;
  accessCount: number;
  lastAccessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportShareSchema = new Schema<IReportShare>(
  {
    shareId: { type: String, required: true, unique: true, index: true },
    reportId: { type: String, required: true, index: true },
    shareToken: { type: String, required: true, unique: true, index: true },
    createdBy: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    permissions: {
      type: [String],
      enum: ["VIEW", "DOWNLOAD"],
      default: ["VIEW"],
    },
    status: {
      type: String,
      enum: ["ACTIVE", "REVOKED", "EXPIRED"],
      default: "ACTIVE",
      index: true,
    },
    accessCount: { type: Number, default: 0 },
    lastAccessedAt: { type: Date },
  },
  { timestamps: true }
);

ReportShareSchema.index({ reportId: 1, status: 1 });

export const ReportShare: Model<IReportShare> =
  mongoose.models.ReportShare || mongoose.model<IReportShare>("ReportShare", ReportShareSchema);

export default ReportShare;
