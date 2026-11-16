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

    const passport = await DigitalPassport.findOne({ passportId }, { blockchain: 1, passportId: 1, verification: 1 }).lean();
    if (!passport) {
      return NextResponse.json(
        { success: false, error: { message: "Passport not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      passportId,
      blockchain: passport.blockchain,
      verification: passport.verification,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || "Failed to fetch blockchain data" } },
      { status: 500 }
    );
  }
}
