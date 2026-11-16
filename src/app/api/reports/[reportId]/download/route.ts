import { NextRequest, NextResponse } from "next/server";
import { ReportService } from "@/services/reporting/report.service";
import { AuditLog } from "@/models/AuditLog";
import { Report } from "@/models/Report";
import { connectDB } from "@/lib/db";
import { errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    await connectDB();
    const { reportId } = await params;
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") || "PDF").toUpperCase() as "PDF" | "JSON" | "CSV";

    const report = await Report.findOne({ reportId });
    if (!report) {
      return errorResponse("REPORT_NOT_FOUND", `Report '${reportId}' was not found.`, 404);
    }

    const { data, contentType, filename } = await ReportService.exportReport(reportId, format);

    // Audit log
    await AuditLog.create({
      action: "REPORT_DOWNLOADED",
      resource: "REPORT",
      resourceId: reportId,
      userId: "user",
      organizationId: report.organizationId,
      metadata: { format, filename },
    });

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);

    if (Buffer.isBuffer(data)) {
      return new NextResponse(data as any, { status: 200, headers });
    } else {
      return new NextResponse(data, { status: 200, headers });
    }
  } catch (error: any) {
    console.error("[Report Download Error]:", error);
    return errorResponse("DOWNLOAD_FAILED", error.message || "Failed to download report", 500);
  }
}
