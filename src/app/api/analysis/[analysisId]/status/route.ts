import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { AnalysisSession } from "@/models/AnalysisSession";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ analysisId: string }> }) {
  try {
    await connectDB();
    const { analysisId } = await params;

    const session = await AnalysisSession.findOne(
      { $or: [{ analysisId }, { sessionId: analysisId }] },
      { status: 1, progress: 1, currentStage: 1, stageStatuses: 1, error: 1, updatedAt: 1 }
    );

    if (!session) {
      return errorResponse("ANALYSIS_NOT_FOUND", `Analysis session '${analysisId}' was not found`, 404);
    }

    return successResponse({
      analysisId,
      status: session.status,
      progress: session.progress,
      currentStage: session.currentStage,
      stageStatuses: session.stageStatuses,
      error: session.error,
      updatedAt: session.updatedAt,
    });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to fetch status", 500);
  }
}
