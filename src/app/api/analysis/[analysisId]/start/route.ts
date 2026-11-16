import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { AnalysisSession } from "@/models/AnalysisSession";
import { queueManager } from "@/lib/queue";
import { successResponse, errorResponse } from "@/lib/api-response";
import { SessionStore } from "@/lib/sessionStore";

export async function POST(req: NextRequest, { params }: { params: Promise<{ analysisId: string }> }) {
  try {
    const { analysisId } = await params;

    let session = SessionStore.get(analysisId);
    let mongoSession: any = null;

    if (!session) {
      try {
        await connectDB();
        mongoSession = await AnalysisSession.findOne({
          $or: [{ analysisId }, { sessionId: analysisId }],
        });
        if (mongoSession) {
          session = SessionStore.set(analysisId, mongoSession.toObject());
        }
      } catch (dbErr: any) {
        console.warn("[Start] MongoDB check deferred, checking memory store:", dbErr.message);
      }
    }

    if (!session && !mongoSession) {
      return errorResponse("ANALYSIS_NOT_FOUND", `Analysis session '${analysisId}' was not found`, 404);
    }

    const currentImage = session?.imageUrl || session?.imageFilePath || mongoSession?.imageUrl;
    const currentSample = session?.sampleId || mongoSession?.sampleId;

    if (!currentImage && !currentSample) {
      return errorResponse(
        "IMAGE_REQUIRED",
        "Cannot start analysis: An image or sample hardware dataset must be provided first",
        400
      );
    }

    // Update session state to PROCESSING in memory and disk immediately
    const updatedMemory = SessionStore.update(analysisId, {
      status: "PROCESSING",
      currentStage: "DETECTION",
      progress: 15,
      stageStatuses: {
        quality: "completed",
        detection: "processing",
        pcb: "pending",
        damage: "pending",
        ocr: "pending",
        summary: "pending",
      },
    });

    // Also update MongoDB if connected
    if (mongoSession) {
      try {
        mongoSession.status = "PROCESSING";
        mongoSession.currentStage = "INITIALIZATION";
        mongoSession.progress = 10;
        mongoSession.stageStatuses = {
          quality: "completed",
          detection: "processing",
          pcb: "pending",
          damage: "pending",
          ocr: "pending",
          summary: "pending",
        };
        await mongoSession.save();
      } catch (saveErr: any) {
        console.warn("[Start] MongoDB update deferred:", saveErr.message);
      }
    }

    // Trigger asynchronous analysis pipeline execution
    const queueJob = await queueManager.enqueueAnalysis(analysisId);

    return successResponse({
      analysisId,
      status: updatedMemory?.status || "PROCESSING",
      currentStage: updatedMemory?.currentStage || "INITIALIZATION",
      progress: updatedMemory?.progress || 10,
      jobId: queueJob.jobId,
      message: "Analysis pipeline triggered successfully",
    });
  } catch (error: any) {
    console.error("[Start Analysis Error]:", error);
    return errorResponse("PROCESSING_FAILED", error.message || "Failed to start analysis", 500);
  }
}
