import { NextRequest } from "next/server";
import { ExecutiveDashboardService, TimeRangeFilter } from "@/services/dashboard/executiveDashboard.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timeRange = (searchParams.get("timeRange") || "ALL") as TimeRangeFilter;
    const organizationId = searchParams.get("organizationId") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || undefined;

    const portfolio = await ExecutiveDashboardService.getAssetPortfolio({
      timeRange,
      organizationId,
      page,
      limit,
      search,
    });

    return successResponse(portfolio);
  } catch (error: any) {
    return errorResponse("PORTFOLIO_ERROR", error.message || "Failed to load asset portfolio", 500);
  }
}
