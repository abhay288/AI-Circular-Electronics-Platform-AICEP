import { NextRequest, NextResponse } from "next/server";
import { TransferPassportSchema } from "@/lib/validation";
import { getAuthUser } from "@/lib/auth";
import { DigitalPassportService } from "@/services/passport.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ passportId: string }> }
) {
  try {
    const { passportId } = await params;
    const body = await req.json();

    const parsed = TransferPassportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid transfer input",
            details: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const authUser = await getAuthUser(req);
    const service = new DigitalPassportService();

    const updatedPassport = await service.transferOwnership(passportId, {
      newOwner: parsed.data.newOwner,
      reason: parsed.data.reason,
      actor: authUser?.email || "Transfer Agent",
    });

    return NextResponse.json({
      success: true,
      passportId,
      status: updatedPassport.status,
      version: updatedPassport.version,
      currentOwner: updatedPassport.ownershipHistory.currentOwner,
      transfers: updatedPassport.ownershipHistory.transfers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || "Failed to transfer ownership" } },
      { status: 500 }
    );
  }
}
