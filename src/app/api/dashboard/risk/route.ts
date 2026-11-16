import { NextRequest } from "next/server";
import { ExecutiveDashboardService } from "@/services/dashboard/executiveDashboard.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId") || undefined;

    const risks = await ExecutiveDashboardService.getRiskCenter({ organizationId });

    return successResponse({
      count: risks.length,
      risks,
    });
  } catch (error: any) {
    return errorResponse("RISK_CENTER_ERROR", error.message || "Failed to load risk center", 500);
  }
}
