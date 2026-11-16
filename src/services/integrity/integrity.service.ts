import { connectDB } from "@/lib/db";
import { AnalysisSession } from "@/models/AnalysisSession";
import { DetectionResult } from "@/models/DetectionResult";
import { PCBAnalysis } from "@/models/PCBAnalysis";
import { RULPrediction } from "@/models/RULPrediction";
import { MaterialRecovery } from "@/models/MaterialRecovery";
import { RepairAssessment } from "@/models/RepairAssessment";
import { DigitalPassport } from "@/models/DigitalPassport";
import { MarketplaceListing } from "@/models/MarketplaceListing";
import { CarbonImpact } from "@/models/CarbonImpact";
import { Report } from "@/models/Report";

export type IntegritySeverity = "ERROR" | "WARNING" | "INFO";

export interface IntegrityIssue {
  code: string;
  severity: IntegritySeverity;
  source: string;
  message: string;
  recommendedAction: string;
}

export interface IntegrityCheckResult {
  analysisId: string;
  status: "CONSISTENT" | "WARNINGS_FOUND" | "INCONSISTENT";
  issues: IntegrityIssue[];
  warnings: string[];
  checkedAt: Date;
}

export class IntegrityService {
  /**
   * Evaluates cross-phase consistency for an analysis session.
   */
  public static async verifyAnalysisIntegrity(analysisId: string): Promise<IntegrityCheckResult> {
    await connectDB();

    const session = await AnalysisSession.findOne({
      $or: [{ analysisId }, { sessionId: analysisId as any }],
    }).lean();

    if (!session) {
      return {
        analysisId,
        status: "INCONSISTENT",
        issues: [
          {
            code: "SESSION_NOT_FOUND",
            severity: "ERROR",
            source: "AnalysisSession",
            message: `No session found matching id '${analysisId}'.`,
            recommendedAction: "Verify the analysisId or create a new session.",
          },
        ],
        warnings: [],
        checkedAt: new Date(),
      };
    }

    const resolvedId = session.analysisId;
    const assetId = (session.metadata as any)?.assetId || resolvedId;

    const [
      detection,
      pcb,
      rul,
      materials,
      repair,
      passport,
      listings,
      carbon,
      reports,
    ] = await Promise.all([
      DetectionResult.findOne({ analysisId: resolvedId }).lean(),
      PCBAnalysis.findOne({ analysisId: resolvedId }).lean(),
      RULPrediction.findOne({ analysisId: resolvedId }).lean(),
      MaterialRecovery.findOne({ analysisId: resolvedId }).lean(),
      RepairAssessment.findOne({ analysisId: resolvedId }).lean(),
      DigitalPassport.findOne({
        $or: [{ analysisId: resolvedId }, { assetId }],
      }).lean(),
      MarketplaceListing.find({
        $or: [{ analysisId: resolvedId }, { componentId: resolvedId }],
      }).lean(),
      CarbonImpact.findOne({ analysisId: resolvedId }).lean(),
      Report.find({ analysisId: resolvedId }).lean(),
    ]);

    const issues: IntegrityIssue[] = [];
    const warnings: string[] = [];

    // 1. Session failure state vs Phase data
    if (session.status === "FAILED" && (rul || detection || materials)) {
      warnings.push("Session is marked FAILED but partial phase records exist in database.");
      issues.push({
        code: "FAILED_SESSION_WITH_DATA",
        severity: "INFO",
        source: "AnalysisSession",
        message: "Analysis marked failed contains persisted artifact records from intermediate stages.",
        recommendedAction: "Review error logs and trigger selective stage retry if applicable.",
      });
    }

    // 2. RUL exists while status failed or 0 components detected
    const detectedCount = (detection as any)?.totalDetected ?? (detection as any)?.components?.length ?? 0;
    if (rul && detection && detectedCount === 0) {
      issues.push({
        code: "RUL_WITHOUT_COMPONENTS",
        severity: "WARNING",
        source: "RULPrediction",
        message: "RUL prediction was generated despite zero components being optically detected.",
        recommendedAction: "Recalibrate YOLO detection or re-run degradation inference.",
      });
    }

    // 3. Passport vs Repair Assessment consistency
    if (passport && repair) {
      const passportEvents = passport.lifecycleEvents || [];
      const hasRepairedEvent = passportEvents.some(
        (e: any) => e.eventType === "REPAIR" || e.eventType === "REFURBISHMENT"
      );
      if (hasRepairedEvent && (repair.recommendedAction === "RECYCLE" || String(repair.recommendedAction).toLowerCase() === "recycle")) {
        issues.push({
          code: "PASSPORT_REPAIR_CONTRADICTS_REPAIR_ASSESSMENT",
          severity: "ERROR",
          source: "DigitalPassport",
          message: "Passport logs show completed repair, but RepairAssessment classified the asset for direct recycling.",
          recommendedAction: "Update RepairAssessment status or audit passport event origin.",
        });
      }
    }

    // 4. Marketplace vs Inventory / Passport status
    if (listings && listings.length > 0) {
      for (const listing of listings) {
        if (listing.status === "SOLD" && passport && passport.status === "RETIRED") {
          issues.push({
            code: "SOLD_LISTING_DECOMMISSIONED_PASSPORT",
            severity: "WARNING",
            source: "MarketplaceListing",
            message: `Marketplace listing ${listing.listingId} is marked SOLD but passport is RETIRED.`,
            recommendedAction: "Verify asset custody transfer or update passport lifecycle status.",
          });
        }
      }
    }

    // 5. Carbon Scope 3 vs Passport Reuse events
    if (carbon && (carbon as any).realizationStatus === "REALIZED") {
      const passportEvents = passport?.lifecycleEvents || [];
      const hasRealizedEvent = passportEvents.some(
        (e: any) => e.eventType === "REUSE" || e.eventType === "REPAIR" || e.eventType === "RESALE"
      );
      if (!hasRealizedEvent) {
        issues.push({
          code: "CARBON_REALIZED_WITHOUT_EVENT",
          severity: "WARNING",
          source: "CarbonImpact",
          message: "CarbonImpact claims realized emissions benefits, but no physical reuse/repair lifecycle event is recorded in DPP.",
          recommendedAction: "Record the verified reuse/repair event in the Digital Product Passport ledger.",
        });
      }
    }

    // 6. Material mass anomalies
    if (materials) {
      const totalMass = materials.boardMass?.estimatedBoardMassGrams || materials.totalEstimatedMaterialMassGrams || 0;
      const recMass = materials.totalRecoverableMaterialMassGrams || 0;
      if (recMass > totalMass && totalMass > 0) {
        issues.push({
          code: "RECOVERABLE_MASS_EXCEEDS_TOTAL",
          severity: "ERROR",
          source: "MaterialRecovery",
          message: `Recoverable mass (${recMass}g) exceeds total board mass (${totalMass}g).`,
          recommendedAction: "Recalculate material recovery yield factors.",
        });
      }
    }

    // 7. Reports status check
    if (reports && reports.length > 0) {
      for (const rep of reports) {
        if (rep.status === "READY" && rep.completeness?.overallPercent === 0) {
          warnings.push(`Report ${rep.reportId} is marked READY but has 0% completeness index.`);
        }
      }
    }

    // Determine final status
    const hasErrors = issues.some((i) => i.severity === "ERROR");
    const hasWarnings = issues.some((i) => i.severity === "WARNING") || warnings.length > 0;

    const status = hasErrors
      ? "INCONSISTENT"
      : hasWarnings
      ? "WARNINGS_FOUND"
      : "CONSISTENT";

    return {
      analysisId: resolvedId,
      status,
      issues,
      warnings,
      checkedAt: new Date(),
    };
  }
}
