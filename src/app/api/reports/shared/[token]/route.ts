import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Report } from "@/models/Report";
import { ReportShare } from "@/models/ReportShare";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connectDB();
    const { token } = await params;

    const share = await ReportShare.findOne({ shareToken: token });
    if (!share) {
      return errorResponse("INVALID_SHARE_TOKEN", "The provided share link is invalid or has expired.", 404);
    }

    if (share.status !== "ACTIVE" || new Date() > new Date(share.expiresAt)) {
      if (share.status === "ACTIVE") {
        share.status = "EXPIRED";
        await share.save();
      }
      return errorResponse("SHARE_EXPIRED", "This shared report link has expired.", 410);
    }

    const report = await Report.findOne({ reportId: share.reportId }).lean();
    if (!report) {
      return errorResponse("REPORT_NOT_FOUND", "The shared report is no longer available.", 404);
    }

    // Update access statistics
    await ReportShare.updateOne(
      { shareId: share.shareId },
      { $inc: { accessCount: 1 }, $set: { lastAccessedAt: new Date() } }
    );

    return successResponse({
      report,
      permissions: share.permissions,
      expiresAt: share.expiresAt,
    });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to load shared report", 500);
  }
}
