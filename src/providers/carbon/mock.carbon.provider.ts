import {
  CarbonImpactProvider,
  CarbonImpactInput,
  CarbonImpactResult,
} from "./carbon.interface";
import { MethodologyInfo } from "@/lib/carbon/carbonTaxonomy";

export class MockCarbonImpactProvider implements CarbonImpactProvider {
  async getMethodologyInfo(): Promise<MethodologyInfo> {
    return {
      methodologyId: "ECOINTEL-DEMO-LCA-V1",
      name: "EcoIntel Synthetic Circular Impact Model (Demo / Testing Mode)",
      version: "1.0-demo",
      description:
        "Simplified life-cycle calculation model for testing and demonstration environments. Uses bounded empirical factors from electronics literature.",
      scope: "Scope 3 Category 1 & 12 Avoided Emissions",
      formula:
        "Net Avoided CO2e = (Recoverable Materials × Virgin Displacement Factor × Emission Factor) + Avoided Component Manufacturing - Process Overhead",
      assumptions: [
        "Synthetic demo data generated for non-production environments.",
        "Average electronics waste diversion efficiency assumed at 85%.",
        "Displacement factor for recovered copper: 0.85; Gold: 0.90.",
        "Transport emissions estimated based on regional ground logistics baseline (50 km).",
      ],
      sources: [
        "EcoIntel Synthetic Benchmarks 2026",
        "Ecoinvent 3.9 Synthetic Subset",
        "Empirical Electronics Recycling Literature",
      ],
    };
  }

  async calculate(input: CarbonImpactInput): Promise<CarbonImpactResult> {
    const analysisId = input.analysisId;
    const orgId = input.organizationId;
    const baselineScenario = input.baselineScenario || "DISCARD";
    const circularScenario = input.circularScenario || "REPAIR";

    // Extract material info if available
    const matYield = input.materialRecovery?.estimatedRecoveryYield || {};
    const copperGrams = matYield.copperGrams || 28.5;
    const goldGrams = matYield.goldGrams || 0.12;
    const aluminumGrams = matYield.aluminumGrams || 14.0;
    const totalMassKg = (input.assetMassGrams || (copperGrams + aluminumGrams + 150)) / 1000;

    // Displacement factors & emission factors
    // Copper: 4.5 kgCO2e/kg, 85% displacement
    // Gold: 12,500 kgCO2e/kg, 90% displacement
    // Aluminum: 8.2 kgCO2e/kg, 80% displacement
    const copperDisplacedKg = (copperGrams / 1000) * 0.85;
    const copperAvoidedCO2e = +(copperDisplacedKg * 4.5).toFixed(3);

    const goldDisplacedKg = (goldGrams / 1000) * 0.9;
    const goldAvoidedCO2e = +(goldDisplacedKg * 12500).toFixed(3);

    const alDisplacedKg = (aluminumGrams / 1000) * 0.8;
    const alAvoidedCO2e = +(alDisplacedKg * 8.2).toFixed(3);

    const materialsAvoidedCO2e = +(copperAvoidedCO2e + goldAvoidedCO2e + alAvoidedCO2e).toFixed(3);

    // Component reuse / repair benefit
    const avoidedComponentMfgCO2e = circularScenario === "REPAIR" || circularScenario === "REUSE" ? 18.5 : 5.0;

    const grossAvoidedCO2e = +(materialsAvoidedCO2e + avoidedComponentMfgCO2e).toFixed(3);

    // Additional process impact (repair energy, cleaning, local transport)
    const processBurdenCO2e = circularScenario === "REPAIR" ? 1.4 : circularScenario === "REFURBISH" ? 2.8 : 0.8;
    const transportBurdenCO2e = 0.6; // 50 km logistics
    const additionalImpactCO2e = +(processBurdenCO2e + transportBurdenCO2e).toFixed(3);

    const netAvoidedCO2e = Math.max(0, +(grossAvoidedCO2e - additionalImpactCO2e).toFixed(3));

    // Waste Diversion
    const divertedWasteKg = +(totalMassKg * 0.92).toFixed(3);
    const remainingWasteKg = Math.max(0, +(totalMassKg - divertedWasteKg).toFixed(3));

    // Lifetime extension
    const baselineRemainingHours = input.rulPrediction?.predictedHours || 18000;
    const potentialExtensionHours = circularScenario === "REPAIR" ? 24000 : 8000;
    const potentialExtensionMonths = Math.round(potentialExtensionHours / 720);

    // Uncertainty range: +/- 15%
    const rangePercent = 15;
    const minCO2eKg = +(netAvoidedCO2e * (1 - rangePercent / 100)).toFixed(3);
    const maxCO2eKg = +(netAvoidedCO2e * (1 + rangePercent / 100)).toFixed(3);

    const circularityScore = circularScenario === "REUSE" ? 95 : circularScenario === "REPAIR" ? 90 : 78;

    return {
      analysisId,
      organizationId: orgId,
      status: "CALCULATED",

      totalAvoidedCO2e: netAvoidedCO2e,
      grossAvoidedCO2e,
      additionalImpactCO2e,
      netAvoidedCO2e,
      unit: "kgCO2e",

      baselineScenario,
      circularScenario,

      methodology: "Material Displacement Method (Demo Mode)",
      methodologyVersion: "1.0-demo",
      calculationVersion: "carbon-mock-v1",

      waste: {
        baselineWasteKg: totalMassKg,
        divertedWasteKg,
        remainingWasteKg,
        diversionRatePercent: 92,
      },

      materials: {
        recoveredMassKg: +((copperGrams + goldGrams + aluminumGrams) / 1000).toFixed(3),
        usableMassKg: +(((copperGrams + goldGrams + aluminumGrams) * 0.95) / 1000).toFixed(3),
        displacementMassKg: +(copperDisplacedKg + goldDisplacedKg + alDisplacedKg).toFixed(3),
        details: [
          {
            material: "Copper",
            estimatedMassGrams: copperGrams,
            recoverableMassGrams: +(copperGrams * 0.95).toFixed(2),
            displacementFactor: 0.85,
            displacedVirginMassGrams: +(copperDisplacedKg * 1000).toFixed(2),
            emissionFactorKgCO2ePerKg: 4.5,
            estimatedAvoidedCO2eKg: copperAvoidedCO2e,
            source: "USGS & Ecoinvent 3.9 (Synthetic Demo)",
          },
          {
            material: "Gold",
            estimatedMassGrams: goldGrams,
            recoverableMassGrams: +(goldGrams * 0.92).toFixed(3),
            displacementFactor: 0.9,
            displacedVirginMassGrams: +(goldDisplacedKg * 1000).toFixed(3),
            emissionFactorKgCO2ePerKg: 12500,
            estimatedAvoidedCO2eKg: goldAvoidedCO2e,
            source: "World Gold Council / Ecoinvent 3.9 (Synthetic Demo)",
          },
          {
            material: "Aluminum",
            estimatedMassGrams: aluminumGrams,
            recoverableMassGrams: +(aluminumGrams * 0.90).toFixed(2),
            displacementFactor: 0.8,
            displacedVirginMassGrams: +(alDisplacedKg * 1000).toFixed(2),
            emissionFactorKgCO2ePerKg: 8.2,
            estimatedAvoidedCO2eKg: alAvoidedCO2e,
            source: "International Aluminium Institute (Synthetic Demo)",
          },
        ],
      },

      lifetimeExtension: {
        baselineRemainingHours,
        potentialExtensionHours,
        potentialExtensionMonths,
        isPredictive: true,
      },

      circularityScore,

      dataQuality: {
        completenessPercent: 82,
        confidence: "MEDIUM",
        uncertaintyRangePercent: rangePercent,
        missingInputs: ["exact_factory_grid_mix", "post_consumer_collection_route"],
        limitations: [
          "Calculated in demonstration mode using synthetic emission factors.",
          "Not an official ISO 14040/44 accredited corporate carbon certificate.",
        ],
      },

      uncertainty: {
        minCO2eKg,
        maxCO2eKg,
        nominalCO2eKg: netAvoidedCO2e,
        rangePercent,
      },

      emissionFactorsUsed: [
        {
          factorId: "DEMO-CU-01",
          name: "Virgin Copper Smelting Avoidance",
          material: "Copper",
          process: "PRIMARY_EXTRACTION_AVOIDED",
          factor: 4.5,
          unit: "kgCO2e/kg",
          source: "Ecoinvent 3.9 (Synthetic)",
          sourceType: "SYNTHETIC_DEMO",
          version: "1.0",
        },
        {
          factorId: "DEMO-AU-01",
          name: "Virgin Gold Extraction Avoidance",
          material: "Gold",
          process: "PRIMARY_EXTRACTION_AVOIDED",
          factor: 12500,
          unit: "kgCO2e/kg",
          source: "World Gold Council (Synthetic)",
          sourceType: "SYNTHETIC_DEMO",
          version: "1.0",
        },
        {
          factorId: "DEMO-AL-01",
          name: "Virgin Aluminum Smelting Avoidance",
          material: "Aluminum",
          process: "PRIMARY_EXTRACTION_AVOIDED",
          factor: 8.2,
          unit: "kgCO2e/kg",
          source: "IAI (Synthetic)",
          sourceType: "SYNTHETIC_DEMO",
          version: "1.0",
        },
      ],

      assumptions: [
        "Avoided emissions calculated against full virgin primary production baseline.",
        "Material displacement factors modeled between 80% and 90%.",
        "Repair energy overhead deducted based on 1.4 kgCO2e bench service assumption.",
        "Demonstration mode: figures are illustrative and not legally binding.",
      ],
      sources: ["Ecoinvent 3.9 Demo", "EcoIntel Benchmark Database"],
      limitations: [
        "Uncertainty range +/- 15% due to generic grid factor assumption.",
        "Direct component rework emissions estimated from prototype telemetry.",
      ],

      realizedVsPotential: "POTENTIAL",
      isDemo: true,

      ledgerEntries: [
        {
          sourceType: "MATERIAL",
          sourceId: "COPPER-01",
          impactType: "MATERIAL_DISPLACEMENT",
          quantity: copperDisplacedKg,
          unit: "kg",
          factor: 4.5,
          factorUnit: "kgCO2e/kg",
          impactValue: copperAvoidedCO2e,
          methodology: "Material Displacement Method",
          scenario: circularScenario,
          isExclusive: true,
        },
        {
          sourceType: "MATERIAL",
          sourceId: "GOLD-01",
          impactType: "MATERIAL_DISPLACEMENT",
          quantity: goldDisplacedKg,
          unit: "kg",
          factor: 12500,
          factorUnit: "kgCO2e/kg",
          impactValue: goldAvoidedCO2e,
          methodology: "Material Displacement Method",
          scenario: circularScenario,
          isExclusive: true,
        },
        {
          sourceType: "COMPONENT",
          sourceId: "AVOIDED_MFG",
          impactType: "AVOIDED_MANUFACTURING",
          quantity: 1,
          unit: "unit",
          factor: avoidedComponentMfgCO2e,
          factorUnit: "kgCO2e/unit",
          impactValue: avoidedComponentMfgCO2e,
          methodology: "Material Displacement Method",
          scenario: circularScenario,
          isExclusive: false,
        },
        {
          sourceType: "PROCESS",
          sourceId: "REPAIR_WORKSHOP",
          impactType: "PROCESS_EMISSION",
          quantity: 1,
          unit: "service",
          factor: -processBurdenCO2e,
          factorUnit: "kgCO2e/service",
          impactValue: -processBurdenCO2e,
          methodology: "Material Displacement Method",
          scenario: circularScenario,
          isExclusive: false,
        },
      ],
    };
  }
}
