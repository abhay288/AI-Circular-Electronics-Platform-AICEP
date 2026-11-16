import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { MarketplaceQuoteRequest } from "@/models/MarketplaceQuoteRequest";
import { MarketplaceOrderService } from "@/services/marketplace/marketplaceOrder.service";
import { respondQuoteSchema } from "@/lib/marketplace/marketplaceValidation";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    await connectDB();
    const { quoteId } = await params;
    const authUser = await getAuthUser(req);

    const quote = await MarketplaceQuoteRequest.findOne({ quoteId });
    if (!quote) {
      return errorResponse("NOT_FOUND", `Quote request '${quoteId}' was not found`, 404);
    }

    const orgId = authUser?.organizationId;
    const isAdmin = authUser?.role === "ADMIN";

    if (
      !isAdmin &&
      orgId &&
      quote.buyerOrganizationId !== orgId &&
      quote.sellerOrganizationId !== orgId
    ) {
      return errorResponse("UNAUTHORIZED", "You do not have access to this quote request", 403);
    }

    return successResponse({ quote });
  } catch (error: any) {
    return errorResponse("FETCH_FAILED", error.message || "Failed to fetch quote request", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    await connectDB();
    const { quoteId } = await params;
    const body = await req.json();

    const parsed = respondQuoteSchema.safeParse(body);
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

    const updated = await MarketplaceOrderService.respondToQuote(
      {
        quoteId,
        sellerOrganizationId,
        sellerUserId,
        status: parsed.data.status,
        offeredPricePerUnit: parsed.data.offeredPricePerUnit,
        sellerNotes: parsed.data.sellerNotes,
      },
      isAdmin
    );

    return successResponse({ quote: updated });
  } catch (error: any) {
    return errorResponse("QUOTE_UPDATE_FAILED", error.message || "Failed to respond to quote", 400);
  }
}
