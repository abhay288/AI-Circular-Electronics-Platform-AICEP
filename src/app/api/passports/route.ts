import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { BlockchainPassport } from "@/lib/db/models/BlockchainPassport";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { componentId, componentPartNumber, originFacility } = body;

    const passportId = `ECO-PASSPORT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const mockTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
    const tokenId = `${Math.floor(10000 + Math.random() * 90000)}`;

    const passport = await BlockchainPassport.create({
      passportId,
      tokenId,
      contractAddress: "0x3B82F6e71C7656EC7ab88b098defB751B7401B5f",
      componentId: componentId || new mongoose.Types.ObjectId(), // mock if missing
      network: "Polygon POS",
      originFacility: originFacility || "TerraCycle Facility Lab 04",
      manufactureYear: 2026,
      reuseCycleCount: 1,
      verificationHash: mockTxHash,
      ipfsMetadataUri: `ipfs://mockhash${tokenId}`,
      isVerified: true,
    });

    return NextResponse.json({
      success: true,
      passport: {
        passportId: passport.passportId,
        polygonTransactionHash: passport.verificationHash,
        contractAddress: passport.contractAddress,
        tokenId: passport.tokenId,
        componentPartNumber: componentPartNumber || "ATmega328P-PU",
        originFacility: passport.originFacility,
        healthGrade: "A+",
        co2OffsetKg: 18.6,
        isVerified: passport.isVerified,
        polygonExplorerUrl: `https://polygonscan.com/tx/${passport.verificationHash}`,
        mintedAt: passport.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Blockchain passport minting error" }, { status: 500 });
  }
}
