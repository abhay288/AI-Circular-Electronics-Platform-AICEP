import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMarketplaceTransaction extends Document {
  transactionId: string;
  orderId?: string;
  listingId: string;
  buyerOrganizationId?: string;
  sellerOrganizationId?: string;
  buyerId?: string;
  sellerId?: string;
  assetId?: string;
  passportId?: string;
  quantity: number;
  amountINR?: number;
  amountUSD?: number;
  currency?: string;
  totalAmount?: number;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REFUNDED" | "DISPUTED";
  paymentStatus?: "PENDING" | "COMPLETED" | "REFUNDED" | "FAILED" | "NOT_APPLICABLE";
  escrowStatus?: "HELD" | "RELEASED" | "DISPUTED";
  metadata?: Record<string, unknown>;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MarketplaceTransactionSchema = new Schema<IMarketplaceTransaction>(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, index: true },
    listingId: { type: String, required: true, index: true },
    buyerOrganizationId: { type: String, index: true },
    sellerOrganizationId: { type: String, index: true },
    buyerId: { type: String, index: true },
    sellerId: { type: String, index: true },
    assetId: { type: String },
    passportId: { type: String, index: true },
    quantity: { type: Number, required: true, min: 1 },
    amountINR: { type: Number },
    amountUSD: { type: Number },
    currency: { type: String, default: "INR" },
    totalAmount: { type: Number },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "REFUNDED", "DISPUTED"],
      default: "PENDING",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED", "REFUNDED", "FAILED", "NOT_APPLICABLE"],
      default: "PENDING",
    },
    escrowStatus: {
      type: String,
      enum: ["HELD", "RELEASED", "DISPUTED"],
      default: "HELD",
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const MarketplaceTransaction: Model<IMarketplaceTransaction> =
  mongoose.models.MarketplaceTransaction ||
  mongoose.model<IMarketplaceTransaction>("MarketplaceTransaction", MarketplaceTransactionSchema);

export default MarketplaceTransaction;

