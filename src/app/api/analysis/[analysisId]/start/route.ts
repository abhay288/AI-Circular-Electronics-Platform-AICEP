import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { AnalysisSession } from "@/models/AnalysisSession";
import { queueManager } from "@/lib/queue";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ analysisId: string }> }) {
  try {
    await connectDB();
    const { analysisId } = await params;

    const session = await AnalysisSession.findOne({
      $or: [{ analysisId }, { sessionId: analysisId }],
    });

    if (!session) {
      return errorResponse("ANALYSIS_NOT_FOUND", `Analysis session '${analysisId}' was not found`, 404);
    }

    if (!session.imageUrl && !session.sampleId) {
      return errorResponse(
        "IMAGE_REQUIRED",
        "Cannot start analysis: An image or sample hardware dataset must be provided first",
        400
      );
    }

    // Trigger asynchronous analysis pipeline execution
    const queueJob = await queueManager.enqueueAnalysis(session.analysisId);

    return successResponse({
      analysisId: session.analysisId,
      status: "PROCESSING",
      currentStage: "INITIALIZATION",
      progress: 5,
      jobId: queueJob.jobId,
      message: "Analysis pipeline triggered successfully",
    });
  } catch (error: any) {
    console.error("[Start Analysis Error]:", error);
    return errorResponse("PROCESSING_FAILED", error.message || "Failed to start analysis", 500);
  }
}
