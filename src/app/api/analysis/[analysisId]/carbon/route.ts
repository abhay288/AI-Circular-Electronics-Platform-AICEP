import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { CarbonImpact } from "@/models/CarbonImpact";
import { AnalysisSession } from "@/models/AnalysisSession";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ analysisId: string }> }) {
  try {
    await connectDB();
    const { analysisId } = await params;

    const carbon = await CarbonImpact.findOne({ analysisId });
    if (!carbon) {
      const session = await AnalysisSession.findOne({
        $or: [{ analysisId }, { sessionId: analysisId }],
      });
      if (session?.carbonResult) {
        return successResponse({ analysisId, carbon: session.carbonResult });
      }
      return errorResponse("NOT_FOUND", "Carbon lifecycle assessment record not found", 404);
    }

    return successResponse({ analysisId, carbon });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to fetch carbon analytics", 500);
  }
}
