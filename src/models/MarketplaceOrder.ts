import mongoose, { Schema, Document, Model } from "mongoose";
import {
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
  Currency,
} from "@/lib/marketplace/marketplaceTaxonomy";

export interface IOrderItem {
  listingId: string;
  componentId?: string;
  passportId?: string;
  title: string;
  partNumber: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface IMarketplaceOrder extends Document {
  orderId: string;
  orderNumber: string;
  buyerOrganizationId: string;
  buyerUserId: string;
  sellerOrganizationId: string;

  items: IOrderItem[];
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  currency: Currency;

  status: OrderStatus;
  orderStatus?: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;

  shippingAddress?: {
    name?: string;
    recipientName?: string;
    organization?: string;
    street: string;
    city: string;
    region?: string;
    state?: string;
    country: string;
    postalCode: string;
    contactPhone?: string;
  };

  tracking?: {
    carrier?: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
    shippedAt?: Date;
    deliveredAt?: Date;
  };
  carrier?: string;
  trackingNumber?: string;

  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    listingId: { type: String, required: true },
    componentId: { type: String },
    passportId: { type: String },
    title: { type: String, required: true },
    partNumber: { type: String, default: "N/A" },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const MarketplaceOrderSchema = new Schema<IMarketplaceOrder>(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    orderNumber: { type: String, default: function() { return (this as any).orderId; } },
    buyerOrganizationId: { type: String, required: true, index: true },
    buyerUserId: { type: String, default: "system", index: true },
    sellerOrganizationId: { type: String, required: true, index: true },

    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    currency: { type: String, enum: ["INR", "USD", "EUR"], default: "INR" },

    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "CANCELLED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "COMPLETED",
        "DISPUTED",
      ],
      default: "PENDING",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["REQUEST_QUOTE", "PAYMENT_PENDING", "COMPLETED", "REFUNDED", "FAILED"],
      default: "PAYMENT_PENDING",
      index: true,
    },
    fulfillmentStatus: {
      type: String,
      enum: [
        "UNFULFILLED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "PARTIALLY_FULFILLED",
        "FULFILLED",
        "RETURNED",
      ],
      default: "UNFULFILLED",
    },
    orderStatus: { type: String },
    carrier: { type: String },
    trackingNumber: { type: String },

    shippingAddress: {
      name: { type: String, default: "Hardware Recipient" },
      recipientName: { type: String },
      organization: { type: String },
      street: { type: String, default: "Electronic City Phase 1" },
      city: { type: String, default: "Bangalore" },
      region: { type: String, default: "Karnataka" },
      state: { type: String },
      country: { type: String, default: "India" },
      postalCode: { type: String, default: "560100" },
      contactPhone: { type: String },
    },

    tracking: {
      carrier: { type: String },
      trackingNumber: { type: String },
      estimatedDelivery: { type: Date },
      shippedAt: { type: Date },
      deliveredAt: { type: Date },
    },

    notes: { type: String },
  },
  { timestamps: true }
);

export const MarketplaceOrder: Model<IMarketplaceOrder> =
  mongoose.models.MarketplaceOrder ||
  mongoose.model<IMarketplaceOrder>("MarketplaceOrder", MarketplaceOrderSchema);

export default MarketplaceOrder;
