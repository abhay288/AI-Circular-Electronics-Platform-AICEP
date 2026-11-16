import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { MarketplaceListingService } from "@/services/marketplace/marketplaceListing.service";
import { MarketplaceSearchService } from "@/services/marketplace/marketplaceSearch.service";
import { createListingSchema } from "@/lib/marketplace/marketplaceValidation";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { ListingSortOption } from "@/lib/marketplace/marketplaceTaxonomy";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const authUser = await getAuthUser(req);

    const q = searchParams.get("q") || undefined;
    const category = searchParams.get("category") || undefined;
    const condition = searchParams.get("condition") || undefined;
    const verificationStatus = searchParams.get("verificationStatus") || undefined;
    const manufacturer = searchParams.get("manufacturer") || undefined;
    const packageType = searchParams.get("packageType") || undefined;
    const minHealthScore = searchParams.get("minHealthScore") ? Number(searchParams.get("minHealthScore")) : undefined;
    const minRulYears = searchParams.get("minRulYears") ? Number(searchParams.get("minRulYears")) : undefined;
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
    const pricingType = (searchParams.get("pricingType") as any) || undefined;
    const currency = searchParams.get("currency") || undefined;
    const materialCandidate = searchParams.get("materialCandidate") || undefined;
    const country = searchParams.get("country") || undefined;
    const city = searchParams.get("city") || undefined;
    const inStockOnly = searchParams.get("inStockOnly") === "true";
    const hasPassport = searchParams.get("hasPassport") === "true";
    const sortBy = (searchParams.get("sortBy") as ListingSortOption) || "NEWEST";
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 12;

    const isAdmin = authUser?.role === "ADMIN";

    const results = await MarketplaceSearchService.search({
      q,
      category,
      condition,
      verificationStatus,
      manufacturer,
      packageType,
      minHealthScore,
      minRulYears,
      minPrice,
      maxPrice,
      pricingType,
      currency,
      materialCandidate,
      country,
      city,
      inStockOnly,
      hasPassport,
      sortBy,
      page,
      limit,
      isAdmin,
    });

    return successResponse(results);
  } catch (error: any) {
    console.error("[Marketplace Search Error]:", error);
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to search listings", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const parsed = createListingSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        parsed.error.issues.map((e: any) => `${e.path.join(".")}: ${e.message}`).join(", "),
        400
      );
    }

    const authUser = await getAuthUser(req);
    const sellerOrganizationId =
      authUser?.organizationId || (body.sellerOrganizationId as string) || "org_demo_circular";
    const sellerUserId = authUser?.userId || (body.sellerUserId as string) || "user_demo_circular";

    const listing = await MarketplaceListingService.createDraft(parsed.data as any, {
      sellerOrganizationId,
      sellerUserId,
    });

    return successResponse({ listingId: listing.listingId, listing }, 201);
  } catch (error: any) {
    console.error("[Create Marketplace Listing Error]:", error);
    return errorResponse("CREATE_FAILED", error.message || "Failed to create listing draft", 400);
  }
}
