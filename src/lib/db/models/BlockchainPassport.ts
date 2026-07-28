import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBlockchainPassport extends Document {
  passportId: string; // e.g. EINT-PASSPORT-88392
  tokenId: string; // Polygon ERC-721 token ID
  contractAddress: string;
  componentId: mongoose.Types.ObjectId;
  network: "Polygon POS" | "Polygon zkEVM" | "Ethereum Mainnet";
  originFacility: string;
  manufactureYear: number;
  reuseCycleCount: number;
  verificationHash: string;
  ipfsMetadataUri: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BlockchainPassportSchema: Schema<IBlockchainPassport> = new Schema(
  {
    passportId: { type: String, required: true, unique: true, index: true },
    tokenId: { type: String, required: true },
    contractAddress: { type: String, required: true },
    componentId: { type: Schema.Types.ObjectId, ref: "Component", required: true },
    network: {
      type: String,
      enum: ["Polygon POS", "Polygon zkEVM", "Ethereum Mainnet"],
      default: "Polygon POS",
    },
    originFacility: { type: String, required: true },
    manufactureYear: { type: Number, required: true },
    reuseCycleCount: { type: Number, default: 1 },
    verificationHash: { type: String, required: true },
    ipfsMetadataUri: { type: String, required: true },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const BlockchainPassport: Model<IBlockchainPassport> =
  mongoose.models.BlockchainPassport ||
  mongoose.model<IBlockchainPassport>("BlockchainPassport", BlockchainPassportSchema);
