import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { CarbonImpactService } from "@/services/carbon/carbonImpact.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const ScenarioRequestSchema = z.object({
  analysisId: z.string().min(1, "analysisId is required"),
  scenarios: z.array(
    z.object({
      baseline: z.enum(["DISCARD", "RECYCLE", "REPLACE_WITH_NEW", "NO_ACTION"]),
      circular: z.enum(["REUSE", "REPAIR", "REFURBISH", "REMANUFACTURE", "COMPONENT_RECOVERY", "MATERIAL_RECOVERY"]),
    })
  ).min(1, "At least one scenario pair is required"),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const parsed = ScenarioRequestSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid input", 400);
    }

    const { analysisId, scenarios } = parsed.data;

    const results = await CarbonImpactService.compareScenarios(analysisId, scenarios);

    return successResponse({
      analysisId,
      disclaimer: "These scenario calculations are comparative engineering estimates for decision planning and do not modify historical realized records.",
      results,
    });
  } catch (error: any) {
    return errorResponse("SCENARIO_SIMULATION_FAILED", error.message || "Failed to simulate scenarios", 500);
  }
}
