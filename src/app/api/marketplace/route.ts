import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const listings = [
      {
        id: "mkt_capsule_01",
        title: "ATmega328P Microcontroller (Batch of 50)",
        healthGrade: "A+",
        remainingYears: 6.4,
        priceUSD: 142.5,
        polygonTokenId: "98421",
        seller: "TerraCycle E-Waste Lab",
        location: "Tokyo, Japan",
        verifiedPassport: true,
        image: "/images/marketplace/microchip_capsule.png",
      },
      {
        id: "mkt_capsule_02",
        title: "LM358 Dual Operational Amplifiers (Batch of 100)",
        healthGrade: "A",
        remainingYears: 5.2,
        priceUSD: 85.0,
        polygonTokenId: "98422",
        seller: "LUMAFUSE Systems",
        location: "Berlin, Germany",
        verifiedPassport: true,
        image: "/images/marketplace/opamp_capsule.png",
      },
      {
        id: "mkt_capsule_03",
        title: "Solid Polymer Capacitors 220uF (Batch of 200)",
        healthGrade: "A+",
        remainingYears: 8.0,
        priceUSD: 64.0,
        polygonTokenId: "98423",
        seller: "ReMaterials Corp",
        location: "Austin, TX, USA",
        verifiedPassport: true,
        image: "/images/marketplace/capacitor_capsule.png",
      },
    ];

    return NextResponse.json({ success: true, count: listings.length, listings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Marketplace listing fetch error" }, { status: 500 });
  }
}
