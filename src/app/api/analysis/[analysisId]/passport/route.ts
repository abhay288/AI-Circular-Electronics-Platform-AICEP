import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { DigitalPassport } from "@/models/DigitalPassport";
import { AnalysisSession } from "@/models/AnalysisSession";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ analysisId: string }> }) {
  try {
    await connectDB();
    const { analysisId } = await params;

    const passport = await DigitalPassport.findOne({
      $or: [{ analysisId }, { passportId: analysisId }],
    });

    if (!passport) {
      const session = await AnalysisSession.findOne({
        $or: [{ analysisId }, { sessionId: analysisId }],
      });
      if (session?.passportResult) {
        return successResponse({ analysisId, passport: session.passportResult });
      }
      return errorResponse("NOT_FOUND", "Digital Product Passport not found", 404);
    }

    return successResponse({ analysisId, passport });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to fetch passport", 500);
  }
}
