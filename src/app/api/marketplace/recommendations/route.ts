import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { MarketplaceRecommendationService } from "@/services/marketplace/marketplaceRecommendation.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get("listingId");

    if (!listingId) {
      return errorResponse("VALIDATION_ERROR", "listingId query param is required", 400);
    }

    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 4;

    const recommendations = await MarketplaceRecommendationService.getRecommendations(listingId, limit);

    return successResponse({ recommendations });
  } catch (error: any) {
    return errorResponse("FETCH_FAILED", error.message || "Failed to fetch recommendations", 500);
  }
}
