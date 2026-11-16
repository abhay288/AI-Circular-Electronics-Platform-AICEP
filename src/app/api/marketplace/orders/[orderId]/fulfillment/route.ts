import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { MarketplaceOrderService } from "@/services/marketplace/marketplaceOrder.service";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    await connectDB();
    const { orderId } = await params;
    const body = await req.json();
    const authUser = await getAuthUser(req);

    const sellerOrgId = authUser?.organizationId || (body.sellerOrganizationId as string) || "org_demo_circular";
    const isAdmin = authUser?.role === "ADMIN";

    if (!body.fulfillmentStatus) {
      return errorResponse("VALIDATION_ERROR", "fulfillmentStatus is required", 400);
    }

    const order = await MarketplaceOrderService.updateFulfillment(
      orderId,
      sellerOrgId,
      body.fulfillmentStatus,
      body.trackingNumber,
      body.carrier,
      isAdmin
    );

    return successResponse({ order });
  } catch (error: any) {
    return errorResponse("FULFILLMENT_UPDATE_FAILED", error.message || "Failed to update fulfillment", 400);
  }
}
