import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import DigitalPassport from "@/models/DigitalPassport";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ passportId: string }> }
) {
  try {
    await connectDB();
    const { passportId } = await params;
    const authUser = await getAuthUser(req);

    const passport = await DigitalPassport.findOne({ passportId });
    if (!passport) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `Digital passport '${passportId}' not found`,
          },
        },
        { status: 404 }
      );
    }

    // Organization isolation enforcement for private authenticated view
    if (authUser && authUser.role !== "ADMIN" && authUser.organizationId) {
      if (passport.organizationId && passport.organizationId !== authUser.organizationId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Access denied. Passport belongs to another organization.",
            },
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      passport,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: { message: error.message || "Failed to fetch passport" },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ passportId: string }> }
) {
  try {
    await connectDB();
    const { passportId } = await params;
    const authUser = await getAuthUser(req);
    const body = await req.json();

    const passport = await DigitalPassport.findOne({ passportId });
    if (!passport) {
      return NextResponse.json(
        { success: false, error: { message: "Passport not found" } },
        { status: 404 }
      );
    }

    if (authUser && authUser.role !== "ADMIN" && authUser.organizationId) {
      if (passport.organizationId && passport.organizationId !== authUser.organizationId) {
        return NextResponse.json(
          { success: false, error: { message: "Unauthorized for this organization" } },
          { status: 403 }
        );
      }
    }

    if (body.metadata) {
      passport.metadata = { ...passport.metadata, ...body.metadata };
      passport.markModified("metadata");
    }

    if (body.identity?.serialNumber) {
      passport.identity.serialNumber = body.identity.serialNumber;
      passport.markModified("identity");
    }

    await passport.save();

    return NextResponse.json({
      success: true,
      passport,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || "Failed to update passport" } },
      { status: 500 }
    );
  }
}
