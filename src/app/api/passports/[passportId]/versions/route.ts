import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import DigitalPassport from "@/models/DigitalPassport";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ passportId: string }> }
) {
  try {
    await connectDB();
    const { passportId } = await params;

    const passport = await DigitalPassport.findOne({ passportId }, { versionHistory: 1, version: 1, passportId: 1 }).lean();
    if (!passport) {
      return NextResponse.json(
        { success: false, error: { message: "Passport not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      passportId,
      currentVersion: passport.version,
      versions: passport.versionHistory || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || "Failed to fetch versions" } },
      { status: 500 }
    );
  }
}
