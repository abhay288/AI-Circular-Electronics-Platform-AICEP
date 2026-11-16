import mongoose, { Schema, Model, Document } from "mongoose";
import {
  RepairAction,
  ComponentRepairabilityStatus,
  RecommendationStatus,
  RecommendationPriority,
  CircularityRecommendation,
  FunctionalTestStatus,
  IComponentRepairAssessment,
  IRepairRecommendation,
  ICircularityDecision,
  IDecisionMatrixOption,
} from "@/lib/repair/repairTaxonomy";

// Re-export core types for downstream consumers
export type {
  RepairAction,
  ComponentRepairabilityStatus,
  RecommendationStatus,
  RecommendationPriority,
  CircularityRecommendation,
  FunctionalTestStatus,
  IComponentRepairAssessment,
  IRepairRecommendation,
  ICircularityDecision,
  IDecisionMatrixOption,
};

// Legacy interface support for backward compatibility
export interface IRepairIssue {
  componentId?: string;
  componentName: string;
  issue: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  recommendation: string;
  reason: string;
  suggestedAction: string;
}

export interface IRepairAssessment extends Document {
  analysisId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "INSUFFICIENT_DATA";

  overallRepairability: ComponentRepairabilityStatus;
  overallRecommendation: CircularityRecommendation;
  decisionScore: number;

  componentAssessments: IComponentRepairAssessment[];
  repairRecommendations: IRepairRecommendation[];
  circularityDecision: ICircularityDecision;
  decisionMatrix: IDecisionMatrixOption[];

  evidence: Array<{
    source: string;
    type: string;
    description: string;
    confidence: number;
  }>;

  limitations: string[];
  provider: string;
  modelVersion: string;

  // Legacy compatibility fields
  recommendedAction: "REUSE" | "REPAIR" | "REFURBISH" | "RECOVER" | "RECYCLE";
  primaryFault: string;
  estimatedRepairCostINR: number;
  estimatedRepairCostUSD: number;
  estimatedCO2SavingsKg: number;
  feasibilityIndexPercent: number;
  confidence: number;
  issues: IRepairIssue[];

  createdAt: Date;
  updatedAt: Date;
}

const ComponentRepairAssessmentSchema = new Schema<IComponentRepairAssessment>(
  {
    componentId: { type: String, required: true },
    componentName: { type: String, required: true },
    componentType: { type: String, required: true },
    package: { type: String },
    repairability: {
      type: String,
      enum: [
        "REPAIRABLE",
        "LIKELY_REPAIRABLE",
        "CONDITIONALLY_REPAIRABLE",
        "NOT_REPAIRABLE",
        "REQUIRES_INSPECTION",
        "UNKNOWN",
      ],
      default: "LIKELY_REPAIRABLE",
    },
    healthStatus: { type: String, default: "HEALTHY" },
    healthScore: { type: Number, default: 90 },
    rulHours: { type: Number },
    damageSeverity: {
      type: String,
      enum: ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "NONE",
    },
    recommendedAction: { type: String, required: true },
    priority: {
      type: String,
      enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"],
      default: "MEDIUM",
    },
    confidence: { type: Number, default: 0.85 },
    evidence: { type: [String], default: [] },
    reasoning: { type: String, required: true },
    materialRecoveryPotential: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const RepairRecommendationSchema = new Schema<IRepairRecommendation>(
  {
    recommendationId: { type: String, required: true },
    componentId: { type: String },
    componentName: { type: String },
    action: { type: String, required: true },
    priority: {
      type: String,
      enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"],
      default: "MEDIUM",
    },
    reason: { type: String, required: true },
    evidence: { type: [String], default: [] },
    confidence: { type: Number, default: 0.85 },
    expectedOutcome: { type: String, required: true },
    prerequisites: { type: [String], default: [] },
    safetyNotes: { type: String },
    estimatedComplexity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },
    status: {
      type: String,
      enum: [
        "RECOMMENDED",
        "APPROVED",
        "IN_PROGRESS",
        "COMPLETED",
        "REJECTED",
        "CANCELLED",
      ],
      default: "RECOMMENDED",
    },

    approvedBy: { type: String },
    approvedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    rejectedBy: { type: String },
    rejectedAt: { type: Date },
    rejectionReason: { type: String },

    technicianId: { type: String },
    notes: { type: String },
    replacedComponentId: { type: String },
    replacementPartNumber: { type: String },
    functionalTestResult: {
      type: String,
      enum: ["PASS", "FAIL", "NOT_PERFORMED"],
      default: "NOT_PERFORMED",
    },
    beforeHealth: { type: Number },
    afterHealth: { type: Number },
    evidenceDocuments: { type: Schema.Types.Mixed, default: [] },
  },
  { _id: false }
);

const RepairAssessmentSchema = new Schema<IRepairAssessment>(
  {
    analysisId: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "INSUFFICIENT_DATA"],
      default: "COMPLETED",
      index: true,
    },

    overallRepairability: {
      type: String,
      enum: [
        "REPAIRABLE",
        "LIKELY_REPAIRABLE",
        "CONDITIONALLY_REPAIRABLE",
        "NOT_REPAIRABLE",
        "REQUIRES_INSPECTION",
        "UNKNOWN",
      ],
      default: "LIKELY_REPAIRABLE",
    },

    overallRecommendation: {
      type: String,
      enum: [
        "REUSE",
        "REPAIR",
        "REFURBISH",
        "REMANUFACTURE",
        "RECOVER",
        "RECYCLE",
        "RETIRE",
        "INSPECT",
      ],
      default: "REPAIR",
    },

    decisionScore: { type: Number, default: 82 },

    componentAssessments: {
      type: [ComponentRepairAssessmentSchema],
      default: [],
    },

    repairRecommendations: {
      type: [RepairRecommendationSchema],
      default: [],
    },

    circularityDecision: {
      type: Schema.Types.Mixed,
      default: {},
    },

    decisionMatrix: {
      type: Schema.Types.Mixed,
      default: [],
    },

    evidence: {
      type: Schema.Types.Mixed,
      default: [],
    },

    limitations: { type: [String], default: [] },
    provider: { type: String, default: "RULES" },
    modelVersion: { type: String, default: "repair-rules-v1.0" },

    // Legacy compatibility fields
    recommendedAction: {
      type: String,
      enum: ["REUSE", "REPAIR", "REFURBISH", "RECOVER", "RECYCLE"],
      default: "REFURBISH",
    },
    primaryFault: {
      type: String,
      default: "Thermal stress detected on power regulation circuit",
    },
    estimatedRepairCostINR: { type: Number, default: 1250 },
    estimatedRepairCostUSD: { type: Number, default: 14.5 },
    estimatedCO2SavingsKg: { type: Number, default: 28.4 },
    feasibilityIndexPercent: { type: Number, default: 92 },
    confidence: { type: Number, default: 0.94 },
    issues: { type: Schema.Types.Mixed, default: [] },
  },
  { timestamps: true }
);

// Indexes
RepairAssessmentSchema.index({ createdAt: -1 });

export const RepairAssessment: Model<IRepairAssessment> =
  mongoose.models.RepairAssessment ||
  mongoose.model<IRepairAssessment>("RepairAssessment", RepairAssessmentSchema);

export default RepairAssessment;
