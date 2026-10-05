import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { RULPrediction } from "@/models/RULPrediction";
import { AnalysisSession } from "@/models/AnalysisSession";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ analysisId: string }> }) {
  try {
    await connectDB();
    const { analysisId } = await params;

    const rul = await RULPrediction.findOne({ analysisId });
    if (!rul) {
      const session = await AnalysisSession.findOne({
        $or: [{ analysisId }, { sessionId: analysisId }],
      });
      if (session?.rulResult) {
        return successResponse({ analysisId, rul: session.rulResult });
      }
      return errorResponse("NOT_FOUND", "RUL prediction record not found", 404);
    }

    return successResponse({ analysisId, rul });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to fetch RUL prediction", 500);
  }
}
