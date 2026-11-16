import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import RepairAssessment from "@/models/RepairAssessment";
import AnalysisSession from "@/models/AnalysisSession";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { analysisId: string } }
) {
  try {
    await connectDB();
    const authUser = await getAuthUser(req);
    const { analysisId } = params;

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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const action = searchParams.get("action");

    let recommendations = assessment.repairRecommendations || [];

    if (status) {
      recommendations = recommendations.filter(
        (r) => r.status.toUpperCase() === status.toUpperCase()
      );
    }

    if (priority) {
      recommendations = recommendations.filter(
        (r) => r.priority.toUpperCase() === priority.toUpperCase()
      );
    }

    if (action) {
      recommendations = recommendations.filter(
        (r) => r.action.toUpperCase() === action.toUpperCase()
      );
    }

    return NextResponse.json({
      success: true,
      analysisId: session.analysisId,
      total: recommendations.length,
      recommendations,
    });
  } catch (err: any) {
    console.error("[API Repair Recommendations GET Error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
