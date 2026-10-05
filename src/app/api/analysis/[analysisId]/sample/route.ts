import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { AnalysisSession } from "@/models/AnalysisSession";
import { SAMPLE_DATASETS } from "@/lib/data/sampleDatasets";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ analysisId: string }> }) {
  try {
    await connectDB();
    const { analysisId } = await params;
    const body = await req.json();
    const { sampleId } = body;

    if (!sampleId || !SAMPLE_DATASETS[sampleId]) {
      return errorResponse("INVALID_SAMPLE_ID", `Sample dataset '${sampleId}' is not recognized`, 400);
    }

    const sample = SAMPLE_DATASETS[sampleId];

    const session = await AnalysisSession.findOneAndUpdate(
      { $or: [{ analysisId }, { sessionId: analysisId }] },
      {
        $set: {
          sampleId,
          sourceType: "SAMPLE",
          mode: "DEMO",
          deviceName: sample.name,
          deviceType: sample.deviceType,
          imageUrl: sample.image,
          status: "READY",
        },
      },
      { new: true }
    );

    if (!session) {
      return errorResponse("ANALYSIS_NOT_FOUND", `Analysis session '${analysisId}' was not found`, 404);
    }

    return successResponse({
      message: `Sample '${sample.name}' attached successfully`,
      session,
    });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", error.message || "Failed to attach sample", 500);
  }
}
