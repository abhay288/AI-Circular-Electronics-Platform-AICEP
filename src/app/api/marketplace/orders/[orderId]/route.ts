import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { MarketplaceOrderService } from "@/services/marketplace/marketplaceOrder.service";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    await connectDB();
    const { orderId } = await params;
    const authUser = await getAuthUser(req);

    const orgId = authUser?.organizationId || "org_demo_buyer";
    const isAdmin = authUser?.role === "ADMIN";

    const order = await MarketplaceOrderService.getOrder(orderId, orgId, isAdmin);

    return successResponse({ order });
  } catch (error: any) {
    return errorResponse("FETCH_FAILED", error.message || "Failed to fetch order", 400);
  }
}
