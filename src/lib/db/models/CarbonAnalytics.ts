import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICarbonAnalytics extends Document {
  facilityId: string;
  co2SavedKg: number;
  energySavedKWh: number;
  waterSavedLiters: number;
  eWasteDivertedKg: number;
  componentsReusedTotal: number;
  recordedMonth: string; // YYYY-MM
  createdAt: Date;
  updatedAt: Date;
}

const CarbonAnalyticsSchema: Schema<ICarbonAnalytics> = new Schema(
  {
    facilityId: { type: String, required: true, index: true },
    co2SavedKg: { type: Number, required: true },
    energySavedKWh: { type: Number, required: true },
    waterSavedLiters: { type: Number, required: true },
    eWasteDivertedKg: { type: Number, required: true },
    componentsReusedTotal: { type: Number, required: true },
    recordedMonth: { type: String, required: true },
  },
  { timestamps: true }
);

export const CarbonAnalytics: Model<ICarbonAnalytics> =
  mongoose.models.CarbonAnalytics ||
  mongoose.model<ICarbonAnalytics>("CarbonAnalytics", CarbonAnalyticsSchema);
