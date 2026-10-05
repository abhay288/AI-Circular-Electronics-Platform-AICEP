import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReport extends Document {
  reportId: string;
  analysisId: string;
  status: "GENERATING" | "READY" | "FAILED";
  format: "PDF" | "JSON" | "CSV";
  fileUrl?: string;
  sections: string[];
  summary: Record<string, any>;
  version: string;
  generatedAt: Date;
  createdAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reportId: { type: String, required: true, unique: true, index: true },
    analysisId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["GENERATING", "READY", "FAILED"],
      default: "GENERATING",
    },
    format: {
      type: String,
      enum: ["PDF", "JSON", "CSV"],
      default: "PDF",
    },
    fileUrl: { type: String },
    sections: { type: [String], default: [] },
    summary: { type: Schema.Types.Mixed, default: {} },
    version: { type: String, default: "1.0.0" },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Report: Model<IReport> =
  mongoose.models.Report || mongoose.model<IReport>("Report", ReportSchema);

export default Report;
