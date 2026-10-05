import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  analysisId?: string;
  userId?: string;
  organizationId?: string;
  action: string;
  resource: string;
  resourceId: string;
  ip?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    analysisId: { type: String, index: true },
    userId: { type: String, index: true },
    organizationId: { type: String },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: { type: String, required: true },
    ip: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;
