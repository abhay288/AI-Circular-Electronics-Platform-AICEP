import { NextRequest } from "next/server";
import { GlobalSearchService } from "@/services/search.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const organizationId = searchParams.get("organizationId") || undefined;
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "20", 10)));

    if (!query.trim()) {
      return successResponse({ results: [], query: "" });
    }

    const results = await GlobalSearchService.search(query, organizationId, limit);
    return successResponse({
      query,
      count: results.length,
      results,
    });
  } catch (error: any) {
    console.error("[Global Search Error]:", error);
    return errorResponse("SEARCH_FAILED", error.message || "Failed to execute search", 500);
  }
}
