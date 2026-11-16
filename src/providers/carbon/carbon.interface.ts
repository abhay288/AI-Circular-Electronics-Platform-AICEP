/**
 * EcoIntel Carbon Impact Provider Interface
 */
import {
  MethodologyInfo,
  BaselineScenario,
  CircularScenario,
  ConfidenceLevel,
  MaterialImpactDetail,
  EmissionFactorReference,
  ImpactStatus,
  ImpactRealization,
} from "@/lib/carbon/carbonTaxonomy";

export interface CarbonImpactInput {
  analysisId: string;
  organizationId?: string;
  assetType?: string;
  assetMassGrams?: number;

  materialRecovery?: any;
  repairAssessment?: any;
  rulPrediction?: any;
  marketplaceData?: any;
  lifecycleEvents?: any[];

  baselineScenario?: BaselineScenario;
  circularScenario?: CircularScenario;

  geography?: string;
  electricityMix?: string;
  transportDistanceKm?: number;
  manufacturingAvoidanceFactor?: number;
  materialEmissionFactors?: Record<string, number>;
  wasteTreatmentFactors?: Record<string, number>;
  additionalInputs?: Record<string, any>;
}

export interface CarbonImpactResult {
  analysisId: string;
  organizationId?: string;
  status: ImpactStatus;

  totalAvoidedCO2e: number;
  grossAvoidedCO2e: number;
  additionalImpactCO2e: number;
  netAvoidedCO2e: number;
  unit: string;

  baselineScenario: BaselineScenario;
  circularScenario: CircularScenario;

  methodology: string;
  methodologyVersion: string;
  calculationVersion: string;

  waste: {
    baselineWasteKg: number;
    divertedWasteKg: number;
    remainingWasteKg: number;
    diversionRatePercent: number;
  };

  materials: {
    recoveredMassKg: number;
    usableMassKg: number;
    displacementMassKg: number;
    details: MaterialImpactDetail[];
  };

  lifetimeExtension: {
    baselineRemainingHours: number;
    potentialExtensionHours: number;
    potentialExtensionMonths: number;
    isPredictive: boolean;
  };

  circularityScore: number;

  dataQuality: {
    completenessPercent: number;
    confidence: ConfidenceLevel;
    uncertaintyRangePercent: number;
    missingInputs: string[];
    limitations: string[];
  };

  uncertainty: {
    minCO2eKg: number;
    maxCO2eKg: number;
    nominalCO2eKg: number;
    rangePercent: number;
  };

  emissionFactorsUsed: EmissionFactorReference[];
  assumptions: string[];
  sources: string[];
  limitations: string[];

  realizedVsPotential: ImpactRealization;
  isDemo: boolean;

  ledgerEntries: Array<{
    sourceType: "COMPONENT" | "MATERIAL" | "REPAIR" | "MARKETPLACE" | "PROCESS" | "TRANSPORT";
    sourceId: string;
    impactType:
      | "AVOIDED_MANUFACTURING"
      | "MATERIAL_DISPLACEMENT"
      | "REPAIR_OFFSET"
      | "TRANSPORT_EMISSION"
      | "PROCESS_EMISSION"
      | "WASTE_DIVERSION";
    quantity: number;
    unit: string;
    factor: number;
    factorUnit: string;
    impactValue: number;
    methodology: string;
    scenario: string;
    isExclusive: boolean;
  }>;
}

export interface CarbonImpactProvider {
  calculate(input: CarbonImpactInput): Promise<CarbonImpactResult>;
  getMethodologyInfo(): Promise<MethodologyInfo>;
}
