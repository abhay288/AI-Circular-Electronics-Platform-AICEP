import connectDB from "@/lib/db";
import CarbonImpact, { ICarbonImpact } from "@/models/CarbonImpact";
import AnalysisSession from "@/models/AnalysisSession";
import MaterialRecovery from "@/models/MaterialRecovery";
import RepairAssessment from "@/models/RepairAssessment";
import RULPrediction from "@/models/RULPrediction";
import Component from "@/models/Component";
import ImpactLedgerEntry, { IImpactLedgerEntry } from "@/models/ImpactLedgerEntry";
import AuditLog from "@/models/AuditLog";
import { getCarbonImpactProvider } from "@/providers/carbon/carbon.provider";
import { FactorManagementService } from "./factorManagement.service";
import { BaselineScenario, CircularScenario, ScenarioImpactResult } from "@/lib/carbon/carbonTaxonomy";

export interface CalculateImpactOptions {
  organizationId?: string;
  userId?: string;
  baselineScenario?: BaselineScenario;
  circularScenario?: CircularScenario;
  transportDistanceKm?: number;
  providerType?: string; // "mock" | "factors"
  isSimulation?: boolean;
}

export class CarbonImpactService {
  /**
   * Calculates or recalculates asset impact and stores auditable ledger entries.
   */
  public static async calculateAssetImpact(
    analysisId: string,
    options: CalculateImpactOptions = {}
  ): Promise<ICarbonImpact> {
    await connectDB();
    await FactorManagementService.seedDefaultsIfNeeded();

    const session = await AnalysisSession.findOne({
      $or: [{ analysisId }, { sessionId: analysisId }],
    });

    if (!session) {
      throw new Error(`AnalysisSession '${analysisId}' not found.`);
    }

    const orgId = options.organizationId || session.organizationId?.toString();

    // Organization Isolation Check
    if (
      options.organizationId &&
      session.organizationId &&
      options.organizationId !== session.organizationId.toString()
    ) {
      throw new Error("Forbidden: Cannot calculate impact for an asset belonging to another organization.");
    }

    // Load related diagnostic results
    const [matDoc, repDoc, rulDoc, components] = await Promise.all([
      MaterialRecovery.findOne({ analysisId: session.analysisId }),
      RepairAssessment.findOne({ analysisId: session.analysisId }),
      RULPrediction.findOne({ analysisId: session.analysisId }),
      Component.find({ analysisId: session.analysisId }),
    ]);

    const provider = getCarbonImpactProvider(options.providerType);

    // Compute board mass estimate if not provided
    const estimatedBoardMassGrams =
      session.metalResult?.pcbWeightKg ? session.metalResult.pcbWeightKg * 1000 : 250;

    const calcResult = await provider.calculate({
      analysisId: session.analysisId,
      organizationId: orgId,
      assetType: "PCB",
      assetMassGrams: estimatedBoardMassGrams,
      materialRecovery: matDoc || session.metalResult,
      repairAssessment: repDoc || session.repairResult,
      rulPrediction: rulDoc || session.rulResult,
      baselineScenario: options.baselineScenario || "DISCARD",
      circularScenario: options.circularScenario || "REPAIR",
      transportDistanceKm: options.transportDistanceKm || 50,
    });

    // Check existing document to preserve calculation version
    const existing = await CarbonImpact.findOne({ analysisId: session.analysisId });
    const versionNum = existing ? (parseInt(existing.calculationVersion.replace(/\D/g, "") || "1", 10) + 1) : 1;
    const calcVersion = `carbon-v${versionNum}`;

    const impactDoc = await CarbonImpact.findOneAndUpdate(
      { analysisId: session.analysisId },
      {
        analysisId: session.analysisId,
        organizationId: orgId,
        status: calcResult.status,

        totalAvoidedCO2e: calcResult.totalAvoidedCO2e,
        grossAvoidedCO2e: calcResult.grossAvoidedCO2e,
        additionalImpactCO2e: calcResult.additionalImpactCO2e,
        netAvoidedCO2e: calcResult.netAvoidedCO2e,
        unit: calcResult.unit,

        baselineScenario: calcResult.baselineScenario,
        circularScenario: calcResult.circularScenario,

        methodology: calcResult.methodology,
        methodologyVersion: calcResult.methodologyVersion,
        calculationVersion: calcVersion,

        waste: calcResult.waste,
        materials: calcResult.materials,
        lifetimeExtension: calcResult.lifetimeExtension,
        circularityScore: calcResult.circularityScore,

        dataQuality: calcResult.dataQuality,
        uncertainty: calcResult.uncertainty,

        emissionFactorsUsed: calcResult.emissionFactorsUsed,
        assumptions: calcResult.assumptions,
        sources: calcResult.sources,
        limitations: calcResult.limitations,

        realizedVsPotential: calcResult.realizedVsPotential,
        isDemo: calcResult.isDemo,

        // Backward compatibility
        co2AvoidedKg: calcResult.netAvoidedCO2e,
        energySavedKWh: Math.round(calcResult.netAvoidedCO2e * 18.5),
        waterSavedLiters: Math.round(calcResult.netAvoidedCO2e * 82),
        ewasteDivertedKg: calcResult.waste.divertedWasteKg,
        circularityScorePercent: calcResult.circularityScore,
      },
      { upsert: true, new: true }
    );

    // Record impact ledger entries with double-counting protection
    if (!options.isSimulation && calcResult.ledgerEntries.length > 0) {
      // Clear previous potential entries for this analysis & scenario to avoid duplicating on re-runs
      await ImpactLedgerEntry.deleteMany({
        analysisId: session.analysisId,
        scenario: calcResult.circularScenario,
        status: "POTENTIAL",
      });

      for (const entry of calcResult.ledgerEntries) {
        // Double-counting verification: check if this source is already locked under an exclusive realization
        const existingLocked = await ImpactLedgerEntry.findOne({
          analysisId: session.analysisId,
          sourceId: entry.sourceId,
          isExclusive: true,
          status: "REALIZED",
        });

        if (existingLocked) {
          console.warn(`[CarbonImpactService] Double-counting prevented: ${entry.sourceId} already counted under REALIZED impact.`);
          continue;
        }

        await ImpactLedgerEntry.create({
          entryId: `LEDG-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          analysisId: session.analysisId,
          organizationId: orgId,
          sourceType: entry.sourceType,
          sourceId: entry.sourceId,
          impactType: entry.impactType,
          quantity: entry.quantity,
          unit: entry.unit,
          factor: entry.factor,
          factorUnit: entry.factorUnit,
          impactValue: entry.impactValue,
          methodology: entry.methodology,
          scenario: entry.scenario,
          status: "POTENTIAL",
          isExclusive: entry.isExclusive,
        });
      }
    }

    // Link into session
    session.carbonImpactId = impactDoc._id;
    session.markModified("carbonImpactId");
    await session.save();

    return impactDoc;
  }

  /**
   * Retrieves carbon impact for an asset with organization isolation check
   */
  public static async getImpactByAnalysisId(
    analysisId: string,
    requestingOrgId?: string,
    isAdmin = false
  ): Promise<ICarbonImpact | null> {
    await connectDB();

    const doc = await CarbonImpact.findOne({ analysisId });
    if (!doc) return null;

    if (!isAdmin && requestingOrgId && doc.organizationId && doc.organizationId !== requestingOrgId) {
      throw new Error("Forbidden: You do not have access to this organization's impact assessment.");
    }

    return doc;
  }

  /**
   * Simulates what-if scenarios (e.g. Discard vs Repair, Replace vs Reuse) without mutating persisted record.
   */
  public static async compareScenarios(
    analysisId: string,
    scenarios: Array<{ baseline: BaselineScenario; circular: CircularScenario }>
  ): Promise<ScenarioImpactResult[]> {
    await connectDB();

    const session = await AnalysisSession.findOne({
      $or: [{ analysisId }, { sessionId: analysisId }],
    });

    if (!session) {
      throw new Error(`AnalysisSession '${analysisId}' not found.`);
    }

    const [matDoc, repDoc, rulDoc] = await Promise.all([
      MaterialRecovery.findOne({ analysisId: session.analysisId }),
      RepairAssessment.findOne({ analysisId: session.analysisId }),
      RULPrediction.findOne({ analysisId: session.analysisId }),
    ]);

    const provider = getCarbonImpactProvider();
    const results: ScenarioImpactResult[] = [];

    for (let i = 0; i < scenarios.length; i++) {
      const { baseline, circular } = scenarios[i];
      const outcome = await provider.calculate({
        analysisId: session.analysisId,
        assetType: "PCB",
        materialRecovery: matDoc || session.metalResult,
        repairAssessment: repDoc || session.repairResult,
        rulPrediction: rulDoc || session.rulResult,
        baselineScenario: baseline,
        circularScenario: circular,
      });

      results.push({
        scenarioId: `SCENARIO-${i + 1}`,
        name: `${baseline} vs ${circular}`,
        description: `Comparative model projecting avoided impacts if ${circular.toLowerCase()} is chosen over ${baseline.toLowerCase()}.`,
        baselineScenario: baseline,
        circularScenario: circular,
        grossAvoidedCO2e: outcome.grossAvoidedCO2e,
        additionalCO2e: outcome.additionalImpactCO2e,
        netAvoidedCO2e: outcome.netAvoidedCO2e,
        wasteAvoidedKg: outcome.waste.divertedWasteKg,
        materialDisplacedKg: outcome.materials.displacementMassKg,
        lifetimeExtensionMonths: outcome.lifetimeExtension.potentialExtensionMonths,
        assumptions: outcome.assumptions,
        confidence: outcome.dataQuality.confidence,
      });
    }

    return results;
  }

  /**
   * Retrieves the auditable impact accounting ledger for an asset
   */
  public static async getImpactLedger(
    analysisId: string,
    requestingOrgId?: string,
    isAdmin = false
  ): Promise<IImpactLedgerEntry[]> {
    await connectDB();

    if (!isAdmin && requestingOrgId) {
      const session = await AnalysisSession.findOne({
        $or: [{ analysisId }, { sessionId: analysisId }],
      });
      if (session?.organizationId && session.organizationId.toString() !== requestingOrgId) {
        throw new Error("Forbidden: You do not have permission to view this ledger.");
      }
    }

    return await ImpactLedgerEntry.find({ analysisId }).sort({ createdAt: -1 });
  }

  /**
   * Converts POTENTIAL ledger entries into REALIZED impact when a circular milestone occurs (e.g. repair or sale)
   */
  public static async recordRealizedImpact(
    analysisId: string,
    eventType: "REPAIR_COMPLETED" | "COMPONENT_REUSED" | "SOLD_ON_MARKETPLACE",
    metadata?: Record<string, any>
  ): Promise<void> {
    await connectDB();

    const scenario = eventType === "REPAIR_COMPLETED" ? "REPAIR" : "REUSE";

    await ImpactLedgerEntry.updateMany(
      { analysisId, scenario, status: "POTENTIAL" },
      { $set: { status: "REALIZED", metadata: { ...metadata, realizedAt: new Date() } } }
    );

    await CarbonImpact.updateOne(
      { analysisId },
      { $set: { realizedVsPotential: "REALIZED" } }
    );
  }
}
