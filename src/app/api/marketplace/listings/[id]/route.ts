import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { MarketplaceListing } from "@/models/MarketplaceListing";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const listing = await MarketplaceListing.findOne({
      $or: [{ listingId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!listing) {
      return errorResponse("LISTING_NOT_FOUND", `Listing '${id}' was not found`, 404);
    }

    return successResponse({ listing });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to fetch listing", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const listing = await MarketplaceListing.findOneAndUpdate(
      { $or: [{ listingId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
      { $set: body },
      { new: true }
    );

    if (!listing) {
      return errorResponse("LISTING_NOT_FOUND", `Listing '${id}' was not found`, 404);
    }

    return successResponse({ listing });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to update listing", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const listing = await MarketplaceListing.findOneAndUpdate(
      { $or: [{ listingId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
      { $set: { status: "UNLISTED" } },
      { new: true }
    );

    if (!listing) {
      return errorResponse("LISTING_NOT_FOUND", `Listing '${id}' was not found`, 404);
    }

    return successResponse({ message: `Listing '${id}' unlisted successfully`, listing });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to delete listing", 500);
  }
}
