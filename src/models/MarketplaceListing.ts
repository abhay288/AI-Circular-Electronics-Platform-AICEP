import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMarketplaceListing extends Document {
  listingId: string;
  analysisId: string;
  componentId: string;
  sellerId: string;
  title: string;
  description: string;
  category: string;
  condition: "MINT" | "EXCELLENT" | "REFURBISHED" | "TESTED_WORKING";
  priceINR: number;
  priceUSD: number;
  quantity: number;
  location: string;
  passportId?: string;
  status: "ACTIVE" | "PENDING" | "SOLD" | "UNLISTED";
  createdAt: Date;
  updatedAt: Date;
}

const MarketplaceListingSchema = new Schema<IMarketplaceListing>(
  {
    listingId: { type: String, required: true, unique: true, index: true },
    analysisId: { type: String, required: true, index: true },
    componentId: { type: String, required: true, index: true },
    sellerId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, default: "Semiconductors" },
    condition: {
      type: String,
      enum: ["MINT", "EXCELLENT", "REFURBISHED", "TESTED_WORKING"],
      default: "TESTED_WORKING",
    },
    priceINR: { type: Number, required: true },
    priceUSD: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    location: { type: String, default: "Bangalore, India" },
    passportId: { type: String },
    status: {
      type: String,
      enum: ["ACTIVE", "PENDING", "SOLD", "UNLISTED"],
      default: "ACTIVE",
      index: true,
    },
  },
  { timestamps: true }
);

export const MarketplaceListing: Model<IMarketplaceListing> =
  mongoose.models.MarketplaceListing ||
  mongoose.model<IMarketplaceListing>("MarketplaceListing", MarketplaceListingSchema);

export default MarketplaceListing;
