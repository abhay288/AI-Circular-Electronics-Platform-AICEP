import mongoose, { Schema, Document, Model } from "mongoose";
import { ReservationStatus } from "@/lib/marketplace/marketplaceTaxonomy";

export interface IMarketplaceReservation extends Document {
  reservationId: string;
  listingId: string;
  buyerOrganizationId: string;
  buyerUserId: string;
  quantity: number;
  status: ReservationStatus;
  expiresAt: Date;
  orderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MarketplaceReservationSchema = new Schema<IMarketplaceReservation>(
  {
    reservationId: { type: String, required: true, unique: true, index: true },
    listingId: { type: String, required: true, index: true },
    buyerOrganizationId: { type: String, required: true, index: true },
    buyerUserId: { type: String, required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "CANCELLED", "CONVERTED"],
      default: "ACTIVE",
      index: true,
    },
    expiresAt: { type: Date, required: true, index: true },
    orderId: { type: String },
  },
  { timestamps: true }
);

export const MarketplaceReservation: Model<IMarketplaceReservation> =
  mongoose.models.MarketplaceReservation ||
  mongoose.model<IMarketplaceReservation>(
    "MarketplaceReservation",
    MarketplaceReservationSchema
  );

export default MarketplaceReservation;
