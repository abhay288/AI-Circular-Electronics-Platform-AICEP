import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { MarketplaceListing } from "@/models/MarketplaceListing";
import { MarketplaceReport } from "@/models/MarketplaceReport";
import { reportListingSchema } from "@/lib/marketplace/marketplaceValidation";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { AuditLog } from "@/models/AuditLog";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const parsed = reportListingSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        parsed.error.issues.map((e: any) => `${e.path.join(".")}: ${e.message}`).join(", "),
        400
      );
    }

    const listing = await MarketplaceListing.findOne({ listingId: id });
    if (!listing) {
      return errorResponse("NOT_FOUND", `Listing '${id}' not found`, 404);
    }

    const authUser = await getAuthUser(req);
    const reporterUserId = authUser?.userId || (body.reporterUserId as string) || "user_community_reporter";
    const reporterOrganizationId = authUser?.organizationId || (body.reporterOrganizationId as string) || "org_community";

    const reportId = `REP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const report = await MarketplaceReport.create({
      reportId,
      listingId: id,
      reporterUserId,
      reporterOrganizationId,
      reason: parsed.data.reason,
      description: parsed.data.description,
      evidenceUrls: parsed.data.evidenceUrls || [],
      status: "OPEN",
    });

    await AuditLog.create({
      action: "MARKETPLACE_LISTING_REPORTED",
      userId: reporterUserId,
      organizationId: reporterOrganizationId,
      resource: "MarketplaceListing",
      resourceId: id,
      metadata: { reportId, reason: parsed.data.reason },
      timestamp: new Date(),
    });

    return successResponse(
      {
        message: "Listing reported successfully for review by EcoIntel trust & safety team",
        report,
      },
      201
    );
  } catch (error: any) {
    return errorResponse("REPORT_FAILED", error.message || "Failed to submit report", 400);
  }
}
