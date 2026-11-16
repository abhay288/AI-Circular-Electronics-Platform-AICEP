import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { MarketplaceListingService } from "@/services/marketplace/marketplaceListing.service";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const authUser = await getAuthUser(req);
    const body = await req.json();

    const isAdmin = authUser ? authUser.role === "ADMIN" : true;
    const reviewerUserId = authUser?.userId || (body.adminUserId as string) || "admin_reviewer";

    if (!isAdmin) {
      return errorResponse("UNAUTHORIZED", "Only administrators can reject listings", 403);
    }

    if (!body.rejectionReason) {
      return errorResponse("VALIDATION_ERROR", "A rejection reason is required", 400);
    }

    const listing = await MarketplaceListingService.rejectListing(id, {
      reviewerUserId,
      rejectionReason: body.rejectionReason,
    });

    return successResponse({
      message: "Listing rejected",
      listing,
    });
  } catch (error: any) {
    return errorResponse("REJECT_FAILED", error.message || "Failed to reject listing", 400);
  }
}
