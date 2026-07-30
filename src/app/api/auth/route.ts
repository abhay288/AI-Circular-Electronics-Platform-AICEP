import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, password, role } = body;

    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
      }

      // Mock production JWT token generation
      const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eco_intel_user_${Date.now()}`;
      
      return NextResponse.json({
        success: true,
        message: "Authentication successful",
        token: mockToken,
        user: {
          id: "usr_984201",
          email,
          name: email.split("@")[0].toUpperCase(),
          role: role || "RECYCLER",
          facilityName: "Global E-Waste Recovery Lab 01",
          polygonWalletAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
        },
      });
    }

    if (action === "register") {
      return NextResponse.json({
        success: true,
        message: "Account created successfully",
        user: {
          id: `usr_${Math.floor(Math.random() * 1000000)}`,
          email,
          role: role || "RECYCLER",
        },
      });
    }

    return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Authentication error" }, { status: 500 });
  }
}
