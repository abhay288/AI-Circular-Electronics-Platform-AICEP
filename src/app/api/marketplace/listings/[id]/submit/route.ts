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

    const sellerOrganizationId =
      authUser?.organizationId || (body.sellerOrganizationId as string) || "org_demo_circular";
    const sellerUserId = authUser?.userId || (body.sellerUserId as string) || "user_demo_circular";
    const isAdmin = authUser?.role === "ADMIN";

    const listing = await MarketplaceListingService.submitForReview(id, {
      sellerOrganizationId,
      sellerUserId,
      isAdmin,
    });

    return successResponse({
      message: "Listing submitted for review successfully",
      listing,
    });
  } catch (error: any) {
    return errorResponse("SUBMIT_FAILED", error.message || "Failed to submit listing for review", 400);
  }
}
