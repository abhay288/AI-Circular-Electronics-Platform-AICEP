import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { comparePassword } from "@/lib/auth";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { LoginSchema } from "@/lib/validation";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const parseResult = LoginSchema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse("VALIDATION_ERROR", parseResult.error.issues[0]?.message || "Invalid login credentials", 400);
    }

    const { email, password } = parseResult.data;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return errorResponse("INVALID_CREDENTIALS", "Invalid email or password", 401);
    }

    if (!user.isActive) {
      return errorResponse("ACCOUNT_DISABLED", "Your account has been deactivated. Please contact support.", 403);
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return errorResponse("INVALID_CREDENTIALS", "Invalid email or password", 401);
    }

    user.lastLoginAt = new Date();
    await user.save();

    const tokenPayload = {
      userId: String(user._id),
      email: user.email,
      role: user.role,
      organizationId: user.organizationId ? String(user.organizationId) : undefined,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    return successResponse({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error("[Auth Login Error]:", error);
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to authenticate user", 500);
  }
}
