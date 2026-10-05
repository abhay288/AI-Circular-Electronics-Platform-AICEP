import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { MarketplaceListing } from "@/models/MarketplaceListing";
import { AnalysisSession } from "@/models/AnalysisSession";
import { Component } from "@/models/Component";
import { DigitalPassport } from "@/models/DigitalPassport";
import { generateListingId } from "@/lib/id-generator";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      analysisId,
      componentIds,
      title,
      description,
      condition,
      priceINR,
      priceUSD,
      quantity = 1,
      location = "Bangalore, India",
    } = body;

    if (!analysisId) {
      return errorResponse("VALIDATION_ERROR", "analysisId is required to list recovered hardware", 400);
    }

    if (!title || title.trim().length < 3) {
      return errorResponse("VALIDATION_ERROR", "Listing title must be at least 3 characters", 400);
    }

    if (priceINR === undefined || priceINR < 0) {
      return errorResponse("VALIDATION_ERROR", "A valid non-negative price in INR is required", 400);
    }

    if (quantity <= 0) {
      return errorResponse("VALIDATION_ERROR", "Quantity must be at least 1", 400);
    }

    // Verify analysis session exists
    const session = await AnalysisSession.findOne({
      $or: [{ analysisId }, { sessionId: analysisId }],
    });

    if (!session) {
      return errorResponse("ANALYSIS_NOT_FOUND", `Associated analysis '${analysisId}' was not found`, 404);
    }

    // Check if component exists and is not in critical condition
    const componentId = Array.isArray(componentIds) ? componentIds[0] : componentIds;
    if (componentId) {
      const comp = await Component.findOne({ analysisId: session.analysisId, $or: [{ _id: componentId }, { partNumber: componentId }, { name: componentId }] });
      if (comp && (comp.condition === "FAILED" || comp.healthScore < 50)) {
        return errorResponse("INVALID_CONDITION", "Components in degraded or failed condition cannot be listed on the marketplace", 422);
      }
    }

    const authUser = await getAuthUser(req);
    const sellerId = authUser?.userId || "system_certified_recovery_facility";

    // Attach passport if available
    const passport = await DigitalPassport.findOne({ analysisId: session.analysisId });

    const calculatedPriceUSD = priceUSD || +(priceINR / 86.5).toFixed(2);
    const listingId = generateListingId();

    const listing = await MarketplaceListing.create({
      listingId,
      analysisId: session.analysisId,
      componentId: componentId || "RECOVERED_BATCH",
      sellerId,
      title,
      description: description || `Recovered and tested circular electronic asset from analysis ${session.analysisId}`,
      category: "Tested Circular Components",
      condition: condition || "TESTED_WORKING",
      priceINR,
      priceUSD: calculatedPriceUSD,
      quantity,
      location,
      passportId: passport?.passportId || session.passportId,
      status: "ACTIVE",
    });

    return successResponse({ listingId: listing.listingId, listing }, 201);
  } catch (error: any) {
    console.error("[Create Marketplace Listing Error]:", error);
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to create marketplace listing", 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const analysisId = searchParams.get("analysisId");
    const status = searchParams.get("status") || "ACTIVE";

    const query: Record<string, any> = { status };
    if (analysisId) query.analysisId = analysisId;

    const listings = await MarketplaceListing.find(query).sort({ createdAt: -1 });

    return successResponse({ count: listings.length, listings });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to fetch listings", 500);
  }
}
