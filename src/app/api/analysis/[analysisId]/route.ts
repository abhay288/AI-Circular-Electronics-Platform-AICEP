import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { AnalysisSession } from "@/models/AnalysisSession";
import { successResponse, errorResponse } from "@/lib/api-response";
import { SessionStore } from "@/lib/sessionStore";

export async function GET(req: NextRequest, { params }: { params: Promise<{ analysisId: string }> }) {
  try {
    const { analysisId } = await params;

    let session = SessionStore.get(analysisId);

    try {
      await connectDB();
      const mongoSession = await AnalysisSession.findOne({
        $or: [{ analysisId }, { sessionId: analysisId }],
      });
      if (mongoSession) {
        session = SessionStore.set(analysisId, mongoSession.toObject() as any);
      }
    } catch (dbErr: any) {
      console.warn("[Session Retrieve] MongoDB check deferred, using memory store:", dbErr.message);
    }

    if (!session) {
      return errorResponse("ANALYSIS_NOT_FOUND", `Analysis session '${analysisId}' was not found`, 404);
    }

    return successResponse({ session });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to retrieve analysis session", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ analysisId: string }> }) {
  try {
    const { analysisId } = await params;
    const body = await req.json();

    const updatedSession = SessionStore.update(analysisId, body);

    try {
      await connectDB();
      await AnalysisSession.findOneAndUpdate(
        { $or: [{ analysisId }, { sessionId: analysisId }] },
        { $set: body },
        { new: true }
      );
    } catch (dbErr: any) {
      console.warn("[Session Update] MongoDB sync deferred:", dbErr.message);
    }

    if (!updatedSession) {
      return errorResponse("ANALYSIS_NOT_FOUND", `Analysis session '${analysisId}' was not found`, 404);
    }

    return successResponse({ session: updatedSession });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to update analysis session", 500);
  }
}
