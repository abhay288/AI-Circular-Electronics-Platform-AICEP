import mongoose, { Schema, Document, Model } from "mongoose";

export interface IComponentMaterial {
  goldGrams: number;
  silverGrams: number;
  copperGrams: number;
  palladiumGrams: number;
  estimatedRecoveryValueUSD: number;
}

export interface IComponent extends Document {
  serialNumber: string;
  name: string;
  type: "CPU" | "GPU" | "RAM" | "Chipset" | "Capacitor" | "PowerFET" | "CustomIC";
  manufacturer: string;
  healthScore: number; // 0 - 100
  remainingUsefulLifeHours: number;
  confidenceScore: number; // 0 - 1.0 AI confidence
  materials: IComponentMaterial;
  status: "detected" | "reconstructed" | "refurbished" | "recycled" | "listed";
  detectedAtPCBId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ComponentSchema: Schema<IComponent> = new Schema(
  {
    serialNumber: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["CPU", "GPU", "RAM", "Chipset", "Capacitor", "PowerFET", "CustomIC"],
      required: true,
    },
    manufacturer: { type: String, required: true },
    healthScore: { type: Number, required: true, min: 0, max: 100 },
    remainingUsefulLifeHours: { type: Number, required: true },
    confidenceScore: { type: Number, required: true, min: 0, max: 1 },
    materials: {
      goldGrams: { type: Number, default: 0 },
      silverGrams: { type: Number, default: 0 },
      copperGrams: { type: Number, default: 0 },
      palladiumGrams: { type: Number, default: 0 },
      estimatedRecoveryValueUSD: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ["detected", "reconstructed", "refurbished", "recycled", "listed"],
      default: "detected",
    },
    detectedAtPCBId: { type: Schema.Types.ObjectId, ref: "PcbAnalysis" },
  },
  { timestamps: true }
);

export const Component: Model<IComponent> =
  mongoose.models.Component || mongoose.model<IComponent>("Component", ComponentSchema);
