import { NextRequest } from "next/server";
import { IntegrityService } from "@/services/integrity/integrity.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    const { analysisId } = await params;
    if (!analysisId) {
      return errorResponse("ANALYSIS_ID_REQUIRED", "analysisId is required for integrity verification", 400);
    }

    const result = await IntegrityService.verifyAnalysisIntegrity(analysisId);
    return successResponse(result);
  } catch (error: any) {
    console.error("[Data Integrity API Error]:", error);
    return errorResponse("INTEGRITY_CHECK_FAILED", error.message || "Failed to verify analysis integrity", 500);
  }
}
