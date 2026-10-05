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
          status: rulDoc.status,
          healthScore: rulDoc.healthScore,
          healthStatus: rulDoc.healthStatus,
          healthConfidence: rulDoc.healthConfidence,
          rul: {
            value: rulDoc.rulHours,
            unit: "hours",
            years: rulDoc.rulYears,
            lowerBound: rulDoc.predictionInterval.lowerBoundHours,
            upperBound: rulDoc.predictionInterval.upperBoundHours,
            lowerBoundYears: rulDoc.predictionInterval.lowerBoundYears,
            upperBoundYears: rulDoc.predictionInterval.upperBoundYears,
          },
          confidence: rulDoc.confidence,
          uncertainty: rulDoc.uncertaintyHours || rulDoc.uncertainty || Math.round(rulDoc.rulHours * 0.15),
          dataCompleteness: rulDoc.dataCompleteness,
          failureRisk: rulDoc.failureRisk,
          riskLevel: rulDoc.riskLevel,
          modelProvider: rulDoc.modelProvider,
          modelName: rulDoc.modelName,
          modelVersion: rulDoc.modelVersion,
          isSynthetic: rulDoc.isSynthetic || rulDoc.provenance === "SIMULATED",
          limitations: rulDoc.limitations,
        },
      });
    }

    const session = await AnalysisSession.findOne({
      $or: [{ analysisId }, { sessionId: analysisId }],
    });

    if (session?.rulResult) {
      return NextResponse.json({
        success: true,
        data: {
          analysisId,
          status: "COMPLETED",
          healthScore: session.rulResult.overallHealthScore,
          healthStatus: session.rulResult.overallHealthScore >= 75 ? "GOOD" : "FAIR",
          rul: {
            value: session.rulResult.predictedHours,
            unit: "hours",
            years: session.rulResult.predictedYears,
            lowerBound: Math.round(session.rulResult.predictedHours * 0.8),
            upperBound: Math.round(session.rulResult.predictedHours * 1.2),
            lowerBoundYears: +(session.rulResult.predictedYears * 0.8).toFixed(1),
            upperBoundYears: +(session.rulResult.predictedYears * 1.2).toFixed(1),
          },
          confidence: session.rulResult.confidence,
          failureRisk: {
            overallRisk: session.rulResult.overallHealthScore >= 75 ? "LOW" : "MODERATE",
            criticalComponentsCount: 0,
            degradedComponentsCount: 0,
          },
          modelProvider: "MOCK",
          isSynthetic: true,
          limitations: ["Derived from session cache"],
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RUL_NOT_FOUND",
          message: `RUL summary for analysisId '${analysisId}' was not found.`,
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
          message: error.message || "Failed to fetch RUL summary",
        },
      },
      { status: 500 }
    );
  }
}
