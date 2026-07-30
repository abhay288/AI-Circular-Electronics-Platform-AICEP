import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { componentPartNumber, originFacility } = body;

    const passportId = `ECO-PASSPORT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const mockTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

    return NextResponse.json({
      success: true,
      passport: {
        passportId,
        polygonTransactionHash: mockTxHash,
        contractAddress: "0x3B82F6e71C7656EC7ab88b098defB751B7401B5f",
        tokenId: `${Math.floor(10000 + Math.random() * 90000)}`,
        componentPartNumber: componentPartNumber || "ATmega328P-PU",
        originFacility: originFacility || "TerraCycle Facility Lab 04",
        healthGrade: "A+",
        co2OffsetKg: 18.6,
        isVerified: true,
        polygonExplorerUrl: `https://polygonscan.com/tx/${mockTxHash}`,
        mintedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Blockchain passport minting error" }, { status: 500 });
  }
}
