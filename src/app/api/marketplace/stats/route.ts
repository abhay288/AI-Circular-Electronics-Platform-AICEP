import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { MarketplaceSearchService } from "@/services/marketplace/marketplaceSearch.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const stats = await MarketplaceSearchService.getMarketplaceStats();
    return successResponse({ stats });
  } catch (error: any) {
    return errorResponse("FETCH_FAILED", error.message || "Failed to fetch marketplace statistics", 500);
  }
}
