import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { PCBAnalysis } from "@/models/PCBAnalysis";
import { AnalysisSession } from "@/models/AnalysisSession";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ analysisId: string }> }) {
  try {
    await connectDB();
    const { analysisId } = await params;

    const pcb = await PCBAnalysis.findOne({ analysisId });
    if (!pcb) {
      const session = await AnalysisSession.findOne({
        $or: [{ analysisId }, { sessionId: analysisId }],
      });
      if (session?.reconstructionResult) {
        return successResponse({ analysisId, pcb: session.reconstructionResult });
      }
      return errorResponse("NOT_FOUND", "PCB analysis record not found", 404);
    }

    return successResponse({ analysisId, pcb });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to fetch PCB analysis", 500);
  }
}
