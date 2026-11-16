import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import RepairAssessment from "@/models/RepairAssessment";
import AnalysisSession from "@/models/AnalysisSession";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    await connectDB();
    const authUser = await getAuthUser(req);
    const { analysisId } = await params;

    const session = await AnalysisSession.findOne({
      $or: [{ analysisId }, { sessionId: analysisId }],
    });

    if (!session) {
      return NextResponse.json(
        { error: `Analysis session '${analysisId}' not found` },
        { status: 404 }
      );
    }

    if (
      authUser &&
      authUser.role !== "ADMIN" &&
      session.organizationId &&
      authUser.organizationId &&
      String(session.organizationId) !== String(authUser.organizationId)
    ) {
      return NextResponse.json(
        { error: "Forbidden: Access denied to foreign organization analysis" },
        { status: 403 }
      );
    }

    const assessment = await RepairAssessment.findOne({ analysisId: session.analysisId });
    if (!assessment) {
      return NextResponse.json(
        { error: "Repair assessment not found for this session" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      analysisId: session.analysisId,
      overallRecommendation: assessment.overallRecommendation,
      decisionScore: assessment.decisionScore,
      circularityDecision: assessment.circularityDecision,
      decisionMatrix: assessment.decisionMatrix,
      limitations: assessment.limitations,
    });
  } catch (err: any) {
    console.error("[API Repair Circularity GET Error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch circularity decision" },
      { status: 500 }
    );
  }
}
