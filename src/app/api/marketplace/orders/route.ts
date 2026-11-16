import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { MarketplaceOrder } from "@/models/MarketplaceOrder";
import { MarketplaceOrderService } from "@/services/marketplace/marketplaceOrder.service";
import { createOrderSchema } from "@/lib/marketplace/marketplaceValidation";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const authUser = await getAuthUser(req);
    const { searchParams } = new URL(req.url);

    const orgId = authUser?.organizationId || searchParams.get("organizationId") || "org_demo_buyer";
    const isAdmin = authUser?.role === "ADMIN";
    const roleView = searchParams.get("role") || "all"; // "buyer", "seller", or "all"

    const query: Record<string, any> = {};
    if (!isAdmin) {
      if (roleView === "seller") {
        query.sellerOrganizationId = orgId;
      } else if (roleView === "buyer") {
        query.buyerOrganizationId = orgId;
      } else {
        query.$or = [{ buyerOrganizationId: orgId }, { sellerOrganizationId: orgId }];
      }
    }

    const orders = await MarketplaceOrder.find(query).sort({ createdAt: -1 }).limit(50).lean();

    return successResponse({ orders });
  } catch (error: any) {
    return errorResponse("FETCH_FAILED", error.message || "Failed to fetch orders", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const parsed = createOrderSchema.safeParse(body);
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

    const order = await MarketplaceOrderService.createOrder({
      buyerOrganizationId,
      buyerUserId,
      reservationId: parsed.data.reservationId,
      items: parsed.data.items,
      shippingAddress: parsed.data.shippingAddress,
      notes: parsed.data.notes,
    });

    return successResponse({ order }, 201);
  } catch (error: any) {
    return errorResponse("ORDER_CREATION_FAILED", error.message || "Failed to create order", 400);
  }
}
