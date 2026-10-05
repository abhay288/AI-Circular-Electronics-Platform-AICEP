import mongoose, { Schema, Document, Model } from "mongoose";

export type AnalysisSourceType = "CAMERA" | "UPLOAD" | "SAMPLE";
export type AnalysisMode = "LIVE" | "DEMO";
export type AnalysisStatus =
  | "DRAFT"
  | "READY"
  | "PROCESSING"
  | "DETECTION_COMPLETE"
  | "PCB_ANALYSIS_PROCESSING"
  | "PCB_COMPLETE"
  | "PCB_ANALYSIS_FAILED"
  | "RUL_COMPLETE"
  | "MATERIAL_COMPLETE"
  | "REPAIR_COMPLETE"
  | "PASSPORT_READY"
  | "REPORT_READY"
  | "COMPLETED"
  | "FAILED";

export interface IAnalysisSession extends Document {
  analysisId: string;
  userId?: mongoose.Types.ObjectId | string;
  organizationId?: mongoose.Types.ObjectId | string;

  sourceType: AnalysisSourceType;
  sourceFileId?: mongoose.Types.ObjectId | string;

  deviceName: string;
  deviceType: string;

  imageUrl: string;
  mode: AnalysisMode;
  status: AnalysisStatus;
  progress: number;
  currentStage: string;
  stageStatuses: Record<string, "pending" | "processing" | "completed" | "failed">;

  // Linked sub-document references
  detectionId?: mongoose.Types.ObjectId | string;
  pcbAnalysisId?: mongoose.Types.ObjectId | string;
  rulPredictionId?: mongoose.Types.ObjectId | string;
  materialRecoveryId?: mongoose.Types.ObjectId | string;
  repairAssessmentId?: mongoose.Types.ObjectId | string;
  passportId?: string;
  carbonImpactId?: mongoose.Types.ObjectId | string;
  reportId?: string;

  // Embedded payloads for rapid frontend hydration
  sampleId?: string;
  qualityResult?: Record<string, any>;
  detectionResult?: Record<string, any>;
  reconstructionResult?: Record<string, any>;
  rulResult?: Record<string, any>;
  metalResult?: Record<string, any>;
  repairResult?: Record<string, any>;
  passportResult?: Record<string, any>;
  carbonResult?: Record<string, any>;
  executiveSummary?: Record<string, any>;

  error?: {
    code?: string;
    message?: string;
    stage?: string;
  };

  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AnalysisSessionSchema = new Schema<IAnalysisSession>(
  {
    analysisId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: { type: Schema.Types.Mixed, index: true },
    organizationId: { type: Schema.Types.Mixed, index: true },

    sourceType: {
      type: String,
      enum: ["CAMERA", "UPLOAD", "SAMPLE", "camera", "upload", "sample"],
      default: "SAMPLE",
    },
    sourceFileId: { type: Schema.Types.Mixed },

    deviceName: { type: String, required: true },
    deviceType: { type: String, required: true },

    imageUrl: { type: String, default: "" },

    mode: {
      type: String,
      enum: ["LIVE", "DEMO", "live", "demo"],
      default: "DEMO",
    },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "READY",
        "PROCESSING",
        "DETECTION_COMPLETE",
        "PCB_ANALYSIS_PROCESSING",
        "PCB_COMPLETE",
        "PCB_ANALYSIS_FAILED",
        "RUL_COMPLETE",
        "MATERIAL_COMPLETE",
        "REPAIR_COMPLETE",
        "PASSPORT_READY",
        "REPORT_READY",
        "COMPLETED",
        "FAILED",
        // Lowercase tolerance
        "draft",
        "ready",
        "processing",
        "completed",
        "failed",
      ],
      default: "DRAFT",
      index: true,
    },

    progress: { type: Number, default: 0 },
    currentStage: { type: String, default: "INITIALIZATION" },
    stageStatuses: { type: Schema.Types.Mixed, default: {} },

    detectionId: { type: Schema.Types.Mixed },
    pcbAnalysisId: { type: Schema.Types.Mixed },
    rulPredictionId: { type: Schema.Types.Mixed },
    materialRecoveryId: { type: Schema.Types.Mixed },
    repairAssessmentId: { type: Schema.Types.Mixed },
    passportId: { type: String, index: true },
    carbonImpactId: { type: Schema.Types.Mixed },
    reportId: { type: String },

    sampleId: { type: String },
    qualityResult: { type: Schema.Types.Mixed },
    detectionResult: { type: Schema.Types.Mixed },
    reconstructionResult: { type: Schema.Types.Mixed },
    rulResult: { type: Schema.Types.Mixed },
    metalResult: { type: Schema.Types.Mixed },
    repairResult: { type: Schema.Types.Mixed },
    passportResult: { type: Schema.Types.Mixed },
    carbonResult: { type: Schema.Types.Mixed },
    executiveSummary: { type: Schema.Types.Mixed },

    error: {
      code: { type: String },
      message: { type: String },
      stage: { type: String },
    },

    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Indexes
AnalysisSessionSchema.index({ userId: 1, status: 1 });
AnalysisSessionSchema.index({ createdAt: -1 });

export const AnalysisSession: Model<IAnalysisSession> =
  mongoose.models.AnalysisSession ||
  mongoose.model<IAnalysisSession>("AnalysisSession", AnalysisSessionSchema);

export default AnalysisSession;
