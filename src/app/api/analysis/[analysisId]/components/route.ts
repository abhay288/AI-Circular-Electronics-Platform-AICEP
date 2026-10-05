import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Component } from "@/models/Component";
import { DetectionResult } from "@/models/DetectionResult";
import { AnalysisSession } from "@/models/AnalysisSession";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    await connectDB();
    const { analysisId } = await params;
    const { searchParams } = new URL(req.url);

    const typeFilter = searchParams.get("type");
    const minConfidence = searchParams.get("minConfidence");
    const search = searchParams.get("search");

    // Construct query filter
    const query: Record<string, any> = { analysisId };

    if (typeFilter) {
      query.type = new RegExp(`^${typeFilter}$`, "i");
    }

    if (minConfidence) {
      const confNum = parseFloat(minConfidence);
      if (!isNaN(confNum)) {
        query.confidence = { $gte: confNum };
      }
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { partNumber: new RegExp(search, "i") },
        { manufacturer: new RegExp(search, "i") },
        { serialNumber: new RegExp(search, "i") },
      ];
    }

    let components = await Component.find(query).sort({ confidence: -1 });
    const detection = await DetectionResult.findOne({ analysisId });

    if (!components.length && !detection) {
      // Check if session has embedded detection
      const session = await AnalysisSession.findOne({
        $or: [{ analysisId }, { sessionId: analysisId }],
      });
      if (session?.detectionResult) {
        let sessionComps = session.detectionResult.components || [];

        if (typeFilter) {
          sessionComps = sessionComps.filter(
            (c: any) => c.type?.toLowerCase() === typeFilter.toLowerCase()
          );
        }
        if (minConfidence) {
          const confNum = parseFloat(minConfidence);
          sessionComps = sessionComps.filter((c: any) => (c.confidence || 0) >= confNum);
        }
        if (search) {
          const s = search.toLowerCase();
          sessionComps = sessionComps.filter(
            (c: any) =>
              c.name?.toLowerCase().includes(s) ||
              c.partNumber?.toLowerCase().includes(s) ||
              c.manufacturer?.toLowerCase().includes(s)
          );
        }

        return successResponse({
          total: sessionComps.length,
          totalDetected: sessionComps.length,
          components: sessionComps,
          confidenceAvg: session.detectionResult.confidenceAvg,
          model: session.detectionResult.model,
        });
      }
      return errorResponse("NOT_FOUND", "No component detection records found for this analysis", 404);
    }

    return successResponse({
      analysisId,
      total: components.length,
      totalDetected: components.length,
      components,
      detectionMetadata: detection,
    });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to fetch components", 500);
  }
}
