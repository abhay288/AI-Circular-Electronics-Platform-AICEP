import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Organization } from "@/models/Organization";
import { requireAuth } from "@/middleware/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export const GET = requireAuth(async (req: NextRequest, tokenUser) => {
  try {
    if (tokenUser.userId === "public-guest") {
      return successResponse({
        user: {
          id: "public-guest",
          name: "Public Electronics Analyst",
          email: "public@ecointel.org",
          role: "OPERATOR",
          isAnonymous: true,
        },
        organization: {
          name: "EcoIntel Open Public Lab",
          tier: "PUBLIC_OPEN",
        },
      });
    }

    await connectDB();
    const user = await User.findById(tokenUser.userId).select("-passwordHash");
    if (!user) {
      return successResponse({
        user: {
          id: "public-guest",
          name: "Public Electronics Analyst",
          email: "public@ecointel.org",
          role: "OPERATOR",
          isAnonymous: true,
        },
        organization: null,
      });
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
