import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import DigitalPassport from "@/models/DigitalPassport";
import { DigitalPassportService } from "@/services/passport.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ passportId: string }> }
) {
  try {
    await connectDB();
    const { passportId } = await params;

    const passport = await DigitalPassport.findOne({ passportId });
    if (!passport) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `Public passport '${passportId}' not found`,
          },
        },
        { status: 404 }
      );
    }

    const service = new DigitalPassportService();
    const publicView = service.getPublicView(passport);

    return NextResponse.json({
      success: true,
      passport: publicView,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || "Failed to fetch public passport" } },
      { status: 500 }
    );
  }
}
