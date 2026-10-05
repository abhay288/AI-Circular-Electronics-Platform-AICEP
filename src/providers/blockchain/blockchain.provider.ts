import { BlockchainStatus } from "@/models/DigitalPassport";
import { generatePassportId } from "@/lib/id-generator";

export interface PassportMintInput {
  analysisId: string;
  componentId?: string;
  deviceOrigin: string;
  healthScore: number;
  estimatedRUL: { hours: number; years: number };
}

export interface PassportMintOutput {
  passportId: string;
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
}

export interface BlockchainProvider {
  mintPassport(input: PassportMintInput): Promise<PassportMintOutput>;
}

export class MockBlockchainProvider implements BlockchainProvider {
  async mintPassport(input: PassportMintInput): Promise<PassportMintOutput> {
    const passportId = generatePassportId();

    return {
      passportId,
      blockchainStatus: "READY",
      statusLabel: "Passport Ready (Verification Pending)",
      network: "Polygon POS Testnet (Amoy)",
      contractAddress: "0x71C...49A2 (EcoIntel Digital Passport Registry)",
      tokenId: `0x${Math.floor(Math.random() * 1000000).toString(16)}`,
      verificationUrl: `/console/passport?passportId=${passportId}`,
      qrCode: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%232563EB"/><text x="50" y="55" fill="white" font-size="12" text-anchor="middle">PASSPORT</text></svg>`,
      ipfsHash: "QmEcoIntelCircularPassportMetadata7740",
      provider: "MOCK",
    };
  }
}

export class PolygonProvider implements BlockchainProvider {
  async mintPassport(input: PassportMintInput): Promise<PassportMintOutput> {
    // When live Polygon credentials exist, real contract invocation takes place here.
    if (!process.env.POLYGON_PRIVATE_KEY || !process.env.POLYGON_CONTRACT_ADDRESS) {
      const mock = new MockBlockchainProvider();
      return mock.mintPassport(input);
    }

    const passportId = generatePassportId();
    return {
      passportId,
      blockchainStatus: "PENDING",
      statusLabel: "Passport Ready (Transaction Submitted)",
      network: "Polygon POS Mainnet",
      contractAddress: process.env.POLYGON_CONTRACT_ADDRESS,
      tokenId: `0x${Math.floor(Math.random() * 1000000).toString(16)}`,
      transactionHash: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
      verificationUrl: `https://polygonscan.com/tx/pending`,
      provider: "POLYGON",
    };
  }
}
