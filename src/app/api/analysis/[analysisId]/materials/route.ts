import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { MaterialRecovery } from "@/models/MaterialRecovery";
import { AnalysisSession } from "@/models/AnalysisSession";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ analysisId: string }> }) {
  try {
    await connectDB();
    const { analysisId } = await params;

    const materials = await MaterialRecovery.findOne({ analysisId });
    if (!materials) {
      const session = await AnalysisSession.findOne({
        $or: [{ analysisId }, { sessionId: analysisId }],
      });
      if (session?.metalResult) {
        return successResponse({ analysisId, materials: session.metalResult });
      }
      return errorResponse("NOT_FOUND", "Material recovery spectrometry record not found", 404);
    }

    return successResponse({ analysisId, materials });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to fetch materials", 500);
  }
}
