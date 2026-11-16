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

    const defaultPairs = [
      { baseline: "DISCARD" as const, circular: "REPAIR" as const },
      { baseline: "REPLACE_WITH_NEW" as const, circular: "REUSE" as const },
      { baseline: "DISCARD" as const, circular: "REFURBISH" as const },
      { baseline: "DISCARD" as const, circular: "MATERIAL_RECOVERY" as const },
    ];

    const scenarioResults = await CarbonImpactService.compareScenarios(analysisId, defaultPairs);

    return successResponse({
      analysisId,
      scenarios: scenarioResults,
    });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to generate scenario comparison", 500);
  }
}
