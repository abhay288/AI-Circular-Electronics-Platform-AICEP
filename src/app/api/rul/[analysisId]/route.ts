import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { RULPrediction } from "@/models/RULPrediction";
import { AnalysisSession } from "@/models/AnalysisSession";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    await connectDB();
    const { analysisId } = await params;

    const rulDoc = await RULPrediction.findOne({ analysisId });
    if (rulDoc) {
      return NextResponse.json({
        success: true,
        data: rulDoc,
      });
    }

    // Check if session has legacy or cached rulResult
    const session = await AnalysisSession.findOne({
      $or: [{ analysisId }, { sessionId: analysisId }],
    });

    if (session?.rulResult) {
      return NextResponse.json({
        success: true,
        data: {
          analysisId,
          healthScore: session.rulResult.overallHealthScore,
          healthStatus: session.rulResult.overallHealthScore >= 75 ? "GOOD" : "FAIR",
          rulHours: session.rulResult.predictedHours,
          rulYears: session.rulResult.predictedYears,
          confidence: session.rulResult.confidence,
          modelProvider: "MOCK",
          status: "COMPLETED",
          isSynthetic: true,
          limitations: [
            "Legacy session cache — full RULPrediction document not populated.",
          ],
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RUL_NOT_FOUND",
          message: `RUL prediction for analysisId '${analysisId}' was not found.`,
        },
      },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Failed to fetch RUL prediction",
        },
      },
      { status: 500 }
    );
  }
}
