import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { AuditLog } from "@/models/AuditLog";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "30", 10)));

    const query: any = {};
    if (organizationId && organizationId !== "all") {
      query.organizationId = organizationId;
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return successResponse({
      count: logs.length,
      logs,
    });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to fetch activity logs", 500);
  }
}
