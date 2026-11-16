import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Report } from "@/models/Report";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    await connectDB();
    const { reportId } = await params;

    const report = await Report.findOne({ reportId }).lean();
    if (!report) {
      return errorResponse("REPORT_NOT_FOUND", `Report '${reportId}' was not found.`, 404);
    }

    return successResponse({ report });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to retrieve report", 500);
  }
}
