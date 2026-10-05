import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMarketplaceTransaction extends Document {
  transactionId: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  quantity: number;
  amountINR: number;
  amountUSD: number;
  paymentStatus: "PENDING" | "COMPLETED" | "REFUNDED" | "FAILED";
  escrowStatus: "HELD" | "RELEASED" | "DISPUTED";
  createdAt: Date;
  updatedAt: Date;
}

const MarketplaceTransactionSchema = new Schema<IMarketplaceTransaction>(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    listingId: { type: String, required: true, index: true },
    buyerId: { type: String, required: true, index: true },
    sellerId: { type: String, required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    amountINR: { type: Number, required: true },
    amountUSD: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED", "REFUNDED", "FAILED"],
      default: "PENDING",
    },
    escrowStatus: {
      type: String,
      enum: ["HELD", "RELEASED", "DISPUTED"],
      default: "HELD",
    },
  },
  { timestamps: true }
);

export const MarketplaceTransaction: Model<IMarketplaceTransaction> =
  mongoose.models.MarketplaceTransaction ||
  mongoose.model<IMarketplaceTransaction>("MarketplaceTransaction", MarketplaceTransactionSchema);

export default MarketplaceTransaction;
