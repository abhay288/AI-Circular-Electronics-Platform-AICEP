import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMarketplaceListing extends Document {
  listingId: string;
  componentId: mongoose.Types.ObjectId;
  title: string;
  priceUSD: number;
  priceETH?: number;
  sellerId: mongoose.Types.ObjectId;
  buyerId?: mongoose.Types.ObjectId;
  status: "active" | "sold" | "reserved" | "cancelled";
  blockchainTxHash?: string;
  passportId?: mongoose.Types.ObjectId;
  capsulePreviewUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MarketplaceListingSchema: Schema<IMarketplaceListing> = new Schema(
  {
    listingId: { type: String, required: true, unique: true, index: true },
    componentId: { type: Schema.Types.ObjectId, ref: "Component", required: true },
    title: { type: String, required: true },
    priceUSD: { type: Number, required: true },
    priceETH: { type: Number },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["active", "sold", "reserved", "cancelled"],
      default: "active",
    },
    blockchainTxHash: { type: String },
    passportId: { type: Schema.Types.ObjectId, ref: "BlockchainPassport" },
    capsulePreviewUrl: { type: String },
  },
  { timestamps: true }
);

export const MarketplaceListing: Model<IMarketplaceListing> =
  mongoose.models.MarketplaceListing ||
  mongoose.model<IMarketplaceListing>("MarketplaceListing", MarketplaceListingSchema);
