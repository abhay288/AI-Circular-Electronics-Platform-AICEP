import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import DigitalPassport from "@/models/DigitalPassport";
import { getAuthUser } from "@/lib/auth";
import { DigitalPassportService } from "@/services/passport.service";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const authUser = await getAuthUser(req);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const assetType = searchParams.get("assetType") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const skip = (page - 1) * limit;

    const query: any = {};

    // Organization isolation: Non-admin users can only view passports for their organization
    if (authUser && authUser.role !== "ADMIN" && authUser.organizationId) {
      query.organizationId = authUser.organizationId;
    }

    if (status) {
      query.status = status;
    }

    if (assetType) {
      query.assetType = assetType;
    }

    if (search) {
      query.$or = [
        { passportId: { $regex: search, $options: "i" } },
        { assetId: { $regex: search, $options: "i" } },
        { analysisId: { $regex: search, $options: "i" } },
        { "identity.assetName": { $regex: search, $options: "i" } },
        { "identity.serialNumber": { $regex: search, $options: "i" } },
        { "identity.partNumber": { $regex: search, $options: "i" } },
      ];
    }

    const [passports, total] = await Promise.all([
      DigitalPassport.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      DigitalPassport.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      passports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || "Failed to list passports" } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const authUser = await getAuthUser(req);
    const passportService = new DigitalPassportService();

    if (!body.analysisId) {
      return NextResponse.json(
        { success: false, error: { message: "analysisId is required" } },
        { status: 400 }
      );
    }

    const passport = await passportService.createFromAnalysis(body.analysisId, {
      ...body,
      actor: authUser?.email || "System",
      organizationId: authUser?.organizationId || body.organizationId,
    });

    return NextResponse.json({
      success: true,
      passport,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || "Failed to create passport" } },
      { status: 500 }
    );
  }
}
