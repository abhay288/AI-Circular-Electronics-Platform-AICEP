import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { RepairAssessment } from "@/models/RepairAssessment";
import { AnalysisSession } from "@/models/AnalysisSession";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ analysisId: string }> }) {
  try {
    await connectDB();
    const { analysisId } = await params;

    const repair = await RepairAssessment.findOne({ analysisId });
    if (!repair) {
      const session = await AnalysisSession.findOne({
        $or: [{ analysisId }, { sessionId: analysisId }],
      });
      if (session?.repairResult) {
        return successResponse({ analysisId, repair: session.repairResult });
      }
      return errorResponse("NOT_FOUND", "Repair assessment record not found", 404);
    }

    return successResponse({ analysisId, repair });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to fetch repair assessment", 500);
  }
}
