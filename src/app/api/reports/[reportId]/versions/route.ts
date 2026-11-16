import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Report } from "@/models/Report";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    await connectDB();
    const { reportId } = await params;

    const baseReport = await Report.findOne({ reportId }).select("analysisId reportType").lean();
    if (!baseReport) {
      return errorResponse("REPORT_NOT_FOUND", `Report '${reportId}' was not found.`, 404);
    }

    const versions = await Report.find({
      analysisId: baseReport.analysisId,
      reportType: baseReport.reportType,
    })
      .sort({ version: -1 })
      .select("reportId version status completeness generatedAt title")
      .lean();

    return successResponse({ versions });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to retrieve report versions", 500);
  }
}
