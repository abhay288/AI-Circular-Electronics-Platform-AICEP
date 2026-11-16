import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { CarbonImpactService } from "@/services/carbon/carbonImpact.service";
import { FactorManagementService } from "@/services/carbon/factorManagement.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    await connectDB();
    const { analysisId } = await params;

    let impact = await CarbonImpactService.getImpactByAnalysisId(analysisId);
    if (!impact) {
      impact = await CarbonImpactService.calculateAssetImpact(analysisId);
    }

    const methodologies = await FactorManagementService.getMethodologies();
    const activeMethodology = methodologies[0] || {
      methodologyId: "MDM-V1.0",
      name: impact.methodology,
      version: impact.methodologyVersion,
      description: "Material Displacement Method with Circular Lifecycle Adjustment",
      scope: "Scope 3 Category 1 & Category 12 Avoided Emissions",
      formula:
        "Net Avoided CO2e = ∑(Recoverable Material_i × Displacement_i × EmissionFactor_i) + Avoided Component Manufacturing - Process/Transport Overhead",
      assumptions: impact.assumptions,
      sources: impact.sources,
    };

    return successResponse({
      analysisId,
      appliedMethodology: {
        name: impact.methodology,
        version: impact.methodologyVersion,
        calculationVersion: impact.calculationVersion,
        formula: activeMethodology.formula,
        scope: activeMethodology.scope,
        description: activeMethodology.description,
        assumptions: impact.assumptions,
        sources: impact.sources,
        emissionFactorsUsed: impact.emissionFactorsUsed,
      },
      disclaimer:
        "EcoIntel environmental impact calculations are engineering estimates derived from configured methodologies and available asset telemetry. They are not independently verified regulatory carbon credits.",
    });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to fetch methodology info", 500);
  }
}
