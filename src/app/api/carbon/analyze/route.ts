import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { enqueueCarbonJob } from "@/queues/carbon.queue";
import { CarbonImpactService } from "@/services/carbon/carbonImpact.service";
import { z } from "zod";

const AnalyzeCarbonSchema = z.object({
  analysisId: z.string().min(1, "analysisId is required"),
  baselineScenario: z.enum(["DISCARD", "RECYCLE", "REPLACE_WITH_NEW", "NO_ACTION"]).optional(),
  circularScenario: z.enum(["REUSE", "REPAIR", "REFURBISH", "REMANUFACTURE", "COMPONENT_RECOVERY", "MATERIAL_RECOVERY"]).optional(),
  transportDistanceKm: z.number().min(0).optional(),
  asyncMode: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const parsed = AnalyzeCarbonSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid input", 400);
    }

    const { analysisId, baselineScenario, circularScenario, transportDistanceKm, asyncMode } = parsed.data;

    const organizationId = req.headers.get("x-organization-id") || undefined;
    const userId = req.headers.get("x-user-id") || undefined;

    if (asyncMode) {
      const jobResult = await enqueueCarbonJob({
        analysisId,
        organizationId,
        userId,
        baselineScenario,
        circularScenario,
        transportDistanceKm,
      });

      return successResponse(
        {
          message: "Carbon impact analysis queued successfully.",
          jobId: jobResult.jobId,
          analysisId,
          status: "QUEUED",
        },
        202
      );
    }

    // Synchronous execution
    const impactDoc = await CarbonImpactService.calculateAssetImpact(analysisId, {
      organizationId,
      userId,
      baselineScenario: baselineScenario as any,
      circularScenario: circularScenario as any,
      transportDistanceKm,
    });

    return successResponse(
      {
        message: "Carbon lifecycle impact assessment completed successfully.",
        impact: impactDoc,
      },
      200
    );
  } catch (error: any) {
    return errorResponse("CALCULATION_FAILED", error.message || "Failed to calculate carbon impact", 500);
  }
}
