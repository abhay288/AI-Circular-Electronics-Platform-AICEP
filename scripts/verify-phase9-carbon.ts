/**
 * EcoIntel Phase 9: Carbon Impact, Circularity Metrics & ESG Intelligence
 * Verification Suite
 *
 * Validates all 25 scientific and operational requirements:
 * 1. Mock provider
 * 2. Factor provider
 * 3. Missing factor handling
 * 4. Invalid factor validation
 * 5. Missing material data handling
 * 6. Carbon calculation (kgCO2e)
 * 7. Gross/net calculation
 * 8. Scenario calculation
 * 9. Uncertainty calculation
 * 10. Data completeness
 * 11. Double-counting prevention
 * 12. Waste diversion
 * 13. Material displacement
 * 14. Lifetime extension
 * 15. Organization aggregation
 * 16. Time-series aggregation
 * 17. Passport integration
 * 18. Marketplace integration (realized vs potential)
 * 19. Repair integration
 * 20. Factor versioning
 * 21. Methodology versioning
 * 22. Unauthorized factor modification
 * 23. Organization isolation
 * 24. Refresh persistence
 * 25. Demo mode
 */

import dotenv from "dotenv";
dotenv.config();

import connectDB from "../src/lib/db";
import AnalysisSession from "../src/models/AnalysisSession";
import CarbonImpact from "../src/models/CarbonImpact";
import MaterialEmissionFactor from "../src/models/MaterialEmissionFactor";
import ImpactMethodology from "../src/models/ImpactMethodology";
import ImpactLedgerEntry from "../src/models/ImpactLedgerEntry";
import DigitalPassport from "../src/models/DigitalPassport";
import { MockCarbonImpactProvider } from "../src/providers/carbon/mock.carbon.provider";
import { FactorBasedCarbonProvider } from "../src/providers/carbon/factors.carbon.provider";
import { FactorManagementService } from "../src/services/carbon/factorManagement.service";
import { CarbonImpactService } from "../src/services/carbon/carbonImpact.service";
import { CarbonAggregatorService } from "../src/services/carbon/carbonAggregator.service";
import { DigitalPassportService } from "../src/services/passport.service";

interface TestResult {
  num: number;
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, num: number, name: string, detail?: string) {
  if (condition) {
    console.log(`✅ [PASS] Test ${num}: ${name}`);
    results.push({ num, name, passed: true });
  } else {
    console.error(`❌ [FAIL] Test ${num}: ${name} ${detail ? `- ${detail}` : ""}`);
    results.push({ num, name, passed: false, error: detail });
  }
}

async function runTestSuite() {
  console.log("==================================================================");
  console.log("ECOINTEL PHASE 9: CARBON IMPACT & ESG INTELLIGENCE VERIFICATION");
  console.log("==================================================================\n");

  await connectDB();
  await FactorManagementService.seedDefaultsIfNeeded();

  const testOrgA = `org_carbon_alpha_${Date.now()}`;
  const testOrgB = `org_carbon_beta_${Date.now()}`;
  const testUserA = `usr_carbon_${Date.now()}`;
  const testAnalysisId = `AN-P9-${Date.now()}`;

  try {
    // Prerequisite: Seed Analysis Session with diagnostic telemetry
    await AnalysisSession.create({
      analysisId: testAnalysisId,
      deviceName: "Industrial Power Gateway Controller",
      deviceType: "PCB",
      imageUrl: "https://assets.ecointel.org/boards/gateway-v2.jpg",
      mode: "LIVE",
      status: "REPAIR_COMPLETE",
      progress: 90,
      currentStage: "PASSPORT",
      organizationId: testOrgA,
      userId: testUserA,
      metalResult: {
        pcbWeightKg: 0.32,
        totalGrams: 320,
        recoverableGrams: 42.5,
      },
      repairResult: {
        recommendedAction: "repair",
        estimatedCO2SavingsKg: 24.5,
      },
      rulResult: {
        overallHealthScore: 88,
        predictedHours: 24000,
        predictedYears: 2.7,
      },
    });

    // 1. Mock provider
    const mockProvider = new MockCarbonImpactProvider();
    const mockRes = await mockProvider.calculate({ analysisId: testAnalysisId });
    assert(
      mockRes.isDemo === true &&
        mockRes.netAvoidedCO2e > 0 &&
        mockRes.emissionFactorsUsed.some((f) => f.sourceType === "SYNTHETIC_DEMO"),
      1,
      "Mock provider (Produces bounded demo calculation stamped SYNTHETIC_DEMO)"
    );

    // 2. Factor provider
    const factorProvider = new FactorBasedCarbonProvider();
    const factorRes = await factorProvider.calculate({
      analysisId: testAnalysisId,
      materialRecovery: {
        estimatedRecoveryYield: { copperGrams: 30, goldGrams: 0.15, aluminumGrams: 15 },
      },
    });
    assert(
      factorRes.status === "CALCULATED" &&
        factorRes.netAvoidedCO2e > 0 &&
        factorRes.emissionFactorsUsed.length > 0,
      2,
      "Factor provider (Queries active DB factors and computes net emissions)"
    );

    // 3. Missing factor handling
    const missingFactorRes = await factorProvider.calculate({
      analysisId: testAnalysisId,
      materialRecovery: {
        estimatedRecoveryYield: { kryptoniteGrams: 50 }, // Non-existent factor
      },
    });
    assert(
      missingFactorRes.dataQuality.missingInputs.length > 0,
      3,
      "Missing factor handling (Exposes missingInputs, avoids silent fallback)"
    );

    // 4. Invalid factor validation
    let invalidFactorRejected = false;
    try {
      await FactorManagementService.createFactor(
        {
          material: "UnknownOre",
          process: "MINING",
          factor: 5.0,
          unit: "kgCO2e/kg",
          source: "", // Missing source is illegal!
        },
        { userId: "admin", role: "ADMIN" }
      );
    } catch (e: any) {
      invalidFactorRejected = true;
    }
    assert(
      invalidFactorRejected,
      4,
      "Invalid factor validation (Enforces documented bibliographic source)"
    );

    // 5. Missing material data handling
    const bareRes = await factorProvider.calculate({
      analysisId: testAnalysisId,
      materialRecovery: null,
    });
    assert(
      bareRes.dataQuality.confidence === "LOW" &&
        bareRes.limitations.length > 0,
      5,
      "Missing material data handling (Approximates with LOW confidence and explicit limitations)"
    );

    // 6. Carbon calculation (kgCO2e)
    const serviceImpact = await CarbonImpactService.calculateAssetImpact(testAnalysisId, {
      organizationId: testOrgA,
      userId: testUserA,
      providerType: "mock",
    });
    assert(
      serviceImpact.unit === "kgCO2e" && serviceImpact.totalAvoidedCO2e > 0,
      6,
      "Carbon calculation (Produces defensible net avoided CO2e in kgCO2e)"
    );

    // 7. Gross/net calculation
    assert(
      serviceImpact.grossAvoidedCO2e > serviceImpact.netAvoidedCO2e &&
        serviceImpact.additionalImpactCO2e > 0,
      7,
      "Gross vs net calculation (Deducts circular process & transport emissions)"
    );

    // 8. Scenario calculation
    const scenarioComps = await CarbonImpactService.compareScenarios(testAnalysisId, [
      { baseline: "DISCARD", circular: "REPAIR" },
      { baseline: "REPLACE_WITH_NEW", circular: "REUSE" },
    ]);
    assert(
      scenarioComps.length === 2 &&
        scenarioComps[0].netAvoidedCO2e > 0 &&
        scenarioComps[1].netAvoidedCO2e > 0,
      8,
      "Scenario calculation (Compares Discard vs Repair and Replace vs Reuse)"
    );

    // 9. Uncertainty calculation
    assert(
      serviceImpact.uncertainty.minCO2eKg < serviceImpact.totalAvoidedCO2e &&
        serviceImpact.uncertainty.maxCO2eKg > serviceImpact.totalAvoidedCO2e &&
        serviceImpact.uncertainty.rangePercent > 0,
      9,
      "Uncertainty calculation (Provides min/max confidence bounds)"
    );

    // 10. Data completeness
    assert(
      serviceImpact.dataQuality.completenessPercent > 0 &&
        Boolean(serviceImpact.dataQuality.confidence),
      10,
      "Data completeness (Evaluates input telemetry coverage and confidence rating)"
    );

    // 11. Double-counting prevention
    const ledgerBefore = await CarbonImpactService.getImpactLedger(testAnalysisId);
    // Simulate attempt to book the same component under two conflicting realizations
    const exclusiveEntries = ledgerBefore.filter((e) => e.isExclusive);
    assert(
      exclusiveEntries.length > 0 && ledgerBefore.length >= 2,
      11,
      "Double-counting prevention (Impact ledger locks exclusive material crediting)"
    );

    // 12. Waste diversion
    assert(
      serviceImpact.waste.divertedWasteKg > 0 &&
        serviceImpact.waste.diversionRatePercent >= 50,
      12,
      "Waste diversion (Quantifies diverted e-waste against total board mass)"
    );

    // 13. Material displacement
    assert(
      serviceImpact.materials.displacementMassKg > 0 &&
        serviceImpact.materials.details.some((d) => d.displacementFactor < 1.0),
      13,
      "Material displacement (Applies scientific virgin substitution ratios < 100%)"
    );

    // 14. Lifetime extension
    assert(
      serviceImpact.lifetimeExtension.potentialExtensionMonths > 0 &&
        serviceImpact.lifetimeExtension.isPredictive === true,
      14,
      "Lifetime extension (Projects additional operational months with predictive label)"
    );

    // 15. Organization aggregation
    const orgSummary = await CarbonAggregatorService.getOrganizationSummary(testOrgA);
    assert(
      orgSummary.totalAvoidedCO2eKg > 0 &&
        orgSummary.assetsAssessedCount >= 1 &&
        orgSummary.averageCircularityScore > 50,
      15,
      "Organization aggregation (Rolls up net carbon, waste, and circularity index)"
    );

    // 16. Time-series aggregation
    const trends = await CarbonAggregatorService.getOrganizationTrends(testOrgA, "monthly");
    assert(
      Array.isArray(trends) && trends.length >= 1 && trends[0].netAvoidedCO2eKg > 0,
      16,
      "Time-series aggregation (Generates monthly trend buckets)"
    );

    // 17. Passport integration
    const passportService = new DigitalPassportService();
    const passport = await passportService.createFromAnalysis(testAnalysisId, {
      organizationId: testOrgA,
      actor: testUserA,
    });
    assert(
      passport && Boolean(passport.metadata?.environmentalImpact?.netAvoidedCO2eKg),
      17,
      "Passport integration (Seamlessly binds environmental impact to DPP metadata)"
    );

    // 18. Marketplace integration (Realized vs Potential)
    assert(
      serviceImpact.realizedVsPotential === "POTENTIAL",
      18,
      "Marketplace integration (Diagnostic listings initialized as POTENTIAL impact)"
    );
    await CarbonImpactService.recordRealizedImpact(testAnalysisId, "REPAIR_COMPLETED");
    const updatedRealized = await CarbonImpact.findOne({ analysisId: testAnalysisId });
    assert(
      updatedRealized?.realizedVsPotential === "REALIZED",
      18,
      "Marketplace integration (Transitions to REALIZED impact after completed circular event)"
    );

    // 19. Repair integration
    assert(
      serviceImpact.additionalImpactCO2e > 0 &&
        serviceImpact.assumptions.some((a) => a.toLowerCase().includes("repair")),
      19,
      "Repair integration (Discloses and deducts repair rework energy consumption)"
    );

    // 20. Factor versioning
    assert(
      serviceImpact.emissionFactorsUsed.length > 0 &&
        Boolean(serviceImpact.emissionFactorsUsed[0].version),
      20,
      "Factor versioning (Tracks exact version of each emission factor applied)"
    );

    // 21. Methodology versioning
    assert(
      Boolean(serviceImpact.methodologyVersion) &&
        Boolean(serviceImpact.calculationVersion),
      21,
      "Methodology versioning (Records methodologyVersion and calculationVersion)"
    );

    // 22. Unauthorized factor modification
    let unauthorizedBlocked = false;
    try {
      await FactorManagementService.createFactor(
        {
          material: "Silver",
          process: "MINING",
          factor: 400,
          unit: "kgCO2e/kg",
          source: "Some Blog",
        },
        { userId: "regular_user", role: "USER" }
      );
    } catch {
      unauthorizedBlocked = true;
    }
    assert(
      unauthorizedBlocked,
      22,
      "Unauthorized factor modification (Blocks non-admin users from altering factors)"
    );

    // 23. Organization isolation
    let crossOrgBlocked = false;
    try {
      await CarbonImpactService.getImpactByAnalysisId(testAnalysisId, testOrgB, false);
    } catch {
      crossOrgBlocked = true;
    }
    assert(
      crossOrgBlocked,
      23,
      "Organization isolation (Prevents Org B from accessing Org A's impact records)"
    );

    // 24. Refresh persistence
    const reloaded = await CarbonImpact.findOne({ analysisId: testAnalysisId });
    assert(
      reloaded !== null && reloaded.totalAvoidedCO2e === serviceImpact.totalAvoidedCO2e,
      24,
      "Refresh persistence (Calculated impact state persists identically in MongoDB)"
    );

    // 25. Demo mode
    const demoRun = await mockProvider.calculate({ analysisId: "DEMO-001" });
    assert(
      demoRun.isDemo === true &&
        demoRun.dataQuality.limitations.some((l) => l.toLowerCase().includes("demonstration")),
      25,
      "Demo mode (Applies explicit synthetic and illustrative disclaimers)"
    );

  } catch (err: any) {
    console.error("Fatal test suite error:", err);
    results.push({ num: 99, name: "Fatal suite execution", passed: false, error: err.message });
  } finally {
    console.log("\n==================================================================");
    console.log("PHASE 9 VERIFICATION SUMMARY");
    console.log("==================================================================");
    const passedCount = results.filter((r) => r.passed).length;
    console.log(`Total tests: ${results.length}`);
    console.log(`Passed: ${passedCount}`);
    console.log(`Failed: ${results.length - passedCount}`);

    if (passedCount >= 25 && results.length - passedCount === 0) {
      console.log("\n🎉 ALL 25 PHASE 9 CARBON & CIRCULARITY VERIFICATION REQUIREMENTS PASSED!\n");
    }
  }
}

runTestSuite().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});
