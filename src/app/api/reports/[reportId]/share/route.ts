import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Report } from "@/models/Report";
import { ReportShare } from "@/models/ReportShare";
import { AuditLog } from "@/models/AuditLog";
import { successResponse, errorResponse } from "@/lib/api-response";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    await connectDB();
    const { reportId } = await params;
    const body = await req.json().catch(() => ({}));
    const {
      expiresInDays = 7,
      permissions = ["VIEW"],
      createdBy = "user",
    } = body;

    const report = await Report.findOne({ reportId });
    if (!report) {
      return errorResponse("REPORT_NOT_FOUND", `Report '${reportId}' was not found.`, 404);
    }

    const shareToken = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(expiresInDays));

    const shareId = `share-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const reportShare = new ReportShare({
      shareId,
      reportId,
      shareToken,
      createdBy,
      organizationId: report.organizationId,
      expiresAt,
      permissions,
      status: "ACTIVE",
      accessCount: 0,
    });

    await reportShare.save();

    await AuditLog.create({
      action: "REPORT_SHARED",
      resource: "REPORT",
      resourceId: reportId,
      userId: createdBy,
      organizationId: report.organizationId,
      metadata: { shareId, expiresInDays, permissions },
    });

    const shareUrl = `/reports/shared/${shareToken}`;

    return successResponse({
      shareId,
      shareToken,
      shareUrl,
      expiresAt,
      permissions,
    });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to create report share link", 500);
  }
}
