import connectDB from "@/lib/db";
import Component, { IComponent } from "@/models/Component";
import AnalysisSession from "@/models/AnalysisSession";
import RULPrediction from "@/models/RULPrediction";
import MaterialRecovery from "@/models/MaterialRecovery";
import RepairAssessment from "@/models/RepairAssessment";
import DigitalPassport from "@/models/DigitalPassport";
import {
  ListingCondition,
  ListingVerificationStatus,
  IListingHealthSummary,
  IListingRULSummary,
  IListingMaterialSummary,
  IListingRepairSummary,
  IListingPassportSummary,
} from "@/lib/marketplace/marketplaceTaxonomy";

export interface ComponentAssessmentDetails {
  component: IComponent;
  isEligible: boolean;
  ineligibilityReason?: string;
  recommendedCondition: ListingCondition;
  verificationStatus: ListingVerificationStatus;
  warnings: string[];
  healthSummary?: IListingHealthSummary;
  rulSummary?: IListingRULSummary;
  materialSummary?: IListingMaterialSummary;
  repairSummary?: IListingRepairSummary;
  passportSummary?: IListingPassportSummary;
}

export class MarketplaceVerificationService {
  /**
   * Assesses a component's technical provenance and eligibility for marketplace listing.
   */
  async assessComponentForListing(
    analysisId: string,
    componentId: string
  ): Promise<ComponentAssessmentDetails> {
    await connectDB();

    const [component, session, rulDoc, matDoc, repairDoc, passportDoc] =
      await Promise.all([
        Component.findOne({
          analysisId,
          $or: [{ _id: componentId.match(/^[0-9a-fA-F]{24}$/) ? componentId : null }, { serialNumber: componentId }, { name: componentId }],
        }),
        AnalysisSession.findOne({
          $or: [{ analysisId }, { sessionId: analysisId }],
        }),
        RULPrediction.findOne({ analysisId }),
        MaterialRecovery.findOne({ analysisId }),
        RepairAssessment.findOne({ analysisId }),
        DigitalPassport.findOne({ analysisId }),
      ]);

    if (!component) {
      throw new Error(`Component '${componentId}' not found in analysis '${analysisId}'.`);
    }

    const warnings: string[] = [];
    let isEligible = true;
    let ineligibilityReason: string | undefined;

    // 1. Health & Condition Assessment
    const healthScore = component.healthScore ?? 80;
    const conditionStr = (component.condition || "UNKNOWN").toUpperCase();

    let recommendedCondition: ListingCondition = "USED_TESTED";

    if (conditionStr === "FAILED" || healthScore < 30) {
      isEligible = false;
      ineligibilityReason = "Component marked critically degraded or failed.";
      recommendedCondition = "FOR_PARTS";
      warnings.push("High failure probability detected by degradation physics model.");
    } else if (conditionStr === "DEGRADED" || healthScore < 60) {
      recommendedCondition = "FOR_REPAIR";
      warnings.push("Component shows moderate parametric or visual degradation.");
    } else if (conditionStr === "MINT" || healthScore >= 95) {
      recommendedCondition = "USED_TESTED";
    }

    // 2. Repair Intelligence Context (Phase 6)
    let repairSummary: IListingRepairSummary | undefined;
    if (repairDoc) {
      const compRepair = repairDoc.componentAssessments?.find(
        (c: any) => c.componentId === component.serialNumber || c.componentId === component.name
      );
      const executedRec = repairDoc.repairRecommendations?.find(
        (r: any) =>
          (r.componentId === component.serialNumber || r.componentId === component.name) &&
          r.status === "COMPLETED"
      );

      if (executedRec) {
        recommendedCondition = "REFURBISHED";
        repairSummary = {
          repairStatus: "COMPLETED",
          repairability: compRepair?.repairability || "REPAIRABLE",
          completedActionsCount: 1,
          lastAction: executedRec.action,
          functionalTestResult: executedRec.functionalTestResult || "PASS",
          completedAt: executedRec.completedAt,
        };
      } else if (compRepair) {
        repairSummary = {
          repairStatus: "RECOMMENDED",
          repairability: compRepair.repairability,
          completedActionsCount: 0,
          lastAction: compRepair.recommendedAction,
          functionalTestResult: "NOT_PERFORMED",
        };
      }
    }

    // 3. Material Recovery Context (Phase 5)
    let materialSummary: IListingMaterialSummary | undefined;
    if (matDoc) {
      const compMat = matDoc.componentContributions?.find(
        (c: any) => c.componentId === component.serialNumber || c.componentId === component.name
      );
      if (compMat) {
        materialSummary = {
          totalMaterialMassGrams: compMat.estimatedMassGrams,
          primaryRecoverableMetal: compMat.primaryRecoverableMetal,
          recoveryPriority: (compMat.recoveryPriority as any) || "MEDIUM",
          preciousMetals: (compMat.materials || []).map((m: any) => ({
            metal: m.material,
            estimatedMassGrams: m.estimatedMassGrams,
            presence: m.estimatedMassGrams > 0.001 ? "DETECTED_ESTIMATED" : "NOT_DETECTED",
          })),
        };
        if (compMat.recoveryPriority === "HIGH" && healthScore < 50) {
          recommendedCondition = "MATERIAL_RECOVERY";
          warnings.push("Recommended for precious metal recovery rather than circuit reuse.");
        }
      }
    }

    // 4. RUL Prediction Context (Phase 4)
    let rulSummary: IListingRULSummary | undefined;
    if (component.estimatedRUL) {
      rulSummary = {
        estimatedRULHours: component.estimatedRUL.hours,
        estimatedRulYears: component.estimatedRUL.years,
        estimatedRULYears: component.estimatedRUL.years,
        confidence: 0.88,
        isSimulated: session?.sourceType === "SAMPLE",
      };
    }

    // 5. Health Summary
    const healthSummary: IListingHealthSummary = {
      healthScore,
      healthStatus: component.healthStatus || (healthScore >= 80 ? "HEALTHY" : "FAIR"),
      failureRisk: component.failureRisk || (healthScore >= 80 ? "LOW" : "MEDIUM"),
      dataCompleteness: 0.9,
      confidence: 0.88,
      assessedAt: component.updatedAt,
      isSimulated: session?.sourceType === "SAMPLE",
    };

    // 6. Digital Passport Context (Phase 7)
    let verificationStatus: ListingVerificationStatus = "UNVERIFIED";
    let passportSummary: IListingPassportSummary | undefined;

    if (passportDoc) {
      const isAnchored =
        passportDoc.verification?.verificationStatus === "VALID" ||
        passportDoc.blockchainStatus === "CONFIRMED";

      verificationStatus = isAnchored
        ? "PASSPORT_VERIFIED"
        : "PASSPORT_AVAILABLE";

      passportSummary = {
        passportId: passportDoc.passportId,
        version: passportDoc.version,
        verificationStatus: passportDoc.verification?.verificationStatus || "NOT_ANCHORED",
        contentHash: passportDoc.verification?.contentHash,
        blockchainNetwork: passportDoc.blockchain?.network,
        qrCodeUrl: passportDoc.verificationUrl || `/verify/${passportDoc.passportId}`,
      };
    } else if (healthScore > 0) {
      verificationStatus = "TECHNICALLY_ASSESSED";
    }

    if (session?.sourceType === "SAMPLE") {
      verificationStatus = "DEMO";
    }

    return {
      component,
      isEligible,
      ineligibilityReason,
      recommendedCondition,
      verificationStatus,
      warnings,
      healthSummary,
      rulSummary,
      materialSummary,
      repairSummary,
      passportSummary,
    };
  }
}

export const marketplaceVerificationService = new MarketplaceVerificationService();
export default marketplaceVerificationService;
