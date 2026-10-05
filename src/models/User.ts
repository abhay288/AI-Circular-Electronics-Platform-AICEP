import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole =
  | "ADMIN"
  | "RESEARCHER"
  | "REPAIR_CENTER"
  | "MANUFACTURER"
  | "RECYCLER"
  | "LAB_OPERATOR"
  | "MARKETPLACE_SELLER";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  organizationId?: mongoose.Types.ObjectId | string;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: [
        "ADMIN",
        "RESEARCHER",
        "REPAIR_CENTER",
        "MANUFACTURER",
        "RECYCLER",
        "LAB_OPERATOR",
        "MARKETPLACE_SELLER",
      ],
      default: "RESEARCHER",
      index: true,
    },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
