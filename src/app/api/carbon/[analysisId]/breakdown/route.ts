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

    const waterfallSteps = [
      {
        step: 1,
        name: "Baseline Virgin Component Production",
        category: "AVOIDED_MANUFACTURING",
        valueKgCO2e: 16.5,
        type: "CREDIT",
        description: "Primary manufacturing and fab processing emissions avoided via circular lifecycle.",
      },
      {
        step: 2,
        name: "Virgin Material Displacement (Metals & Substrate)",
        category: "MATERIAL_DISPLACEMENT",
        valueKgCO2e: +(impact.grossAvoidedCO2e - 16.5).toFixed(3),
        type: "CREDIT",
        description: "Emissions avoided by substituting primary mined copper, gold, aluminum with recovered secondary yield.",
      },
      {
        step: 3,
        name: "Gross Avoided Emissions",
        category: "SUBTOTAL",
        valueKgCO2e: impact.grossAvoidedCO2e,
        type: "SUBTOTAL",
        description: "Total avoided impact prior to deducting circular process overhead.",
      },
      {
        step: 4,
        name: "Circular Workshop & Testing Energy",
        category: "PROCESS_OVERHEAD",
        valueKgCO2e: -1.2,
        type: "DEBIT",
        description: "Electricity and consumables consumed during diagnostics, desoldering, and re-flashing.",
      },
      {
        step: 5,
        name: "Secondary Reverse Logistics & Transport",
        category: "TRANSPORT_OVERHEAD",
        valueKgCO2e: -0.6,
        type: "DEBIT",
        description: "Emissions from local transit to circular refurbishment hub (50 km baseline).",
      },
      {
        step: 6,
        name: "Net Avoided Emissions",
        category: "NET_RESULT",
        valueKgCO2e: impact.netAvoidedCO2e,
        type: "NET",
        description: "Defensible net emissions avoided (Gross avoidance minus circular overhead).",
      },
    ];

    return successResponse({
      analysisId,
      grossAvoidedCO2e: impact.grossAvoidedCO2e,
      additionalImpactCO2e: impact.additionalImpactCO2e,
      netAvoidedCO2e: impact.netAvoidedCO2e,
      unit: impact.unit,
      waterfallSteps,
      materials: impact.materials.details,
    });
  } catch (error: any) {
    if (error.message?.includes("Forbidden")) {
      return errorResponse("FORBIDDEN", error.message, 403);
    }
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to fetch impact breakdown", 500);
  }
}
