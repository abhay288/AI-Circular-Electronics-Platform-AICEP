import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { AnalysisSession } from "@/models/AnalysisSession";
import { successResponse, errorResponse } from "@/lib/api-response";
import { SessionStore } from "@/lib/sessionStore";

export async function GET(req: NextRequest, { params }: { params: Promise<{ analysisId: string }> }) {
  try {
    const { analysisId } = await params;

    // Fast zero-latency in-memory check
    const memSession = SessionStore.get(analysisId);
    if (memSession) {
      return successResponse({
        analysisId: memSession.analysisId,
        status: memSession.status,
        progress: memSession.progress,
        currentStage: memSession.currentStage,
        stageStatuses: memSession.stageStatuses,
        error: memSession.error,
        updatedAt: memSession.updatedAt,
      });
    }

    // Fallback to MongoDB
    try {
      await connectDB();
      const session = await AnalysisSession.findOne(
        { $or: [{ analysisId }, { sessionId: analysisId }] },
        { status: 1, progress: 1, currentStage: 1, stageStatuses: 1, error: 1, updatedAt: 1 }
      );

      if (session) {
        // Sync to memory store
        SessionStore.set(analysisId, session.toObject() as any);

        return successResponse({
          analysisId,
          status: session.status,
          progress: session.progress,
          currentStage: session.currentStage,
          stageStatuses: session.stageStatuses,
          error: session.error,
          updatedAt: session.updatedAt,
        });
      }
    } catch (dbErr: any) {
      console.warn("[Status Poll] MongoDB check warning:", dbErr.message);
    }

    return errorResponse("ANALYSIS_NOT_FOUND", `Analysis session '${analysisId}' was not found`, 404);
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to fetch status", 500);
  }
}
