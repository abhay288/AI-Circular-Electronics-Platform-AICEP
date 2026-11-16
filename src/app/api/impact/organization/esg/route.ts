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

    const esgReport = await CarbonAggregatorService.getESGReport(orgId, {
      startDate,
      endDate,
    });

    return successResponse(esgReport);
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to generate ESG report", 500);
  }
}
