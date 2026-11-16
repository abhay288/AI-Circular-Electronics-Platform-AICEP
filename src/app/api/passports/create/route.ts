import { NextRequest, NextResponse } from "next/server";
import { CreatePassportSchema } from "@/lib/validation";
import { getAuthUser } from "@/lib/auth";
import { DigitalPassportService } from "@/services/passport.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreatePassportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid passport creation parameters",
            details: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const authUser = await getAuthUser(req);
    const service = new DigitalPassportService();

    const passport = await service.createFromAnalysis(parsed.data.analysisId, {
      ...parsed.data,
      actor: authUser?.email || "System Operator",
      organizationId: authUser?.organizationId,
    });

    return NextResponse.json(
      {
        success: true,
        passport,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CREATION_FAILED",
          message: error.message || "Failed to create digital passport",
        },
      },
      { status: 500 }
    );
  }
}
