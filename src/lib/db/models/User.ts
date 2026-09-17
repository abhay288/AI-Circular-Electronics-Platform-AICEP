import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  role: "admin" | "recycler" | "manufacturer" | "researcher" | "buyer";
  organization?: string;
  apiKey?: string;
  walletAddress?: string;
  location?: string;
  verificationStatus?: "pending" | "verified" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "recycler", "manufacturer", "researcher", "buyer"],
      default: "buyer",
    },
    organization: { type: String },
    apiKey: { type: String, unique: true, sparse: true },
    walletAddress: { type: String },
    location: { type: String },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
