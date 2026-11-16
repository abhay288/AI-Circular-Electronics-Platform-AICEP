import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { CarbonAggregatorService } from "@/services/carbon/carbonAggregator.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const searchParams = req.nextUrl.searchParams;
    const orgId = searchParams.get("organizationId") || req.headers.get("x-organization-id") || "DEFAULT_ORG";

    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const realizedOnly = searchParams.get("realizedOnly") === "true";

    const summary = await CarbonAggregatorService.getOrganizationSummary(orgId, {
      startDate,
      endDate,
      realizedOnly,
    });

    return successResponse(summary);
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to fetch organization impact summary", 500);
  }
}
