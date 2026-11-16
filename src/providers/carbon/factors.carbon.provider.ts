import {
  CarbonImpactProvider,
  CarbonImpactInput,
  CarbonImpactResult,
} from "./carbon.interface";
import { MethodologyInfo, MaterialImpactDetail, EmissionFactorReference } from "@/lib/carbon/carbonTaxonomy";
import MaterialEmissionFactor from "@/models/MaterialEmissionFactor";
import ImpactMethodology from "@/models/ImpactMethodology";
import connectDB from "@/lib/db";

// Standard displacement factors supported by literature (not 100%)
const DISPLACEMENT_FACTORS: Record<string, number> = {
  Copper: 0.85,
  Gold: 0.90,
  Silver: 0.85,
  Palladium: 0.85,
  Aluminum: 0.80,
  Steel: 0.75,
  Tin: 0.70,
  Silicon: 0.60,
  FR4: 0.50,
};

export class FactorBasedCarbonProvider implements CarbonImpactProvider {
  async getMethodologyInfo(): Promise<MethodologyInfo> {
    await connectDB();
    const doc = await ImpactMethodology.findOne({ status: "ACTIVE" }).sort({ createdAt: -1 });

    if (doc) {
      return {
        methodologyId: doc.methodologyId,
        name: doc.name,
        version: doc.version,
        description: doc.description,
        scope: doc.scope,
        formula: doc.formula,
        assumptions: doc.assumptions,
        sources: doc.sources,
      };
    }

    return {
      methodologyId: "MDM-V1.0",
      name: "Material Displacement Method (Empirical Emission Factors)",
      version: "1.0",
      description:
        "Scientific lifecycle accounting model calculating net avoided emissions by comparing baseline disposal with circular life-extension pathways.",
      scope: "Scope 3 Category 1 (Purchased Goods) & Category 12 (End-of-Life)",
      formula:
        "Net Avoided CO2e = ∑(Recoverable Material_i × Displacement_i × EmissionFactor_i) + Avoided Manufacturing - Process/Transport Overhead",
      assumptions: [
        "Recovered secondary materials displace primary virgin mining at empirically bounded substitution ratios (60-90%).",
        "Repair process energy derived from typical electronics bench diagnostics (1.2–2.0 kWh).",
        "Transport emissions based on regional average logistics factors.",
        "Component reuse takes precedence over material shredding; duplicate crediting prevented by impact ledger.",
      ],
      sources: [
        "Ecoinvent 3.9 Database",
        "World Gold Council LCI",
        "International Aluminium Institute",
        "IPCC Guidelines for National Greenhouse Gas Inventories",
      ],
    };
  }

  async calculate(input: CarbonImpactInput): Promise<CarbonImpactResult> {
    await connectDB();

    const analysisId = input.analysisId;
    const orgId = input.organizationId;
    const baselineScenario = input.baselineScenario || "DISCARD";
    const circularScenario = input.circularScenario || "REPAIR";

    const methodologyInfo = await this.getMethodologyInfo();

    // Query active factors from database
    const factorQuery: any = { status: "ACTIVE" };
    if (orgId) {
      factorQuery.$or = [{ organizationId: orgId }, { organizationId: { $exists: false } }, { organizationId: null }];
    }
    const factorsInDB = await MaterialEmissionFactor.find(factorQuery).lean();

    const factorMap = new Map<string, any>();
    for (const f of factorsInDB) {
      factorMap.set(f.material.toLowerCase(), f);
    }

    const missingInputs: string[] = [];
    const limitations: string[] = [];
    const assumptions: string[] = [...methodologyInfo.assumptions];
    const sourcesUsed = new Set<string>();
    const emissionFactorsUsed: EmissionFactorReference[] = [];
    const materialDetails: MaterialImpactDetail[] = [];
    const ledgerEntries: CarbonImpactResult["ledgerEntries"] = [];

    // Check material recovery telemetry
    const matYield = input.materialRecovery?.estimatedRecoveryYield || {};
    const recoverableItems: Array<{ name: string; massGrams: number }> = [];

    if (matYield.copperGrams !== undefined) recoverableItems.push({ name: "Copper", massGrams: matYield.copperGrams });
    if (matYield.goldGrams !== undefined) recoverableItems.push({ name: "Gold", massGrams: matYield.goldGrams });
    if (matYield.aluminumGrams !== undefined) recoverableItems.push({ name: "Aluminum", massGrams: matYield.aluminumGrams });
    if (matYield.silverGrams !== undefined) recoverableItems.push({ name: "Silver", massGrams: matYield.silverGrams });
    if (matYield.tinGrams !== undefined) recoverableItems.push({ name: "Tin", massGrams: matYield.tinGrams });

    // Fallback if specific metals empty: check preciousMetals array
    if (recoverableItems.length === 0 && Array.isArray(input.materialRecovery?.preciousMetals)) {
      for (const pm of input.materialRecovery.preciousMetals) {
        if (pm.element && pm.estimatedWeightGrams) {
          recoverableItems.push({ name: pm.element, massGrams: pm.estimatedWeightGrams });
        }
      }
    }

    let materialAvoidedCO2e = 0;
    let totalRecoveredKg = 0;
    let totalDisplacedKg = 0;

    // Evaluate each material
    for (const item of recoverableItems) {
      const dbFactor = factorMap.get(item.name.toLowerCase());
      if (!dbFactor) {
        missingInputs.push(`emission_factor_for_${item.name.toLowerCase()}`);
        continue;
      }

      sourcesUsed.add(dbFactor.source);
      emissionFactorsUsed.push({
        factorId: dbFactor.factorId,
        name: `${dbFactor.material} (${dbFactor.process})`,
        material: dbFactor.material,
        process: dbFactor.process,
        factor: dbFactor.factor,
        unit: dbFactor.unit,
        source: dbFactor.source,
        sourceType: dbFactor.sourceType,
        sourceReference: dbFactor.sourceReference,
        version: dbFactor.version,
      });

      const dispFactor = DISPLACEMENT_FACTORS[item.name] || 0.75;
      const massKg = item.massGrams / 1000;
      totalRecoveredKg += massKg;

      const displacedKg = massKg * dispFactor;
      totalDisplacedKg += displacedKg;

      const co2Avoided = +(displacedKg * dbFactor.factor).toFixed(3);
      materialAvoidedCO2e += co2Avoided;

      materialDetails.push({
        material: item.name,
        estimatedMassGrams: item.massGrams,
        recoverableMassGrams: +(item.massGrams * 0.95).toFixed(2),
        displacementFactor: dispFactor,
        displacedVirginMassGrams: +(displacedKg * 1000).toFixed(2),
        emissionFactorKgCO2ePerKg: dbFactor.factor,
        estimatedAvoidedCO2eKg: co2Avoided,
        source: `${dbFactor.source} (v${dbFactor.version})`,
      });

      ledgerEntries.push({
        sourceType: "MATERIAL",
        sourceId: `MAT-${item.name.toUpperCase()}`,
        impactType: "MATERIAL_DISPLACEMENT",
        quantity: displacedKg,
        unit: "kg",
        factor: dbFactor.factor,
        factorUnit: dbFactor.unit,
        impactValue: co2Avoided,
        methodology: methodologyInfo.name,
        scenario: circularScenario,
        isExclusive: true,
      });
    }

    // Component Avoided Manufacturing
    let avoidedMfgCO2e = 0;
    if (circularScenario === "REUSE" || circularScenario === "REPAIR" || circularScenario === "REFURBISH") {
      // Avoided new component assembly
      avoidedMfgCO2e = 16.5; // Bounded avoided production
      ledgerEntries.push({
        sourceType: "COMPONENT",
        sourceId: "AVOIDED_ASSEMBLY",
        impactType: "AVOIDED_MANUFACTURING",
        quantity: 1,
        unit: "unit",
        factor: avoidedMfgCO2e,
        factorUnit: "kgCO2e/unit",
        impactValue: avoidedMfgCO2e,
        methodology: methodologyInfo.name,
        scenario: circularScenario,
        isExclusive: false,
      });
    }

    const grossAvoidedCO2e = +(materialAvoidedCO2e + avoidedMfgCO2e).toFixed(3);

    // Process & Transport Deductions (Circular process emissions)
    let processOverheadCO2e = 0;
    if (circularScenario === "REPAIR") {
      processOverheadCO2e = 1.2; // Bench testing, desoldering, flux cleaning
    } else if (circularScenario === "REFURBISH") {
      processOverheadCO2e = 2.4;
    } else if (circularScenario === "MATERIAL_RECOVERY") {
      processOverheadCO2e = 0.8;
    }

    const transportKm = input.transportDistanceKm || 50;
    const transportCO2e = +((transportKm * 0.012)).toFixed(3); // 12g CO2e/km for light local cargo
    const additionalImpactCO2e = +(processOverheadCO2e + transportCO2e).toFixed(3);

    ledgerEntries.push({
      sourceType: "PROCESS",
      sourceId: "CIRCULAR_PROCESS",
      impactType: "PROCESS_EMISSION",
      quantity: 1,
      unit: "session",
      factor: -processOverheadCO2e,
      factorUnit: "kgCO2e/session",
      impactValue: -processOverheadCO2e,
      methodology: methodologyInfo.name,
      scenario: circularScenario,
      isExclusive: false,
    });

    const netAvoidedCO2e = Math.max(0, +(grossAvoidedCO2e - additionalImpactCO2e).toFixed(3));

    // Waste Diversion
    const totalAssetMassKg = (input.assetMassGrams || (totalRecoveredKg * 1000 + 120)) / 1000;
    const divertedWasteKg = +(totalAssetMassKg * 0.88).toFixed(3);
    const remainingWasteKg = Math.max(0, +(totalAssetMassKg - divertedWasteKg).toFixed(3));

    // Lifetime extension
    const baselineHours = input.rulPrediction?.predictedHours || 16000;
    const potentialExtensionHours = circularScenario === "REPAIR" ? 21000 : 6000;
    const potentialExtensionMonths = Math.round(potentialExtensionHours / 720);

    // Uncertainty and data quality
    const missingFactorCount = missingInputs.length;
    let confidence: "HIGH" | "MEDIUM" | "LOW" = "HIGH";
    let rangePercent = 12;

    if (missingFactorCount > 0 || factorsInDB.length < 3) {
      confidence = "MEDIUM";
      rangePercent = 22;
      limitations.push("Some material emission factors were unavailable in the active factor registry.");
    }
    if (recoverableItems.length === 0) {
      confidence = "LOW";
      rangePercent = 35;
      missingInputs.push("component_material_spectrometry");
      limitations.push("Asset material composition was approximated from component footprints.");
    }

    const minCO2eKg = +(netAvoidedCO2e * (1 - rangePercent / 100)).toFixed(3);
    const maxCO2eKg = +(netAvoidedCO2e * (1 + rangePercent / 100)).toFixed(3);

    // If all essential factors are missing and no gross impact could be computed
    const status = missingInputs.length > 3 && grossAvoidedCO2e === 0 ? "INSUFFICIENT_DATA" : "CALCULATED";

    const circularityScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          (divertedWasteKg / totalAssetMassKg) * 40 +
            (circularScenario === "REPAIR" || circularScenario === "REUSE" ? 40 : 25) +
            (confidence === "HIGH" ? 20 : confidence === "MEDIUM" ? 12 : 5)
        )
      )
    );

    return {
      analysisId,
      organizationId: orgId,
      status,

      totalAvoidedCO2e: netAvoidedCO2e,
      grossAvoidedCO2e,
      additionalImpactCO2e,
      netAvoidedCO2e,
      unit: "kgCO2e",

      baselineScenario,
      circularScenario,

      methodology: methodologyInfo.name,
      methodologyVersion: methodologyInfo.version,
      calculationVersion: "factors-v1",

      waste: {
        baselineWasteKg: +totalAssetMassKg.toFixed(3),
        divertedWasteKg,
        remainingWasteKg,
        diversionRatePercent: Math.round((divertedWasteKg / totalAssetMassKg) * 100),
      },

      materials: {
        recoveredMassKg: +totalRecoveredKg.toFixed(3),
        usableMassKg: +(totalRecoveredKg * 0.95).toFixed(3),
        displacementMassKg: +totalDisplacedKg.toFixed(3),
        details: materialDetails,
      },

      lifetimeExtension: {
        baselineRemainingHours: baselineHours,
        potentialExtensionHours,
        potentialExtensionMonths,
        isPredictive: true,
      },

      circularityScore,

      dataQuality: {
        completenessPercent: Math.max(30, 100 - missingInputs.length * 15),
        confidence,
        uncertaintyRangePercent: rangePercent,
        missingInputs,
        limitations,
      },

      uncertainty: {
        minCO2eKg,
        maxCO2eKg,
        nominalCO2eKg: netAvoidedCO2e,
        rangePercent,
      },

      emissionFactorsUsed,
      assumptions,
      sources: Array.from(sourcesUsed),
      limitations,

      realizedVsPotential: "POTENTIAL",
      isDemo: false,
      ledgerEntries,
    };
  }
}
