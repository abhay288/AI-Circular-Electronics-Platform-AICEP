import mongoose, { Schema, Document, Model } from "mongoose";
import { ReportReason } from "@/lib/marketplace/marketplaceTaxonomy";

export interface IMarketplaceReport extends Document {
  reportId: string;
  listingId: string;
  reporterUserId: string;
  reporterOrganizationId?: string;
  reason: ReportReason;
  details: string;
  description?: string;
  evidenceUrls?: string[];
  status: "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED";
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MarketplaceReportSchema = new Schema<IMarketplaceReport>(
  {
    reportId: { type: String, required: true, unique: true, index: true },
    listingId: { type: String, required: true, index: true },
    reporterUserId: { type: String, required: true, index: true },
    reporterOrganizationId: { type: String },
    reason: {
      type: String,
      enum: [
        "INCORRECT_INFORMATION",
        "COUNTERFEIT",
        "DAMAGED",
        "MISREPRESENTED_CONDITION",
        "UNAUTHORIZED_LISTING",
        "SAFETY_CONCERN",
        "OTHER",
      ],
      required: true,
    },
    details: {
      type: String,
      default: function () {
        return (this as any).description || "No details provided";
      },
    },
    description: { type: String },
    evidenceUrls: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"],
      default: "PENDING",
      index: true,
    },
    adminNotes: { type: String },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const MarketplaceReport: Model<IMarketplaceReport> =
  mongoose.models.MarketplaceReport ||
  mongoose.model<IMarketplaceReport>("MarketplaceReport", MarketplaceReportSchema);

export default MarketplaceReport;
