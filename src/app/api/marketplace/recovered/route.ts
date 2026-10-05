import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Component } from "@/models/Component";
import { AnalysisSession } from "@/models/AnalysisSession";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const analysisId = searchParams.get("analysisId");

    const query: Record<string, any> = { marketplaceEligible: true };
    if (analysisId) {
      query.analysisId = analysisId;
    }

    let components = await Component.find(query);

    // If components not yet stored separately, extract from session embedded detection
    if (!components.length && analysisId) {
      const session = await AnalysisSession.findOne({
        $or: [{ analysisId }, { sessionId: analysisId }],
      });
      if (session?.detectionResult?.components) {
        components = session.detectionResult.components.filter(
          (c: any) => c.health >= 70 && c.status?.toLowerCase() !== "critical"
        );
      }
    }

    return successResponse({
      count: components.length,
      recoveredEligibleComponents: components,
    });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to fetch eligible marketplace components", 500);
  }
}
