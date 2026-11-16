import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { MarketplaceListingService } from "@/services/marketplace/marketplaceListing.service";
import { updateListingSchema } from "@/lib/marketplace/marketplaceValidation";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const authUser = await getAuthUser(req);
    const isAdmin = authUser?.role === "ADMIN";

    const listing = await MarketplaceListingService.getListingById(id, {
      requestingOrgId: authUser?.organizationId,
      isAdmin,
    });

    if (!listing) {
      return errorResponse("LISTING_NOT_FOUND", `Listing '${id}' was not found`, 404);
    }

    return successResponse({ listing });
  } catch (error: any) {
    return errorResponse("FETCH_FAILED", error.message || "Failed to fetch listing", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const parsed = updateListingSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        parsed.error.issues.map((e: any) => `${e.path.join(".")}: ${e.message}`).join(", "),
        400
      );
    }

    const authUser = await getAuthUser(req);
    const sellerOrganizationId =
      authUser?.organizationId || (body.sellerOrganizationId as string) || "org_demo_circular";
    const sellerUserId = authUser?.userId || (body.sellerUserId as string) || "user_demo_circular";
    const isAdmin = authUser?.role === "ADMIN";

    const updated = await MarketplaceListingService.updateDraft(
      id,
      parsed.data as any,
      {
        sellerOrganizationId,
        sellerUserId,
        isAdmin,
      }
    );

    return successResponse({ listing: updated });
  } catch (error: any) {
    return errorResponse("UPDATE_FAILED", error.message || "Failed to update listing", 400);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const authUser = await getAuthUser(req);
    const orgId = authUser?.organizationId || "org_demo_circular";
    const userId = authUser?.userId || "user_demo_circular";
    const isAdmin = authUser?.role === "ADMIN";

    const archived = await MarketplaceListingService.archiveListing(id, {
      organizationId: orgId,
      userId,
      isAdmin,
    });

    return successResponse({ message: `Listing '${id}' archived successfully`, listing: archived });
  } catch (error: any) {
    return errorResponse("ARCHIVE_FAILED", error.message || "Failed to archive listing", 400);
  }
}
