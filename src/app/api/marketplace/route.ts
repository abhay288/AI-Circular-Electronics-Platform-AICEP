import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { MarketplaceListing } from "@/lib/db/models/MarketplaceListing";
import "@/lib/db/models/User"; // Ensure User model is loaded for population
import "@/lib/db/models/Component"; // Ensure Component model is loaded for population

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const listings = await MarketplaceListing.find({ status: "active" })
      .populate("sellerId", "name location")
      .populate("componentId", "healthScore remainingLifespanHours")
      .lean();

    // Transform data to match existing frontend expectations
    const formattedListings = listings.map((listing: any) => ({
      id: listing.listingId,
      title: listing.title,
      healthGrade: listing.componentId?.healthScore > 90 ? "A+" : "A",
      remainingYears: listing.componentId?.remainingLifespanHours ? parseFloat((listing.componentId.remainingLifespanHours / 8760).toFixed(1)) : 0,
      priceUSD: listing.priceUSD,
      polygonTokenId: listing.blockchainTxHash || "N/A",
      seller: listing.sellerId?.name || "Unknown Seller",
      location: listing.sellerId?.location || "Unknown Location",
      verifiedPassport: !!listing.passportId,
      image: listing.capsulePreviewUrl || "/images/marketplace/default.png",
    }));

    return NextResponse.json({ success: true, count: formattedListings.length, listings: formattedListings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Marketplace listing fetch error" }, { status: 500 });
  }
}
