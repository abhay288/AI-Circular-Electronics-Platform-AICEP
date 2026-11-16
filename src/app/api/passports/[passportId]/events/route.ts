import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import DigitalPassport from "@/models/DigitalPassport";
import { AddPassportEventSchema } from "@/lib/validation";
import { getAuthUser } from "@/lib/auth";
import { DigitalPassportService } from "@/services/passport.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ passportId: string }> }
) {
  try {
    await connectDB();
    const { passportId } = await params;

    const passport = await DigitalPassport.findOne({ passportId }, { lifecycleEvents: 1, passportId: 1 }).lean();
    if (!passport) {
      return NextResponse.json(
        { success: false, error: { message: "Passport not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      passportId,
      events: passport.lifecycleEvents || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || "Failed to fetch events" } },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ passportId: string }> }
) {
  try {
    const { passportId } = await params;
    const body = await req.json();

    const parsed = AddPassportEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid lifecycle event input",
            details: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const authUser = await getAuthUser(req);
    const service = new DigitalPassportService();

    const updatedPassport = await service.addLifecycleEvent(passportId, {
      ...parsed.data,
      actor: authUser?.email || "Operator",
      organization: authUser?.organizationId,
    });

    return NextResponse.json({
      success: true,
      passportId,
      version: updatedPassport.version,
      contentHash: updatedPassport.verification.contentHash,
      events: updatedPassport.lifecycleEvents,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || "Failed to add lifecycle event" } },
      { status: 500 }
    );
  }
}
