import { MarketplaceOrder, IMarketplaceOrder } from "@/models/MarketplaceOrder";
import { MarketplaceListing } from "@/models/MarketplaceListing";
import { MarketplaceQuoteRequest, IMarketplaceQuoteRequest } from "@/models/MarketplaceQuoteRequest";
import { MarketplaceInventoryService } from "./marketplaceInventory.service";
import { AuditLog } from "@/models/AuditLog";
import { logger } from "@/lib/logger";

export interface CreateOrderInput {
  buyerOrganizationId: string;
  buyerUserId: string;
  reservationId?: string;
  items: Array<{
    listingId: string;
    quantity: number;
    unitPrice?: number;
    currency?: string;
  }>;
  shippingAddress?: {
    recipientName: string;
    street: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
    contactPhone?: string;
  };
  notes?: string;
}

export interface CreateQuoteInput {
  listingId: string;
  buyerOrganizationId: string;
  buyerUserId: string;
  quantity: number;
  targetPricePerUnit?: number;
  currency?: string;
  targetDeliveryDate?: string;
  technicalRequirements?: string;
  message?: string;
}

export interface RespondQuoteInput {
  quoteId: string;
  sellerUserId: string;
  sellerOrganizationId: string;
  status: "RESPONDED" | "REJECTED" | "ACCEPTED";
  offeredPricePerUnit?: number;
  sellerNotes?: string;
}

export class MarketplaceOrderService {
  /**
   * Creates a B2B order. Supports conversion from reservation or direct order request.
   * Note: As per EcoIntel principle, if no payment gateway is configured, status is PAYMENT_PENDING.
   */
  public static async createOrder(input: CreateOrderInput): Promise<IMarketplaceOrder> {
    const { buyerOrganizationId, buyerUserId, items, shippingAddress, notes, reservationId } = input;

    if (!items || items.length === 0) {
      throw new Error("Order must contain at least one item.");
    }

    // Currently support single-listing order or multi-item order belonging to a seller
    const firstListing = await MarketplaceListing.findOne({ listingId: items[0].listingId });
    if (!firstListing) {
      throw new Error(`Listing not found: ${items[0].listingId}`);
    }

    const sellerOrganizationId = firstListing.sellerOrganizationId;
    if (sellerOrganizationId === buyerOrganizationId) {
      throw new Error("An organization cannot purchase its own listing.");
    }

    let subtotal = 0;
    const orderItems: any[] = [];
    const currency = items[0].currency || firstListing.currency || "INR";

    // Validate each item and calculate subtotal
    for (const item of items) {
      const listing = await MarketplaceListing.findOne({ listingId: item.listingId });
      if (!listing) {
        throw new Error(`Listing not found: ${item.listingId}`);
      }

      if (listing.sellerOrganizationId !== sellerOrganizationId) {
        throw new Error("Multi-seller orders are not supported in a single transaction. Please order per seller.");
      }

      const unitPrice =
        item.unitPrice ??
        (typeof listing.price === "number" ? listing.price : (listing.price as any)?.amount ?? 0);
      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        listingId: listing.listingId,
        componentId: listing.componentId,
        passportId: listing.passportId,
        title: listing.title,
        partNumber: listing.partNumber || "N/A",
        quantity: item.quantity,
        unitPrice,
        currency,
        subtotal: itemTotal,
        totalPrice: itemTotal,
        condition: listing.condition,
        verificationStatus: listing.verificationStatus,
      });
    }

    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Atomically commit inventory for each item
    for (const item of items) {
      await MarketplaceInventoryService.commitOrderInventory({
        reservationId,
        listingId: item.listingId,
        quantity: item.quantity,
        orderId,
        buyerOrganizationId,
        buyerUserId,
        sellerOrganizationId,
        unitPrice: item.unitPrice,
        currency,
      });
    }

    const order = await MarketplaceOrder.create({
      orderId,
      orderNumber: orderId,
      buyerOrganizationId,
      buyerUserId,
      sellerOrganizationId,
      items: orderItems,
      subtotal,
      shippingCost: 0,
      totalAmount: subtotal,
      currency,
      status: "PENDING",
      orderStatus: "PENDING",
      paymentStatus: "PAYMENT_PENDING",
      fulfillmentStatus: "UNFULFILLED",
      shippingAddress,
      notes,
    });

    await AuditLog.create({
      action: "MARKETPLACE_ORDER_CREATED",
      resource: "MarketplaceOrder",
      resourceId: orderId,
      userId: buyerUserId,
      organizationId: buyerOrganizationId,
      metadata: { sellerOrganizationId, subtotal, currency, itemsCount: items.length },
      timestamp: new Date(),
    });

    return order;
  }

  /**
   * Retrieves an order by orderId with organization access control.
   */
  public static async getOrder(
    orderId: string,
    orgId: string,
    isAdmin = false
  ): Promise<IMarketplaceOrder> {
    const order = await MarketplaceOrder.findOne({ orderId });
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    if (
      !isAdmin &&
      order.buyerOrganizationId !== orgId &&
      order.sellerOrganizationId !== orgId
    ) {
      throw new Error("Unauthorized: You do not have access to this order.");
    }

    return order;
  }

  /**
   * Updates fulfillment or shipment status by the seller organization or admin.
   */
  public static async updateFulfillment(
    orderId: string,
    sellerOrgId: string,
    fulfillmentStatus: "UNFULFILLED" | "PROCESSING" | "SHIPPED" | "DELIVERED",
    trackingNumber?: string,
    carrier?: string,
    isAdmin = false
  ): Promise<IMarketplaceOrder> {
    const order = await MarketplaceOrder.findOne({ orderId });
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    if (!isAdmin && order.sellerOrganizationId !== sellerOrgId) {
      throw new Error("Unauthorized: Only the seller organization can update fulfillment.");
    }

    order.fulfillmentStatus = fulfillmentStatus;
    if (fulfillmentStatus === "PROCESSING") order.orderStatus = "PROCESSING";
    if (fulfillmentStatus === "SHIPPED") order.orderStatus = "SHIPPED";
    if (fulfillmentStatus === "DELIVERED") {
      order.orderStatus = "DELIVERED";
      order.paymentStatus = "COMPLETED"; // auto-cleared on delivery for test/demo mode
    }

    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (carrier) order.carrier = carrier;

    await order.save();

    await AuditLog.create({
      action: "MARKETPLACE_FULFILLMENT_UPDATED",
      resource: "MarketplaceOrder",
      resourceId: orderId,
      userId: sellerOrgId,
      organizationId: sellerOrgId,
      metadata: { fulfillmentStatus, trackingNumber, carrier },
      timestamp: new Date(),
    });

    return order;
  }

  /**
   * Creates a B2B Quote Request.
   */
  public static async createQuoteRequest(input: CreateQuoteInput): Promise<IMarketplaceQuoteRequest> {
    const { listingId, buyerOrganizationId, buyerUserId, quantity, message, targetDeliveryDate, technicalRequirements, targetPricePerUnit, currency } = input;

    const listing = await MarketplaceListing.findOne({ listingId });
    if (!listing) {
      throw new Error(`Listing not found: ${listingId}`);
    }

    if (listing.sellerOrganizationId === buyerOrganizationId) {
      throw new Error("Cannot request quote from your own organization.");
    }

    const quoteId = `QUO-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const quote = await MarketplaceQuoteRequest.create({
      quoteId,
      listingId,
      buyerOrganizationId,
      buyerUserId,
      sellerOrganizationId: listing.sellerOrganizationId,
      requestedQuantity: quantity,
      quantity,
      targetPricePerUnit,
      currency: currency || (typeof listing.price === "number" ? listing.currency : listing.price?.currency) || "INR",
      targetDeliveryDate: targetDeliveryDate ? new Date(targetDeliveryDate) : undefined,
      technicalRequirements,
      message,
      status: "OPEN",
    });

    await AuditLog.create({
      action: "MARKETPLACE_QUOTE_REQUESTED",
      resource: "MarketplaceQuoteRequest",
      resourceId: quoteId,
      userId: buyerUserId,
      organizationId: buyerOrganizationId,
      metadata: { listingId, quantity, sellerOrganizationId: listing.sellerOrganizationId },
      timestamp: new Date(),
    });

    return quote;
  }

  /**
   * Seller responds to quote request.
   */
  public static async respondToQuote(input: RespondQuoteInput, isAdmin = false): Promise<IMarketplaceQuoteRequest> {
    const { quoteId, sellerOrganizationId, sellerUserId, status, offeredPricePerUnit, sellerNotes } = input;

    const quote = await MarketplaceQuoteRequest.findOne({ quoteId });
    if (!quote) {
      throw new Error(`Quote not found: ${quoteId}`);
    }

    if (!isAdmin && quote.sellerOrganizationId !== sellerOrganizationId) {
      throw new Error("Unauthorized: Only the receiving seller organization can respond to this quote.");
    }

    quote.status = status;
    if (offeredPricePerUnit !== undefined) quote.offeredPricePerUnit = offeredPricePerUnit;
    if (sellerNotes !== undefined) quote.sellerNotes = sellerNotes;

    await quote.save();

    await AuditLog.create({
      action: `MARKETPLACE_QUOTE_${status}`,
      resource: "MarketplaceQuoteRequest",
      resourceId: quoteId,
      userId: sellerUserId,
      organizationId: sellerOrganizationId,
      metadata: { status, offeredPricePerUnit, sellerNotes },
      timestamp: new Date(),
    });

    return quote;
  }
}
