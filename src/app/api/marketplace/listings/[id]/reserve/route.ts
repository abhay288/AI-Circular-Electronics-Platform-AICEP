import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { MarketplaceInventoryService } from "@/services/marketplace/marketplaceInventory.service";
import { reserveListingSchema } from "@/lib/marketplace/marketplaceValidation";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const parsed = reserveListingSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        parsed.error.issues.map((e: any) => `${e.path.join(".")}: ${e.message}`).join(", "),
        400
      );
    }

    const authUser = await getAuthUser(req);
    const buyerOrganizationId =
      authUser?.organizationId || (body.buyerOrganizationId as string) || "org_demo_buyer";
    const buyerUserId = authUser?.userId || (body.buyerUserId as string) || "user_demo_buyer";

    const result = await MarketplaceInventoryService.reserveQuantity({
      listingId: id,
      quantity: parsed.data.quantity,
      durationMinutes: parsed.data.durationMinutes,
      buyerOrganizationId,
      buyerUserId,
      notes: parsed.data.notes,
    });

    return successResponse({
      message: "Inventory successfully reserved",
      reservation: result.reservation,
      listing: result.listing,
    });
  } catch (error: any) {
    return errorResponse("RESERVE_FAILED", error.message || "Failed to reserve inventory", 400);
  }
}
