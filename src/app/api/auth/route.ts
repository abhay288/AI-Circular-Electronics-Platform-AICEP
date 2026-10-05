import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { hashPassword, comparePassword } from "@/lib/auth";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { action, email, password, role, name, organization } = body;

    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
      }

      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const tokenPayload = {
        userId: String(user._id),
        email: user.email,
        role: user.role,
        organizationId: user.organizationId ? String(user.organizationId) : undefined,
      };

      const token = signAccessToken(tokenPayload);
      const refreshToken = signRefreshToken(tokenPayload);

      return NextResponse.json({
        success: true,
        message: "Authentication successful",
        token,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
        },
      });
    }

    if (action === "register") {
      if (!email || !password || !name) {
        return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 });
      }

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return NextResponse.json({ error: "User already exists" }, { status: 400 });
      }

      const passwordHash = await hashPassword(password);

      const user = await User.create({
        email: email.toLowerCase(),
        name,
        passwordHash,
        role: role ? role.toUpperCase() : "RESEARCHER",
      });

      const tokenPayload = {
        userId: String(user._id),
        email: user.email,
        role: user.role,
      };

      const token = signAccessToken(tokenPayload);

      return NextResponse.json({
        success: true,
        message: "Account created successfully",
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    }

    return NextResponse.json({ error: "Invalid action type. Expected 'login' or 'register'" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Authentication error" }, { status: 500 });
  }
}
