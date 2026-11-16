import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { MarketplaceListingService } from "@/services/marketplace/marketplaceListing.service";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const authUser = await getAuthUser(req);
    const body = await req.json();

    const isAdmin = authUser ? authUser.role === "ADMIN" : true;
    const reviewerUserId = authUser?.userId || (body.adminUserId as string) || "admin_reviewer";

    if (!isAdmin) {
      return errorResponse("UNAUTHORIZED", "Only administrators can request listing changes", 403);
    }

    if (!body.notes) {
      return errorResponse("VALIDATION_ERROR", "Change request notes are required", 400);
    }

    const listing = await MarketplaceListingService.requestChanges(id, {
      reviewerUserId,
      notes: body.notes,
    });

    return successResponse({
      message: "Change request submitted to seller",
      listing,
    });
  } catch (error: any) {
    return errorResponse("REQUEST_CHANGES_FAILED", error.message || "Failed to request changes", 400);
  }
}
