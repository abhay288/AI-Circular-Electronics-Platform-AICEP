import mongoose, { Schema, Document, Model } from "mongoose";

export type ReportType =
  | "ASSET"
  | "TECHNICAL"
  | "CIRCULARITY"
  | "ENVIRONMENTAL"
  | "EXECUTIVE"
  | "PASSPORT";

export type ReportStatus =
  | "DRAFT"
  | "GENERATING"
  | "READY"
  | "FAILED"
  | "ARCHIVED";

export type ReportFormat = "PDF" | "JSON" | "CSV";

export type ReportEvidenceLevel =
  | "MEASURED"
  | "KNOWN"
  | "VERIFIED"
  | "DATABASE-DERIVED"
  | "ESTIMATED"
  | "PREDICTED"
  | "INFERRED"
  | "SIMULATED"
  | "DEMO";

export type { ReportEvidenceLevel as EvidenceLevelReport };

export interface IReportSection {
  id: string;
  title: string;
  type: string;
  content: any;
  confidence?: number;
  evidenceLevel?: ReportEvidenceLevel;
  source?: string;
  limitations?: string[];
}

export interface IReportCompleteness {
  technicalPercent: number;
  healthPercent: number;
  materialsPercent: number;
  repairPercent: number;
  passportPercent: number;
  environmentalPercent: number;
  overallPercent: number;
  missingSections: string[];
}

export interface IReportBranding {
  logoUrl?: string;
  organizationName?: string;
  reportFooter?: string;
  confidentialityNotice?: string;
}

export interface IReport extends Document {
  reportId: string;
  analysisId?: string;
  organizationId: string;
  passportId?: string;
  reportType: ReportType;
  version: number;
  status: ReportStatus;
  title: string;
  summary: Record<string, any>;
  sections: IReportSection[];
  completeness: IReportCompleteness;
  methodology: string;
  dataSources: string[];
  assumptions: string[];
  limitations: string[];
  isDemo: boolean;
  branding?: IReportBranding;
  format: ReportFormat;
  fileUrl?: string;
  generatedBy: string;
  generatedAt: Date;
  updatedAt: Date;
  createdAt: Date;
}

const ReportSectionSchema = new Schema<IReportSection>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    type: { type: String, required: true },
    content: { type: Schema.Types.Mixed, default: {} },
    confidence: { type: Number, min: 0, max: 100 },
    evidenceLevel: {
      type: String,
      enum: [
        "MEASURED",
        "KNOWN",
        "VERIFIED",
        "DATABASE-DERIVED",
        "ESTIMATED",
        "PREDICTED",
        "INFERRED",
        "SIMULATED",
        "DEMO",
      ],
      default: "ESTIMATED",
    },
    source: { type: String },
    limitations: { type: [String], default: [] },
  },
  { _id: false }
);

const ReportCompletenessSchema = new Schema<IReportCompleteness>(
  {
    technicalPercent: { type: Number, default: 0 },
    healthPercent: { type: Number, default: 0 },
    materialsPercent: { type: Number, default: 0 },
    repairPercent: { type: Number, default: 0 },
    passportPercent: { type: Number, default: 0 },
    environmentalPercent: { type: Number, default: 0 },
    overallPercent: { type: Number, default: 0 },
    missingSections: { type: [String], default: [] },
  },
  { _id: false }
);

const ReportBrandingSchema = new Schema<IReportBranding>(
  {
    logoUrl: { type: String },
    organizationName: { type: String },
    reportFooter: { type: String },
    confidentialityNotice: { type: String },
  },
  { _id: false }
);

const ReportSchema = new Schema<IReport>(
  {
    reportId: { type: String, required: true, unique: true, index: true },
    analysisId: { type: String, index: true },
    organizationId: { type: String, required: true, index: true, default: "org-default" },
    passportId: { type: String, index: true },
    reportType: {
      type: String,
      enum: ["ASSET", "TECHNICAL", "CIRCULARITY", "ENVIRONMENTAL", "EXECUTIVE", "PASSPORT"],
      default: "ASSET",
      index: true,
    },
    version: { type: Number, required: true, default: 1 },
    status: {
      type: String,
      enum: ["DRAFT", "GENERATING", "READY", "FAILED", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },
    title: { type: String, required: true },
    summary: { type: Schema.Types.Mixed, default: {} },
    sections: { type: [ReportSectionSchema], default: [] },
    completeness: {
      type: ReportCompletenessSchema,
      default: () => ({
        technicalPercent: 0,
        healthPercent: 0,
        materialsPercent: 0,
        repairPercent: 0,
        passportPercent: 0,
        environmentalPercent: 0,
        overallPercent: 0,
        missingSections: [],
      }),
    },
    methodology: { type: String, default: "EcoIntel Circular Intelligence Multi-Stage Pipeline" },
    dataSources: { type: [String], default: [] },
    assumptions: { type: [String], default: [] },
    limitations: { type: [String], default: [] },
    isDemo: { type: Boolean, default: false },
    branding: { type: ReportBrandingSchema },
    format: {
      type: String,
      enum: ["PDF", "JSON", "CSV"],
      default: "PDF",
    },
    fileUrl: { type: String },
    generatedBy: { type: String, default: "system" },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ReportSchema.index({ analysisId: 1, version: -1 });
ReportSchema.index({ organizationId: 1, reportType: 1, createdAt: -1 });

export const Report: Model<IReport> =
  mongoose.models.Report || mongoose.model<IReport>("Report", ReportSchema);

export default Report;
