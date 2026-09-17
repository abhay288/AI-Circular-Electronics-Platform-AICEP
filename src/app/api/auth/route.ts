import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { action, email, password, role, name, organization } = body;

    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
      }

      // Mock production JWT token generation
      const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eco_intel_user_${Date.now()}`;
      
      const user = await User.findOne({ email });

      if (!user) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        message: "Authentication successful",
        token: mockToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          organization: user.organization,
          walletAddress: user.walletAddress,
          verificationStatus: user.verificationStatus
        },
      });
    }

    if (action === "register") {
      if (!email || !password || !name) {
        return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return NextResponse.json({ error: "User already exists" }, { status: 400 });
      }

      const user = await User.create({
        email,
        name,
        role: role || "buyer",
        organization,
        verificationStatus: "pending"
      });

      return NextResponse.json({
        success: true,
        message: "Account created successfully",
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    }

    return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Authentication error" }, { status: 500 });
  }
}
