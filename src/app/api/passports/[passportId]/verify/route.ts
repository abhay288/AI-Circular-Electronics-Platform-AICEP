import { NextRequest, NextResponse } from "next/server";
import { DigitalPassportService } from "@/services/passport.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ passportId: string }> }
) {
  try {
    const { passportId } = await params;
    const service = new DigitalPassportService();

    const verificationResult = await service.verifyIntegrity(passportId);

    return NextResponse.json({
      success: true,
      verification: verificationResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VERIFICATION_FAILED",
          message: error.message || "Failed to verify digital passport",
        },
      },
      { status: 500 }
    );
  }
}
