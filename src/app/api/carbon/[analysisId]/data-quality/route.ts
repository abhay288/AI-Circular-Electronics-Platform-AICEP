import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { CarbonImpactService } from "@/services/carbon/carbonImpact.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    await connectDB();
    const { analysisId } = await params;
    const orgId = req.headers.get("x-organization-id") || undefined;
    const userRole = req.headers.get("x-user-role") || "USER";
    const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

    let impact = await CarbonImpactService.getImpactByAnalysisId(analysisId, orgId, isAdmin);
    if (!impact) {
      impact = await CarbonImpactService.calculateAssetImpact(analysisId, { organizationId: orgId });
    }

    return successResponse({
      analysisId,
      dataQuality: impact.dataQuality,
      uncertainty: impact.uncertainty,
      limitations: impact.limitations,
      realizedVsPotential: impact.realizedVsPotential,
      isDemo: impact.isDemo,
    });
  } catch (error: any) {
    if (error.message?.includes("Forbidden")) {
      return errorResponse("FORBIDDEN", error.message, 403);
    }
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to fetch data quality metrics", 500);
  }
}
