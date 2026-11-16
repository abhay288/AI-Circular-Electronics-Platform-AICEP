import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Report } from "@/models/Report";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    await connectDB();
    const { analysisId } = await params;

    const reports = await Report.find({ analysisId })
      .sort({ generatedAt: -1, version: -1 })
      .lean();

    return successResponse({ reports });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to retrieve analysis reports", 500);
  }
}
