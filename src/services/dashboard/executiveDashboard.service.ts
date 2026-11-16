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

export type TimeRangeFilter =
  | "TODAY"
  | "7_DAYS"
  | "30_DAYS"
  | "90_DAYS"
  | "6_MONTHS"
  | "1_YEAR"
  | "ALL";

export interface DashboardFilterOptions {
  timeRange?: TimeRangeFilter;
  startDate?: string;
  endDate?: string;
  organizationId?: string;
  assetType?: string;
  limit?: number;
  page?: number;
  search?: string;
}

export class ExecutiveDashboardService {
  /**
   * Translates time range filter into a MongoDB date query.
   */
  public static getDateFilter(range?: TimeRangeFilter, start?: string, end?: string): { $gte?: Date; $lte?: Date } | null {
    const now = new Date();
    if (start || end) {
      const filter: { $gte?: Date; $lte?: Date } = {};
      if (start) filter.$gte = new Date(start);
      if (end) filter.$lte = new Date(end);
      return filter;
    }

    if (!range || range === "ALL") return null;

    const targetDate = new Date();
    switch (range) {
      case "TODAY":
        targetDate.setHours(0, 0, 0, 0);
        return { $gte: targetDate };
      case "7_DAYS":
        targetDate.setDate(now.getDate() - 7);
        return { $gte: targetDate };
      case "30_DAYS":
        targetDate.setDate(now.getDate() - 30);
        return { $gte: targetDate };
      case "90_DAYS":
        targetDate.setDate(now.getDate() - 90);
        return { $gte: targetDate };
      case "6_MONTHS":
        targetDate.setMonth(now.getMonth() - 6);
        return { $gte: targetDate };
      case "1_YEAR":
        targetDate.setFullYear(now.getFullYear() - 1);
        return { $gte: targetDate };
      default:
        return null;
    }
  }

  /**
   * Retrieves high-level executive KPI cards aggregated from real database records.
   */
  public static async getExecutiveKpis(filters: DashboardFilterOptions = {}) {
    await connectDB();
    const dateQuery = this.getDateFilter(filters.timeRange, filters.startDate, filters.endDate);

    const matchQuery: any = {};
    if (filters.organizationId && filters.organizationId !== "all") {
      matchQuery.organizationId = filters.organizationId;
    }
    if (dateQuery) {
      matchQuery.createdAt = dateQuery;
    }

    // 1. Total Assets Analyzed & Session Metrics
    const sessions = await AnalysisSession.find(matchQuery).select("analysisId").lean();
    const sessionAnalysisIds = sessions.map((s: any) => s.analysisId);

    const childMatchQuery: any = {};
    if (filters.organizationId && filters.organizationId !== "all") {
      childMatchQuery.analysisId = { $in: sessionAnalysisIds };
    }
    if (dateQuery) {
      childMatchQuery.createdAt = dateQuery;
    }

    const [
      totalAssetsAnalyzed,
      detectionDocs,
      repairDocs,
      materialDocs,
      carbonDocs,
      activeMarketplaceListings,
      verifiedPassports,
    ] = await Promise.all([
      AnalysisSession.countDocuments(matchQuery),
      DetectionResult.find(childMatchQuery).select("componentsCount totalDetected").lean(),
      RepairAssessment.find(childMatchQuery).select("recommendedAction circularityStatus").lean(),
      MaterialRecovery.find(childMatchQuery).select("boardMass totalRecoverableMaterialMassGrams totalEstimatedMarketValueUSD").lean(),
      CarbonImpact.find({ ...childMatchQuery, ...(filters.organizationId && filters.organizationId !== "all" ? { organizationId: filters.organizationId } : {}) }).select("totalAvoidedCO2e waste").lean(),
      MarketplaceListing.countDocuments({
        ...(filters.organizationId && filters.organizationId !== "all" ? { sellerOrganizationId: filters.organizationId } : {}),
        status: { $in: ["PUBLISHED", "ACTIVE"] },
        ...(dateQuery ? { createdAt: dateQuery } : {}),
      }),
      DigitalPassport.countDocuments({
        ...(filters.organizationId && filters.organizationId !== "all" ? { organizationId: filters.organizationId } : {}),
        $or: [{ verificationStatus: "VALID" }, { status: "ACTIVE" }],
        ...(dateQuery ? { createdAt: dateQuery } : {}),
      }),
    ]);

    // Components Detected count
    const componentsDetected = detectionDocs.reduce(
      (sum, d: any) => sum + (d.componentsCount || d.totalDetected || 0),
      0
    );

    // Repair Actions count
    let assetsRepaired = 0;
    let assetsReused = 0;
    let assetsRefurbished = 0;

    for (const r of repairDocs) {
      const act = (r.recommendedAction || "").toLowerCase();
      if (act.includes("repair")) assetsRepaired++;
      if (act.includes("reuse")) assetsReused++;
      if (act.includes("refurbish")) assetsRefurbished++;
    }

    // Materials & Waste
    const materialsRecoveredKg = materialDocs.reduce((sum, m: any) => {
      const g = m.boardMass?.recoverableMassGrams || m.totalRecoverableMaterialMassGrams || 0;
      return sum + g / 1000;
    }, 0);

    const wasteDivertedKg = carbonDocs.reduce((sum, c: any) => {
      return sum + (c.waste?.divertedWasteKg || 0);
    }, 0);

    const estimatedCO2eAvoidedKg = carbonDocs.reduce((sum, c: any) => {
      return sum + (c.totalAvoidedCO2e || 0);
    }, 0);

    return {
      totalAssetsAnalyzed,
      componentsDetected,
      assetsRepaired,
      assetsReused,
      assetsRefurbished,
      materialsRecoveredKg: Math.round(materialsRecoveredKg * 100) / 100,
      wasteDivertedKg: Math.round(wasteDivertedKg * 100) / 100,
      estimatedCO2eAvoidedKg: Math.round(estimatedCO2eAvoidedKg * 100) / 100,
      activeMarketplaceListings,
      verifiedPassports,
    };
  }

  /**
   * Retrieves Portfolio Health & RUL Distribution.
   */
  public static async getPortfolioDistributions(filters: DashboardFilterOptions = {}) {
    await connectDB();
    const dateQuery = this.getDateFilter(filters.timeRange, filters.startDate, filters.endDate);

    const matchQuery: any = {};
    if (filters.organizationId && filters.organizationId !== "all") {
      matchQuery.organizationId = filters.organizationId;
    }
    if (dateQuery) {
      matchQuery.createdAt = dateQuery;
    }

    const sessions = await AnalysisSession.find(matchQuery).select("analysisId").lean();
    const sessionAnalysisIds = sessions.map((s: any) => s.analysisId);

    const childMatchQuery: any = {};
    if (filters.organizationId && filters.organizationId !== "all") {
      childMatchQuery.analysisId = { $in: sessionAnalysisIds };
    }
    if (dateQuery) {
      childMatchQuery.createdAt = dateQuery;
    }

    const rulPredictions = await RULPrediction.find(childMatchQuery)
      .select("healthScore overallHealthScore rulYears predictedRULYears predictedYears healthStatus")
      .lean();

    const healthDist = {
      Healthy: 0,
      Good: 0,
      Fair: 0,
      Degraded: 0,
      Critical: 0,
      Unknown: 0,
    };

    const rulDist = {
      under6Months: 0,
      sixTo12Months: 0,
      oneTo3Years: 0,
      threeTo5Years: 0,
      over5Years: 0,
      unknown: 0,
    };

    for (const p of rulPredictions as any[]) {
      const score = p.healthScore ?? p.overallHealthScore;
      if (score === undefined || score === null) {
        healthDist.Unknown++;
      } else if (score >= 80) {
        healthDist.Healthy++;
      } else if (score >= 65) {
        healthDist.Good++;
      } else if (score >= 50) {
        healthDist.Fair++;
      } else if (score >= 35) {
        healthDist.Degraded++;
      } else {
        healthDist.Critical++;
      }

      const years = p.rulYears ?? p.predictedRULYears ?? p.predictedYears;
      if (years === undefined || years === null) {
        rulDist.unknown++;
      } else if (years < 0.5) {
        rulDist.under6Months++;
      } else if (years < 1.0) {
        rulDist.sixTo12Months++;
      } else if (years < 3.0) {
        rulDist.oneTo3Years++;
      } else if (years < 5.0) {
        rulDist.threeTo5Years++;
      } else {
        rulDist.over5Years++;
      }
    }

    return {
      healthDistribution: healthDist,
      rulDistribution: rulDist,
      totalAssessed: rulPredictions.length,
    };
  }

  /**
   * Retrieves Risk Center items across all active assets.
   */
  public static async getRiskCenter(filters: DashboardFilterOptions = {}) {
    await connectDB();
    const matchQuery: any = {};
    if (filters.organizationId && filters.organizationId !== "all") {
      matchQuery.organizationId = filters.organizationId;
    }

    const sessions = await AnalysisSession.find(matchQuery).select("analysisId").lean();
    const sessionAnalysisIds = sessions.map((s: any) => s.analysisId);

    const childMatchQuery: any = {};
    if (filters.organizationId && filters.organizationId !== "all") {
      childMatchQuery.analysisId = { $in: sessionAnalysisIds };
    }

    const [lowRulAssets, pcbDefects, criticalRepairs] = await Promise.all([
      RULPrediction.find({
        ...childMatchQuery,
        $or: [
          { healthScore: { $lt: 45 } },
          { overallHealthScore: { $lt: 45 } },
          { rulYears: { $lt: 1 } },
          { predictedRULYears: { $lt: 1 } },
        ],
      })
        .limit(10)
        .lean(),
      PCBAnalysis.find({
        ...childMatchQuery,
        "damagedRegions.0": { $exists: true },
      })
        .limit(10)
        .lean(),
      RepairAssessment.find({
        ...childMatchQuery,
        recommendedAction: { $in: ["REPAIR", "repair", "HARVEST", "harvest", "RECYCLE", "recycle"] },
      })
        .limit(10)
        .lean(),
    ]);

    const risks = [
      ...lowRulAssets.map((r: any) => {
        const hScore = r.healthScore ?? r.overallHealthScore ?? 35;
        const predYears = r.rulYears ?? r.predictedRULYears ?? r.predictedYears ?? "<1";
        return {
          id: `risk-rul-${r.analysisId}`,
          analysisId: r.analysisId,
          type: "LOW_RUL_HEALTH",
          severity: hScore < 30 ? "CRITICAL" : "HIGH",
          title: `Low Health Score (${hScore}/100)`,
          description: `Predicted remaining useful life: ${predYears} years. Action required.`,
          actionLabel: "Inspect Health",
        };
      }),
      ...pcbDefects.map((p: any) => ({
        id: `risk-pcb-${p.analysisId}`,
        analysisId: p.analysisId,
        type: "PCB_DEFECTS",
        severity: "HIGH",
        title: `Structural PCB Defects (${p.damagedRegions?.length || 1} identified)`,
        description: `Surface anomaly or broken trace integrity: score ${p.reconstruction?.visualIntegrityEstimate || "unknown"}/100.`,
        actionLabel: "View PCB",
      })),
      ...criticalRepairs.map((c: any) => ({
        id: `risk-rep-${c.analysisId}`,
        analysisId: c.analysisId,
        type: "REPAIR_CANDIDATE",
        severity: "MEDIUM",
        title: `Circularity Action: ${c.recommendedAction?.toUpperCase()}`,
        description: `Assessment repairability score: ${c.feasibilityIndexPercent || c.decisionScore || "N/A"}.`,
        actionLabel: "Open Repair Plan",
      })),
    ];

    return risks;
  }

  /**
   * Retrieves paginated Asset Portfolio list.
   */
  public static async getAssetPortfolio(filters: DashboardFilterOptions = {}) {
    await connectDB();
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 20));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (filters.organizationId && filters.organizationId !== "all") {
      query.organizationId = filters.organizationId;
    }
    if (filters.search) {
      query.$or = [
        { deviceName: { $regex: filters.search, $options: "i" } },
        { assetId: { $regex: filters.search, $options: "i" } },
        { analysisId: { $regex: filters.search, $options: "i" } },
      ];
    }
    const dateQuery = this.getDateFilter(filters.timeRange, filters.startDate, filters.endDate);
    if (dateQuery) {
      query.createdAt = dateQuery;
    }

    const [total, sessions] = await Promise.all([
      AnalysisSession.countDocuments(query),
      AnalysisSession.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const items = sessions.map((s: any) => ({
      analysisId: s.analysisId,
      assetId: s.assetId || (s.metadata as any)?.assetId || s.analysisId,
      deviceName: s.deviceName,
      status: s.status,
      healthScore: s.rulResult?.overallHealthScore ?? s.rulResult?.healthScore ?? null,
      predictedRULYears: s.rulResult?.predictedYears ?? s.rulResult?.rulYears ?? null,
      recommendedAction: s.repairResult?.recommendedAction ?? null,
      recoverableUSD: s.metalResult?.totalEstimatedMarketValueUSD ?? 0,
      passportId: s.passportId ?? null,
      reportId: s.reportId ?? null,
      isDemo: Boolean(s.isSynthetic || s.isSample || s.mode === "DEMO" || s.sourceType === "SAMPLE"),
      createdAt: s.createdAt,
    }));

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrevious: page > 1,
      },
    };
  }
}
