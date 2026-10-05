import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { AnalysisSession } from "@/models/AnalysisSession";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ analysisId: string }> }) {
  try {
    await connectDB();
    const { analysisId } = await params;

    const session = await AnalysisSession.findOne({
      $or: [{ analysisId }, { sessionId: analysisId }],
    });

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
    await connectDB();
    const { analysisId } = await params;
    const body = await req.json();

    const session = await AnalysisSession.findOneAndUpdate(
      { $or: [{ analysisId }, { sessionId: analysisId }] },
      { $set: body },
      { new: true }
    );

    if (!session) {
      return errorResponse("ANALYSIS_NOT_FOUND", `Analysis session '${analysisId}' was not found`, 404);
    }

    return successResponse({ session });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to update analysis session", 500);
  }
}
