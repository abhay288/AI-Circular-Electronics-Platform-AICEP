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
    const publisherUserId = authUser?.userId || (body.userId as string) || "user_demo_circular";
    const isAdmin = authUser?.role === "ADMIN";

    const listing = await MarketplaceListingService.publishListing(id, {
      sellerOrganizationId,
      publisherUserId,
      isAdmin,
    });

    return successResponse({
      message: "Listing published successfully",
      listing,
    });
  } catch (error: any) {
    return errorResponse("PUBLISH_FAILED", error.message || "Failed to publish listing", 400);
  }
}
