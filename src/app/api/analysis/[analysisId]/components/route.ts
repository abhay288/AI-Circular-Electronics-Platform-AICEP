import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Component } from "@/models/Component";
import { DetectionResult } from "@/models/DetectionResult";
import { AnalysisSession } from "@/models/AnalysisSession";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ analysisId: string }> }) {
  try {
    await connectDB();
    const { analysisId } = await params;

    const components = await Component.find({ analysisId });
    const detection = await DetectionResult.findOne({ analysisId });

    if (!components.length && !detection) {
      // Check if session has embedded detection
      const session = await AnalysisSession.findOne({
        $or: [{ analysisId }, { sessionId: analysisId }],
      });
      if (session?.detectionResult) {
        return successResponse({
          analysisId,
          totalDetected: session.detectionResult.componentsCount || session.detectionResult.components?.length || 0,
          components: session.detectionResult.components || [],
          confidenceAvg: session.detectionResult.confidenceAvg,
          model: session.detectionResult.model,
        });
      }
      return errorResponse("NOT_FOUND", "No component detection records found for this analysis", 404);
    }

    return successResponse({
      analysisId,
      totalDetected: components.length,
      components,
      detectionMetadata: detection,
    });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to fetch components", 500);
  }
}
