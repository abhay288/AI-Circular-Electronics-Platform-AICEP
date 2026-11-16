import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Report } from "@/models/Report";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId") || "org-default";

    const [totalReports, readyReports, reports] = await Promise.all([
      Report.countDocuments({ organizationId }),
      Report.countDocuments({ organizationId, status: "READY" }),
      Report.find({ organizationId }).select("completeness").lean(),
    ]);

    let totalCompleteness = 0;
    for (const r of reports) {
      totalCompleteness += r.completeness?.overallPercent || 0;
    }
    const avgCompleteness = reports.length > 0 ? Math.round(totalCompleteness / reports.length) : 0;

    return successResponse({
      organizationId,
      totalReports,
      readyReports,
      averageCompletenessPercent: avgCompleteness,
    });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to retrieve organization summary", 500);
  }
}
