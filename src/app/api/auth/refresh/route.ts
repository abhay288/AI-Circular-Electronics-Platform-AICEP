import { NextRequest } from "next/server";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const refreshToken = body.refreshToken;

    if (!refreshToken) {
      return errorResponse("REFRESH_TOKEN_REQUIRED", "Refresh token must be provided", 400);
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return errorResponse("INVALID_REFRESH_TOKEN", "Expired or invalid refresh token", 401);
    }

    const tokenPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      organizationId: payload.organizationId,
    };

    const newAccessToken = signAccessToken(tokenPayload);
    const newRefreshToken = signRefreshToken(tokenPayload);

    return successResponse({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to refresh token", 500);
  }
}
