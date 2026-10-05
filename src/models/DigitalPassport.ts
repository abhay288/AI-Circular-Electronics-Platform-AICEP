import mongoose, { Schema, Model } from "mongoose";

export type BlockchainStatus =
  | "READY"
  | "PENDING"
  | "MINTED"
  | "VERIFIED"
  | "FAILED";

export interface IDigitalPassport {
  passportId: string;
  analysisId: string;
  componentId?: string;
  deviceOrigin: string;
  recoveryDate: Date;
  healthScore: number;
  estimatedRUL: {
    hours: number;
    years: number;
  };
  repairHistory: Array<{
    date: Date;
    action: string;
    technician: string;
  }>;
  reuseCount: number;
  ownershipHistory: Array<{
    owner: string;
    timestamp: Date;
  }>;
  blockchainStatus: BlockchainStatus;
  statusLabel: string;
  network: string;
  contractAddress?: string;
  tokenId?: string;
  transactionHash?: string;
  verificationUrl?: string;
  qrCode?: string;
  ipfsHash?: string;
  provider: "MOCK" | "POLYGON";
  createdAt?: Date;
  updatedAt?: Date;
}

const DigitalPassportSchema = new Schema<IDigitalPassport>(
  {
    passportId: { type: String, required: true, unique: true, index: true },
    analysisId: { type: String, required: true, index: true },
    componentId: { type: String },
    deviceOrigin: { type: String, required: true },
    recoveryDate: { type: Date, default: Date.now },
    healthScore: { type: Number, default: 94 },
    estimatedRUL: {
      hours: { type: Number, default: 42000 },
      years: { type: Number, default: 4.8 },
    },
    repairHistory: { type: Schema.Types.Mixed, default: [] },
    reuseCount: { type: Number, default: 1 },
    ownershipHistory: { type: Schema.Types.Mixed, default: [] },
    blockchainStatus: {
      type: String,
      enum: ["READY", "PENDING", "MINTED", "VERIFIED", "FAILED"],
      default: "READY",
    },
    statusLabel: { type: String, default: "Passport Ready (Verification Pending)" },
    network: { type: String, default: "Polygon POS Testnet (Amoy)" },
    contractAddress: { type: String },
    tokenId: { type: String },
    transactionHash: { type: String },
    verificationUrl: { type: String },
    qrCode: { type: String },
    ipfsHash: { type: String },
    provider: {
      type: String,
      enum: ["MOCK", "POLYGON"],
      default: "MOCK",
    },
  },
  { timestamps: true }
);

export const DigitalPassport: Model<IDigitalPassport> =
  mongoose.models.DigitalPassport ||
  mongoose.model<IDigitalPassport>("DigitalPassport", DigitalPassportSchema);

export default DigitalPassport;
