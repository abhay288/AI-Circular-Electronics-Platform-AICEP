import { NextRequest, NextResponse } from "next/server";
import { RevokePassportSchema } from "@/lib/validation";
import { getAuthUser } from "@/lib/auth";
import { DigitalPassportService } from "@/services/passport.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ passportId: string }> }
) {
  try {
    const { passportId } = await params;
    const body = await req.json();

    const parsed = RevokePassportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "A revocation reason is strictly required (min 5 characters)",
            details: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const authUser = await getAuthUser(req);
    const service = new DigitalPassportService();

    const updatedPassport = await service.revokePassport(passportId, {
      reason: parsed.data.reason,
      actor: authUser?.email || "Compliance Officer",
    });

    return NextResponse.json({
      success: true,
      passportId,
      status: updatedPassport.status,
      version: updatedPassport.version,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || "Failed to revoke passport" } },
      { status: 500 }
    );
  }
}
