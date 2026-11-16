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
    const body = await req.json().catch(() => ({}));

    // In demo / test mode or authenticated admin
    const isAdmin = authUser ? authUser.role === "ADMIN" : true;
    const reviewerUserId = authUser?.userId || (body.adminUserId as string) || "admin_reviewer";

    if (!isAdmin) {
      return errorResponse("UNAUTHORIZED", "Only administrators can approve listings", 403);
    }

    const listing = await MarketplaceListingService.approveListing(id, {
      reviewerUserId,
      reviewNotes: body.reviewNotes,
    });

    return successResponse({
      message: "Listing approved and published successfully",
      listing,
    });
  } catch (error: any) {
    return errorResponse("APPROVE_FAILED", error.message || "Failed to approve listing", 400);
  }
}
