import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import RepairAssessment from "@/models/RepairAssessment";
import AnalysisSession from "@/models/AnalysisSession";
import AuditLog from "@/models/AuditLog";
import { getAuthUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string; recommendationId: string }> }
) {
  try {
    await connectDB();
    const authUser = await getAuthUser(req);
    const { analysisId, recommendationId } = await params;

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

    const recIndex = assessment.repairRecommendations.findIndex(
      (r) => r.recommendationId === recommendationId
    );

    if (recIndex === -1) {
      return NextResponse.json(
        { error: `Recommendation '${recommendationId}' not found` },
        { status: 404 }
      );
    }

    const rec = assessment.repairRecommendations[recIndex];
    if (rec.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot modify a completed repair recommendation" },
        { status: 400 }
      );
    }

    const approver = authUser?.userId || "Authorized Technician";
    rec.status = "APPROVED";
    rec.approvedBy = approver;
    rec.approvedAt = new Date();

    assessment.markModified("repairRecommendations");
    await assessment.save();

    await AuditLog.create({
      analysisId: session.analysisId,
      userId: authUser?.userId || "system-user",
      organizationId: authUser?.organizationId || (session.organizationId ? String(session.organizationId) : undefined),
      action: "REPAIR_RECOMMENDATION_APPROVED",
      resource: "RepairRecommendation",
      resourceId: recommendationId,
      metadata: {
        recommendationId,
        action: rec.action,
        componentId: rec.componentId,
        approvedBy: approver,
      },
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Recommendation ${recommendationId} approved`,
      recommendation: rec,
    });
  } catch (err: any) {
    console.error("[API Repair Approve Error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to approve recommendation" },
      { status: 500 }
    );
  }
}
