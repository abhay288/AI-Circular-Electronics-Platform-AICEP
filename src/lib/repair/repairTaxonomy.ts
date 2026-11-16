/**
 * EcoIntel Phase 6: Repair Intelligence & Circularity Decision Engine
 * Canonical Taxonomy, Enums, and Strongly-Typed Data Contracts
 */

export type RepairAction =
  | "INSPECT"
  | "CLEAN"
  | "REWORK"
  | "RESOLDER"
  | "REPAIR_TRACE"
  | "REPLACE_COMPONENT"
  | "REPLACE_CONNECTOR"
  | "REPLACE_CAPACITOR"
  | "REPLACE_IC"
  | "REPAIR_PAD"
  | "REPAIR_CORROSION"
  | "THERMAL_INSPECTION"
  | "ELECTRICAL_TEST"
  | "FUNCTIONAL_TEST"
  | "CALIBRATE"
  | "REFURBISH"
  | "REUSE"
  | "MATERIAL_RECOVERY"
  | "RECYCLE"
  | "RETIRE";

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

export type ComponentRepairabilityStatus =
  | "REPAIRABLE"
  | "LIKELY_REPAIRABLE"
  | "CONDITIONALLY_REPAIRABLE"
  | "NOT_REPAIRABLE"
  | "REQUIRES_INSPECTION"
  | "UNKNOWN";

export type RecommendationStatus =
  | "RECOMMENDED"
  | "APPROVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export type RecommendationPriority =
  | "CRITICAL" // P0 - Immediate inspection / safety relevance
  | "HIGH"     // P1 - High functional degradation
  | "MEDIUM"   // P2 - Normal wear / circular optimization
  | "LOW"      // P3 - Preventive / cosmetic
  | "INFO";

export type CircularityRecommendation =
  | "REUSE"
  | "REPAIR"
  | "REFURBISH"
  | "REMANUFACTURE"
  | "RECOVER"
  | "RECYCLE"
  | "RETIRE"
  | "INSPECT";

export type FunctionalTestStatus = "PASS" | "FAIL" | "NOT_PERFORMED";

export type EvidenceObservationTier =
  | "OBSERVED"
  | "INFERRED"
  | "PREDICTED"
  | "RECOMMENDED"
  | "VERIFIED"
  | "PERFORMED";

export interface IComponentRepairAssessment {
  componentId: string;
  componentName: string;
  componentType: string;
  package?: string;
  repairability: ComponentRepairabilityStatus;
  healthStatus: string;
  healthScore: number;
  rulHours?: number;
  damageSeverity: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendedAction: RepairAction;
  priority: RecommendationPriority;
  confidence: number;
  evidence: string[];
  reasoning: string;
  materialRecoveryPotential?: {
    preciousMetalPresence: boolean;
    estimatedValueTier: "HIGH" | "MEDIUM" | "LOW" | "NONE";
  };
}

export interface IRepairRecommendation {
  recommendationId: string;
  componentId?: string;
  componentName?: string;
  action: RepairAction;
  priority: RecommendationPriority;
  reason: string;
  evidence: string[];
  confidence: number;
  expectedOutcome: string;
  prerequisites?: string[];
  safetyNotes?: string;
  estimatedComplexity: "LOW" | "MEDIUM" | "HIGH";
  status: RecommendationStatus;

  // Workflow tracking
  approvedBy?: string;
  approvedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;

  // Execution verification
  technicianId?: string;
  notes?: string;
  replacedComponentId?: string;
  replacementPartNumber?: string;
  functionalTestResult?: FunctionalTestStatus;
  beforeHealth?: number;
  afterHealth?: number;
  evidenceDocuments?: Array<{
    documentName: string;
    documentHash: string;
    storageReference: string;
    uploadedAt: Date;
  }>;
}

export interface ICircularityDecision {
  recommendedPath: CircularityRecommendation;
  alternativePaths: CircularityRecommendation[];
  decisionConfidence: number;
  decisionScore: number; // 0-100 Circularity Decision Score
  decisionFactors: {
    repairability: number;
    health: number;
    rul: number;
    damageSeverity: number;
    componentAvailability: number;
    materialRecoveryPotential: number;
    reusability: number;
  };
  environmentalConsiderations: string;
  technicalConsiderations: string;
  materialConsiderations: string;
  reason: string;
}

export interface IDecisionMatrixOption {
  option: CircularityRecommendation;
  score: number; // 0-100
  confidence: number;
  supportingFactors: string[];
  drawbacks: string[];
}

export interface RepairAssessmentInput {
  analysisId: string;
  sampleId?: string;
  components?: any[];
  damagedRegions?: any[];
  traces?: any[];
  pads?: any[];
  rulResult?: any;
  materialRecoveryResult?: any;
  notes?: string;
}

export interface RepairAssessmentResult {
  analysisId: string;
  status: "COMPLETED" | "INSUFFICIENT_DATA" | "FAILED";
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
}
