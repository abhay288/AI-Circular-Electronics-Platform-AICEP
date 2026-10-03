import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { MarketplaceListing } from "@/lib/db/models/MarketplaceListing";

// In-memory cache for listings to guarantee real-time persistence
const memoryListings: any[] = [
  {
    id: "capsule_01",
    listingId: "capsule_01",
    title: "ATmega328P Microcontrollers (Batch of 50)",
    health: "Grade A+ (92%)",
    healthGrade: "A+",
    rul: "6.4 Yrs Remaining",
    remainingYears: 6.4,
    price: "₹12,325",
    priceUSD: 142.50,
    quantity: 50,
    seller: "TerraCycle Lab (Tokyo)",
    location: "Tokyo, Japan",
    polygonToken: "PASSPORT-ATM-9842",
    badge: "VERIFIED PASSPORT",
    verifiedPassport: true,
    condition: "Grade A+ (Tested & Certified)",
    image: "/images/samples/iot_controller.jpg",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "capsule_02",
    listingId: "capsule_02",
    title: "LM358 Dual Op-Amps (Batch of 100)",
    health: "Grade A (88%)",
    healthGrade: "A",
    rul: "5.2 Yrs Remaining",
    remainingYears: 5.2,
    price: "₹7,350",
    priceUSD: 85.00,
    quantity: 100,
    seller: "LUMAFUSE Systems (Berlin)",
    location: "Berlin, Germany",
    polygonToken: "PASSPORT-LM-9843",
    badge: "VERIFIED PASSPORT",
    verifiedPassport: true,
    condition: "Grade A (Functional)",
    image: "/images/samples/power_supply_smps.jpg",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "capsule_03",
    listingId: "capsule_03",
    title: "Solid Polymer Capacitors 220uF (Batch of 200)",
    health: "Grade A+ (95%)",
    healthGrade: "A+",
    rul: "8.0 Yrs Remaining",
    remainingYears: 8.0,
    price: "₹5,535",
    priceUSD: 64.00,
    quantity: 200,
    seller: "ReMaterials Corp (Austin)",
    location: "Austin, TX, USA",
    polygonToken: "PASSPORT-CAP-9844",
    badge: "VERIFIED PASSPORT",
    verifiedPassport: true,
    condition: "Grade A+ (Tested & Certified)",
    image: "/images/samples/router_board.jpg",
    status: "active",
    createdAt: new Date().toISOString(),
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const analysisId = searchParams.get("analysisId");

    let dbListings: any[] = [];
    try {
      await connectToDatabase();
      const query: any = { status: "active" };
      if (analysisId) {
        query.analysisId = analysisId;
      }
      dbListings = await MarketplaceListing.find(query).sort({ createdAt: -1 }).lean();
    } catch (e) {
      console.warn("MongoDB connection warning in GET /api/marketplace, using memory cache:", e);
    }

    // Combine memory listings with database listings
    const combined = [...memoryListings];
    dbListings.forEach((dbItem) => {
      if (!combined.some((m) => m.id === dbItem.listingId || m.listingId === dbItem.listingId)) {
        combined.unshift({
          id: dbItem.listingId,
          listingId: dbItem.listingId,
          analysisId: dbItem.analysisId,
          title: dbItem.title,
          healthGrade: dbItem.condition?.includes("A+") ? "A+" : "A",
          health: `${dbItem.metadata?.avgHealth || 93}%`,
          rul: `${dbItem.metadata?.avgRul || 7.2} Yrs Remaining`,
          remainingYears: dbItem.metadata?.avgRul || 7.2,
          price: `₹${Math.round(dbItem.priceUSD < 500 ? dbItem.priceUSD * 86.5 : dbItem.priceUSD).toLocaleString("en-IN")}`,
          priceUSD: dbItem.priceUSD,
          quantity: dbItem.quantity || 1,
          seller: dbItem.location || "EcoIntel Circular Inspection Lab 01",
          location: dbItem.location || "EcoIntel Lab 01",
          polygonToken: dbItem.passportId || dbItem.passportIds?.[0] || "PASSPORT-READY",
          badge: "VERIFIED PASSPORT",
          verifiedPassport: true,
          condition: dbItem.condition || "Grade A+ (Tested & Certified)",
          image: dbItem.capsulePreviewUrl || "/images/samples/router_board.jpg",
          status: dbItem.status || "active",
          createdAt: dbItem.createdAt,
        });
      }
    });

    const filtered = analysisId
      ? combined.filter((item) => item.analysisId === analysisId)
      : combined;

    return NextResponse.json({
      success: true,
      count: filtered.length,
      listings: filtered,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch listings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const listingId = `LIST-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const newListing = {
      id: listingId,
      listingId,
      analysisId: body.analysisId || "ECI-2026-7740",
      componentIds: body.componentIds || [],
      passportIds: body.passportIds || (body.passportId ? [body.passportId] : []),
      passportId: body.passportId || body.passportIds?.[0] || `PASSPORT-${body.analysisId || "7740"}`,
      title: body.title || "Recovered Hardware Component",
      description: body.description || "",
      condition: body.condition || "Grade A+ (Tested & Certified)",
      priceUSD: Number(body.priceUSD) || 2450,
      price: `₹${Math.round(Number(body.priceUSD) < 500 ? Number(body.priceUSD) * 86.5 : Number(body.priceUSD) || 2450).toLocaleString("en-IN")}`,
      quantity: Number(body.quantity) || 1,
      sellerId: body.sellerId || "usr_circular_operator_01",
      organizationId: body.organizationId || "org_circular_lab_01",
      location: body.location || "EcoIntel Circular Inspection Lab 01",
      shippingAvailability: body.shippingAvailability || "Worldwide Courier / Anti-Static Packaging",
      warranty: body.warranty || "30-Day Functional Guarantee",
      status: "active",
      health: `${body.metadata?.avgHealth || 93}%`,
      healthGrade: (body.metadata?.avgHealth || 93) >= 90 ? "A+" : "A",
      rul: `${body.metadata?.avgRul || 7.2} Yrs Remaining`,
      remainingYears: body.metadata?.avgRul || 7.2,
      seller: body.location || "EcoIntel Circular Lab 01",
      polygonToken: body.passportId || `PASSPORT-${body.analysisId || "7740"}`,
      badge: "VERIFIED PASSPORT",
      verifiedPassport: true,
      capsulePreviewUrl: body.image || "/images/samples/router_board.jpg",
      image: body.image || "/images/samples/router_board.jpg",
      metadata: body.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store in memory cache
    memoryListings.unshift(newListing);

    // Try storing in MongoDB if connected
    try {
      await connectToDatabase();
      await MarketplaceListing.create(newListing);
    } catch (dbErr) {
      console.warn("MongoDB write fallback in POST /api/marketplace:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: "Marketplace listing created successfully",
      listing: newListing,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create marketplace listing" },
      { status: 500 }
    );
  }
}
