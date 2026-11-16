import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Report } from "@/models/Report";
import { AuditLog } from "@/models/AuditLog";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    await connectDB();
    const { reportId } = await params;

    const report = await Report.findOneAndUpdate(
      { reportId },
      { $set: { status: "ARCHIVED" } },
      { new: true }
    );

    if (!report) {
      return errorResponse("REPORT_NOT_FOUND", `Report '${reportId}' was not found.`, 404);
    }

    await AuditLog.create({
      action: "REPORT_ARCHIVED",
      resource: "REPORT",
      resourceId: reportId,
      userId: "user",
      organizationId: report.organizationId,
      metadata: { previousStatus: "READY" },
    });

    return successResponse({
      message: `Report '${reportId}' archived successfully.`,
      report,
    });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to archive report", 500);
  }
}
