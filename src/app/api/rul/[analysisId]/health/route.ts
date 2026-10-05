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
        data: {
          analysisId,
          healthScore: rulDoc.healthScore,
          healthStatus: rulDoc.healthStatus,
          healthConfidence: rulDoc.healthConfidence,
          healthFactors: rulDoc.healthFactors || [],
          failureRisk: rulDoc.failureRisk,
          failureModes: rulDoc.failureModes || [],
        },
      });
    }

    const session = await AnalysisSession.findOne({
      $or: [{ analysisId }, { sessionId: analysisId }],
    });

    if (session?.rulResult) {
      const score = session.rulResult.overallHealthScore;
      return NextResponse.json({
        success: true,
        data: {
          analysisId,
          healthScore: score,
          healthStatus:
            score >= 90 ? "HEALTHY" : score >= 75 ? "GOOD" : score >= 50 ? "FAIR" : "DEGRADED",
          healthConfidence: session.rulResult.confidence,
          healthFactors: [
            {
              factor: "Visual PCB Condition",
              impact: score >= 80 ? 5 : -10,
              severity: "LOW",
              evidence: "Standard optical visual inspection",
            },
          ],
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Health assessment for analysisId '${analysisId}' was not found.`,
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
          message: error.message || "Failed to fetch health assessment data",
        },
      },
      { status: 500 }
    );
  }
}
