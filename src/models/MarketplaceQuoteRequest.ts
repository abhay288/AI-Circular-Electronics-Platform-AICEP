import mongoose, { Schema, Document, Model } from "mongoose";
import { QuoteStatus, Currency } from "@/lib/marketplace/marketplaceTaxonomy";

export interface IMarketplaceQuoteRequest extends Document {
  quoteId: string;
  listingId: string;
  buyerOrganizationId: string;
  buyerUserId: string;
  sellerOrganizationId: string;

  requestedQuantity: number;
  quantity?: number;
  targetPricePerUnit?: number;
  currency?: string;
  technicalRequirements?: string;
  targetDeliveryDate?: Date;
  message: string;

  status: QuoteStatus;
  offeredPrice?: {
    amount: number;
    currency: Currency;
  };
  offeredPricePerUnit?: number;
  sellerNotes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const MarketplaceQuoteRequestSchema = new Schema<IMarketplaceQuoteRequest>(
  {
    quoteId: { type: String, required: true, unique: true, index: true },
    listingId: { type: String, required: true, index: true },
    buyerOrganizationId: { type: String, required: true, index: true },
    buyerUserId: { type: String, default: "system", index: true },
    sellerOrganizationId: { type: String, required: true, index: true },

    requestedQuantity: {
      type: Number,
      default: function () {
        return (this as any).quantity || 1;
      },
      min: 1,
    },
    quantity: { type: Number },
    targetPricePerUnit: { type: Number },
    currency: { type: String, default: "INR" },
    technicalRequirements: { type: String },
    targetDeliveryDate: { type: Date },
    message: { type: String, required: true },

    status: {
      type: String,
      enum: ["OPEN", "RESPONDED", "ACCEPTED", "REJECTED", "EXPIRED"],
      default: "OPEN",
      index: true,
    },
    offeredPrice: {
      amount: { type: Number },
      currency: { type: String, enum: ["INR", "USD", "EUR"], default: "INR" },
    },
    offeredPricePerUnit: { type: Number },
    sellerNotes: { type: String },
  },
  { timestamps: true }
);

export const MarketplaceQuoteRequest: Model<IMarketplaceQuoteRequest> =
  mongoose.models.MarketplaceQuoteRequest ||
  mongoose.model<IMarketplaceQuoteRequest>(
    "MarketplaceQuoteRequest",
    MarketplaceQuoteRequestSchema
  );

export default MarketplaceQuoteRequest;
