import { NextRequest, NextResponse } from "next/server";
import { DigitalPassportService } from "@/services/passport.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ passportId: string }> }
) {
  try {
    const { passportId } = await params;
    const service = new DigitalPassportService();

    const passport = await service.registerOnBlockchain(passportId);

    return NextResponse.json({
      success: true,
      passportId,
      blockchain: passport.blockchain,
      verificationStatus: passport.verification.verificationStatus,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BLOCKCHAIN_REGISTRATION_FAILED",
          message: error.message || "Failed to anchor passport to blockchain",
        },
      },
      { status: 500 }
    );
  }
}
