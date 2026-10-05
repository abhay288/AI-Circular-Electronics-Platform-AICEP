import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Report } from "@/models/Report";
import { AnalysisSession } from "@/models/AnalysisSession";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ analysisId: string }> }) {
  try {
    await connectDB();
    const { analysisId } = await params;

    const report = await Report.findOne({ analysisId });
    if (!report) {
      const session = await AnalysisSession.findOne({
        $or: [{ analysisId }, { sessionId: analysisId }],
      });
      if (session?.reportId || session?.executiveSummary) {
        return successResponse({
          analysisId,
          reportId: session.reportId,
          executiveSummary: session.executiveSummary,
          status: "READY",
        });
      }
      return errorResponse("NOT_FOUND", "Analysis report has not been generated yet", 404);
    }

    return successResponse({ analysisId, report });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to fetch report", 500);
  }
}
