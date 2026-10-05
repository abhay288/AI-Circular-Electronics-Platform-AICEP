import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Organization } from "@/models/Organization";
import { hashPassword } from "@/lib/auth";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { RegisterSchema } from "@/lib/validation";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const parseResult = RegisterSchema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse("VALIDATION_ERROR", parseResult.error.issues[0]?.message || "Invalid registration data", 400);
    }

    const { name, email, password, role, organizationName } = parseResult.data;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse("USER_EXISTS", "A user with this email address already exists", 409);
    }

    let orgId = undefined;
    if (organizationName) {
      const org = await Organization.create({
        name: organizationName,
        plan: "PROFESSIONAL",
      });
      orgId = org._id;
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      organizationId: orgId,
      isActive: true,
      lastLoginAt: new Date(),
    });

    const tokenPayload = {
      userId: String(user._id),
      email: user.email,
      role: user.role,
      organizationId: user.organizationId ? String(user.organizationId) : undefined,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    return successResponse(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
        },
        accessToken,
        refreshToken,
      },
      201
    );
  } catch (error: any) {
    console.error("[Auth Register Error]:", error);
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to register user", 500);
  }
}
