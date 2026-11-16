import mongoose, { Schema, Document, Model } from "mongoose";

export type NotificationSeverity = "INFO" | "WARNING" | "ERROR" | "SUCCESS";
export type NotificationEntityType =
  | "ANALYSIS"
  | "REPORT"
  | "PASSPORT"
  | "LISTING"
  | "ORDER"
  | "SYSTEM";

export interface INotification extends Document {
  notificationId: string;
  userId?: string;
  organizationId: string;
  type: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  entityType: NotificationEntityType;
  entityId: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    notificationId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, index: true },
    organizationId: { type: String, required: true, index: true, default: "org-default" },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    severity: {
      type: String,
      enum: ["INFO", "WARNING", "ERROR", "SUCCESS"],
      default: "INFO",
    },
    entityType: {
      type: String,
      enum: ["ANALYSIS", "REPORT", "PASSPORT", "LISTING", "ORDER", "SYSTEM"],
      default: "SYSTEM",
    },
    entityId: { type: String, required: true, index: true },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

NotificationSchema.index({ organizationId: 1, read: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
