import { NextRequest } from "next/server";
import { ExecutiveDashboardService, TimeRangeFilter } from "@/services/dashboard/executiveDashboard.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timeRange = (searchParams.get("timeRange") || "30_DAYS") as TimeRangeFilter;
    const organizationId = searchParams.get("organizationId") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const [kpis, distributions] = await Promise.all([
      ExecutiveDashboardService.getExecutiveKpis({ timeRange, organizationId, startDate, endDate }),
      ExecutiveDashboardService.getPortfolioDistributions({ timeRange, organizationId, startDate, endDate }),
    ]);

    return successResponse({
      kpis,
      distributions,
      timeRange,
      organizationId: organizationId || "all",
    });
  } catch (error: any) {
    console.error("[Dashboard Summary Error]:", error);
    return errorResponse("DASHBOARD_ERROR", error.message || "Failed to load dashboard summary", 500);
  }
}
