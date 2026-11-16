import mongoose, { Schema, Document, Model } from "mongoose";
import {
  ImpactStatus,
  BaselineScenario,
  CircularScenario,
  ConfidenceLevel,
  ImpactRealization,
  MaterialImpactDetail,
  EmissionFactorReference,
} from "@/lib/carbon/carbonTaxonomy";

export interface ICarbonImpact extends Document {
  analysisId: string;
  organizationId?: string;

  status: ImpactStatus;

  // Impact Calculations (kgCO2e)
  totalAvoidedCO2e: number;
  grossAvoidedCO2e: number;
  additionalImpactCO2e: number; // Circular process emissions (repair, logistics, testing)
  netAvoidedCO2e: number;       // grossAvoided - additionalImpact
  unit: string;                 // "kgCO2e"

  // Scenarios
  baselineScenario: BaselineScenario;
  circularScenario: CircularScenario;

  // Versioning & Audit
  methodology: string;
  methodologyVersion: string;
  calculationVersion: string;

  // Waste Diversion
  waste: {
    baselineWasteKg: number;
    divertedWasteKg: number;
    remainingWasteKg: number;
    diversionRatePercent: number;
  };

  // Material Displacement
  materials: {
    recoveredMassKg: number;
    usableMassKg: number;
    displacementMassKg: number;
    details: MaterialImpactDetail[];
  };

  // Lifetime Extension
  lifetimeExtension: {
    baselineRemainingHours: number;
    potentialExtensionHours: number;
    potentialExtensionMonths: number;
    isPredictive: boolean;
  };

  // Circularity Score (0-100)
  circularityScore: number;

  // Data Quality & Uncertainty
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

  // Backward compatibility fields
  co2AvoidedKg: number;
  energySavedKWh: number;
  waterSavedLiters: number;
  ewasteDivertedKg: number;
  circularityScorePercent: number;

  createdAt: Date;
  updatedAt: Date;
}

const MaterialDetailSchema = new Schema<MaterialImpactDetail>(
  {
    material: { type: String, required: true },
    estimatedMassGrams: { type: Number, required: true },
    recoverableMassGrams: { type: Number, required: true },
    displacementFactor: { type: Number, required: true },
    displacedVirginMassGrams: { type: Number, required: true },
    emissionFactorKgCO2ePerKg: { type: Number, required: true },
    estimatedAvoidedCO2eKg: { type: Number, required: true },
    source: { type: String, required: true },
  },
  { _id: false }
);

const EmissionFactorUsedSchema = new Schema<EmissionFactorReference>(
  {
    factorId: { type: String, required: true },
    name: { type: String, required: true },
    material: { type: String, required: true },
    process: { type: String, required: true },
    factor: { type: Number, required: true },
    unit: { type: String, required: true },
    source: { type: String, required: true },
    sourceType: { type: String, required: true },
    sourceReference: { type: String },
    version: { type: String, required: true },
  },
  { _id: false }
);

const CarbonImpactSchema = new Schema<ICarbonImpact>(
  {
    analysisId: { type: String, required: true, unique: true, index: true },
    organizationId: { type: String, index: true },

    status: {
      type: String,
      enum: [
        "PENDING",
        "COMPLETED",
        "ESTIMATED",
        "CALCULATED",
        "SIMULATED",
        "INSUFFICIENT_DATA",
        "FAILED",
      ],
      default: "ESTIMATED",
      index: true,
    },

    totalAvoidedCO2e: { type: Number, default: 0 },
    grossAvoidedCO2e: { type: Number, default: 0 },
    additionalImpactCO2e: { type: Number, default: 0 },
    netAvoidedCO2e: { type: Number, default: 0 },
    unit: { type: String, default: "kgCO2e" },

    baselineScenario: {
      type: String,
      enum: ["DISCARD", "RECYCLE", "REPLACE_WITH_NEW", "NO_ACTION"],
      default: "DISCARD",
    },
    circularScenario: {
      type: String,
      enum: ["REUSE", "REPAIR", "REFURBISH", "REMANUFACTURE", "COMPONENT_RECOVERY", "MATERIAL_RECOVERY"],
      default: "REPAIR",
    },

    methodology: { type: String, default: "Material Displacement Method v1" },
    methodologyVersion: { type: String, default: "1.0" },
    calculationVersion: { type: String, default: "carbon-v1" },

    waste: {
      baselineWasteKg: { type: Number, default: 0 },
      divertedWasteKg: { type: Number, default: 0 },
      remainingWasteKg: { type: Number, default: 0 },
      diversionRatePercent: { type: Number, default: 0 },
    },

    materials: {
      recoveredMassKg: { type: Number, default: 0 },
      usableMassKg: { type: Number, default: 0 },
      displacementMassKg: { type: Number, default: 0 },
      details: { type: [MaterialDetailSchema], default: [] },
    },

    lifetimeExtension: {
      baselineRemainingHours: { type: Number, default: 0 },
      potentialExtensionHours: { type: Number, default: 0 },
      potentialExtensionMonths: { type: Number, default: 0 },
      isPredictive: { type: Boolean, default: true },
    },

    circularityScore: { type: Number, default: 85, min: 0, max: 100 },

    dataQuality: {
      completenessPercent: { type: Number, default: 75 },
      confidence: { type: String, enum: ["HIGH", "MEDIUM", "LOW"], default: "MEDIUM" },
      uncertaintyRangePercent: { type: Number, default: 20 },
      missingInputs: { type: [String], default: [] },
      limitations: { type: [String], default: [] },
    },

    uncertainty: {
      minCO2eKg: { type: Number, default: 0 },
      maxCO2eKg: { type: Number, default: 0 },
      nominalCO2eKg: { type: Number, default: 0 },
      rangePercent: { type: Number, default: 20 },
    },

    emissionFactorsUsed: { type: [EmissionFactorUsedSchema], default: [] },
    assumptions: { type: [String], default: [] },
    sources: { type: [String], default: [] },
    limitations: { type: [String], default: [] },

    realizedVsPotential: {
      type: String,
      enum: ["POTENTIAL", "REALIZED", "PROJECTED"],
      default: "POTENTIAL",
      index: true,
    },
    isDemo: { type: Boolean, default: false },

    // Backward compatibility fields
    co2AvoidedKg: { type: Number, default: 28.4 },
    energySavedKWh: { type: Number, default: 412 },
    waterSavedLiters: { type: Number, default: 1850 },
    ewasteDivertedKg: { type: Number, default: 0.28 },
    circularityScorePercent: { type: Number, default: 94.2 },
  },
  { timestamps: true }
);

// Virtual for net CO2e if accessed
CarbonImpactSchema.pre("save", function (next) {
  if (this.grossAvoidedCO2e !== undefined && this.additionalImpactCO2e !== undefined) {
    this.netAvoidedCO2e = Math.max(
      0,
      +(this.grossAvoidedCO2e - this.additionalImpactCO2e).toFixed(3)
    );
    this.totalAvoidedCO2e = this.netAvoidedCO2e;
    this.co2AvoidedKg = this.netAvoidedCO2e;
  }
  if (this.circularityScore !== undefined) {
    this.circularityScorePercent = this.circularityScore;
  }
  if (this.waste?.divertedWasteKg !== undefined) {
    this.ewasteDivertedKg = this.waste.divertedWasteKg;
  }
  next();
});

export const CarbonImpact: Model<ICarbonImpact> =
  mongoose.models.CarbonImpact ||
  mongoose.model<ICarbonImpact>("CarbonImpact", CarbonImpactSchema);

export default CarbonImpact;
