/**
 * EcoIntel Phase 9: Carbon Impact, Circularity Metrics & ESG Taxonomy
 * Defines standard scientific types, impact categories, scenario models,
 * and data quality definitions.
 */

export type ImpactCategory =
  | "CARBON"
  | "MATERIAL"
  | "WASTE"
  | "ENERGY"
  | "WATER"
  | "LIFETIME_EXTENSION"
  | "CIRCULARITY";

export type BaselineScenario =
  | "DISCARD"
  | "RECYCLE"
  | "REPLACE_WITH_NEW"
  | "NO_ACTION";

export type CircularScenario =
  | "REUSE"
  | "REPAIR"
  | "REFURBISH"
  | "REMANUFACTURE"
  | "COMPONENT_RECOVERY"
  | "MATERIAL_RECOVERY";

export type FactorSourceType =
  | "AUTHORITATIVE_DATABASE"
  | "LITERATURE"
  | "GOVERNMENT"
  | "INDUSTRY_STANDARD"
  | "ORGANIZATION_CONFIGURED"
  | "INTERNAL_DATABASE"
  | "USER_PROVIDED"
  | "SYNTHETIC_DEMO";

export type ImpactStatus =
  | "PENDING"
  | "COMPLETED"
  | "ESTIMATED"
  | "CALCULATED"
  | "SIMULATED"
  | "INSUFFICIENT_DATA"
  | "FAILED";

export type ImpactRealization = "POTENTIAL" | "REALIZED" | "PROJECTED";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export interface EmissionFactorReference {
  factorId: string;
  name: string;
  material: string;
  process: string;
  factor: number;
  unit: string;
  source: string;
  sourceType: FactorSourceType;
  sourceReference?: string;
  version: string;
}

export interface MaterialImpactDetail {
  material: string;
  estimatedMassGrams: number;
  recoverableMassGrams: number;
  displacementFactor: number; // e.g. 0.85 = 85% displacement of virgin
  displacedVirginMassGrams: number;
  emissionFactorKgCO2ePerKg: number;
  estimatedAvoidedCO2eKg: number;
  source: string;
}

export interface WasteDiversionSummary {
  baselineWasteKg: number;
  divertedWasteKg: number;
  remainingWasteKg: number;
  diversionRatePercent: number;
}

export interface LifetimeExtensionSummary {
  baselineRemainingHours: number;
  potentialExtensionHours: number;
  potentialExtensionMonths: number;
  realizedExtensionHours?: number;
  isPredictive: boolean;
}

export interface DataQualitySummary {
  completenessPercent: number;
  confidence: ConfidenceLevel;
  uncertaintyRangePercent: number;
  missingInputs: string[];
  limitations: string[];
}

export interface UncertaintyRange {
  minCO2eKg: number;
  maxCO2eKg: number;
  nominalCO2eKg: number;
  rangePercent: number;
}

export interface MethodologyInfo {
  methodologyId: string;
  name: string;
  version: string;
  description: string;
  scope: string;
  formula: string;
  assumptions: string[];
  sources: string[];
}

export interface ScenarioImpactResult {
  scenarioId: string;
  name: string;
  description: string;
  baselineScenario: BaselineScenario;
  circularScenario: CircularScenario;
  grossAvoidedCO2e: number;
  additionalCO2e: number;
  netAvoidedCO2e: number;
  wasteAvoidedKg: number;
  materialDisplacedKg: number;
  lifetimeExtensionMonths: number;
  assumptions: string[];
  confidence: ConfidenceLevel;
}

export interface ESGSummaryReport {
  organizationId: string;
  reportingPeriod: {
    startDate: string;
    endDate: string;
  };
  environmental: {
    totalAvoidedCO2eKg: number;
    totalWasteDivertedKg: number;
    totalMaterialRecoveredKg: number;
    totalMaterialDisplacedKg: number;
    averageCircularityScore: number;
    potentialVsRealizedBreakdown: {
      potentialCO2eKg: number;
      realizedCO2eKg: number;
    };
  };
  governance: {
    totalPassportsMinted: number;
    passportsWithEnvironmentalDataRate: number;
    traceabilityAuditCount: number;
    averageDataCompletenessPercent: number;
  };
  dataQuality: {
    averageConfidence: ConfidenceLevel;
    methodologiesApplied: string[];
    authoritativeFactorUsagePercent: number;
  };
  generatedAt: string;
}
