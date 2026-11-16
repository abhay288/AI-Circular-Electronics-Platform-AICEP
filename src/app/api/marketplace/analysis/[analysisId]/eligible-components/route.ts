import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { MarketplaceListingService } from "@/services/marketplace/marketplaceListing.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    await connectDB();
    const { analysisId } = await params;

    if (!analysisId) {
      return errorResponse("VALIDATION_ERROR", "Analysis ID is required", 400);
    }

    const result = await MarketplaceListingService.getEligibleComponentsFromAnalysis(analysisId);

    return successResponse(result);
  } catch (error: any) {
    return errorResponse("FETCH_FAILED", error.message || "Failed to fetch eligible components", 500);
  }
}
