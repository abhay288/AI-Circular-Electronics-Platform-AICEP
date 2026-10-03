import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMarketplaceListing extends Document {
  listingId: string;
  analysisId?: string;
  componentId?: mongoose.Types.ObjectId;
  componentIds?: string[];
  passportId?: string;
  passportIds?: string[];
  title: string;
  description?: string;
  condition?: string;
  priceUSD: number;
  quantity?: number;
  sellerId?: mongoose.Types.ObjectId | string;
  buyerId?: mongoose.Types.ObjectId | string;
  organizationId?: string;
  status: "active" | "sold" | "reserved" | "cancelled";
  location?: string;
  shippingAvailability?: string;
  warranty?: string;
  metadata?: any;
  capsulePreviewUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MarketplaceListingSchema: Schema<IMarketplaceListing> = new Schema(
  {
    listingId: { type: String, required: true, unique: true, index: true },
    analysisId: { type: String, index: true },
    componentId: { type: Schema.Types.ObjectId, ref: "Component" },
    componentIds: [{ type: String }],
    passportId: { type: String },
    passportIds: [{ type: String }],
    title: { type: String, required: true },
    description: { type: String },
    condition: { type: String, default: "Grade A+ (Tested & Certified)" },
    priceUSD: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    sellerId: { type: Schema.Types.Mixed },
    buyerId: { type: Schema.Types.Mixed },
    organizationId: { type: String, default: "org_circular_lab_01" },
    status: {
      type: String,
      enum: ["active", "sold", "reserved", "cancelled"],
      default: "active",
    },
    location: { type: String, default: "EcoIntel Circular Inspection Lab 01" },
    shippingAvailability: { type: String, default: "Worldwide Courier / Anti-Static Packaging" },
    warranty: { type: String, default: "30-Day Functional Guarantee" },
    metadata: { type: Schema.Types.Mixed },
    capsulePreviewUrl: { type: String },
  },
  { timestamps: true }
);

export const MarketplaceListing: Model<IMarketplaceListing> =
  mongoose.models.MarketplaceListing ||
  mongoose.model<IMarketplaceListing>("MarketplaceListing", MarketplaceListingSchema);
