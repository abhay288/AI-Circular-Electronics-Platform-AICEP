import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Organization } from "@/models/Organization";
import { requireAuth } from "@/middleware/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export const GET = requireAuth(async (req: NextRequest, tokenUser) => {
  try {
    await connectDB();
    const user = await User.findById(tokenUser.userId).select("-passwordHash");
    if (!user) {
      return errorResponse("USER_NOT_FOUND", "User profile not found", 404);
    }

    let organization = null;
    if (user.organizationId) {
      organization = await Organization.findById(user.organizationId);
    }

    return successResponse({
      user,
      organization,
    });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to fetch user profile", 500);
  }
});
