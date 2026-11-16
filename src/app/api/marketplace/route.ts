import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { MarketplaceListing } from "@/models/MarketplaceListing";
import { MarketplaceSearchService } from "@/services/marketplace/marketplaceSearch.service";
import { MarketplaceListingService } from "@/services/marketplace/marketplaceListing.service";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const q = searchParams.get("search") || searchParams.get("q") || undefined;
    const category = searchParams.get("category") || undefined;
    const condition = searchParams.get("condition") || undefined;
    const verificationStatus = searchParams.get("verificationStatus") || undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 12;

    const result = await MarketplaceSearchService.search({
      q,
      category,
      condition,
      verificationStatus,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      listings: result.listings,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      facets: result.facets,
    });
  } catch (error: any) {
    console.error("GET /api/marketplace error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load marketplace listings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const authUser = await getAuthUser(req);

    const sellerOrganizationId =
      authUser?.organizationId || body.organizationId || body.sellerOrganizationId || "org_demo_circular";
    const sellerUserId = authUser?.userId || body.sellerId || body.sellerUserId || "user_demo_circular";

    // Direct create draft or publish
    const listing = await MarketplaceListingService.createDraft(
      {
        analysisId: body.analysisId,
        componentId: body.componentId || (Array.isArray(body.componentIds) ? body.componentIds[0] : undefined),
        passportId: body.passportId,
        title: body.title || "Recovered Circular Component Batch",
        description: body.description || "Circular component recovered and assessed by EcoIntel platform.",
        category: body.category || "Tested Circular Components",
        subcategory: body.subcategory,
        manufacturer: body.manufacturer,
        partNumber: body.partNumber,
        packageType: body.packageType,
        condition: body.condition || "USED_TESTED",
        quantity: Number(body.quantity) || 1,
        pricingType: body.pricingType || (body.priceINR !== undefined ? "FIXED_PRICE" : "REQUEST_QUOTE"),
        price: body.priceINR !== undefined ? Number(body.priceINR) : body.priceUSD ? Number(body.priceUSD) * 86.5 : undefined,
        currency: body.currency || "INR",
        images: body.image ? [body.image] : body.images,
      },
      {
        sellerOrganizationId,
        sellerUserId,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Marketplace listing created successfully",
      listing,
    });
  } catch (error: any) {
    console.error("POST /api/marketplace error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create marketplace listing" },
      { status: 500 }
    );
  }
}
