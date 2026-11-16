import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import RepairAssessment from "@/models/RepairAssessment";
import AnalysisSession from "@/models/AnalysisSession";
import { getAuthUser } from "@/lib/auth";
import { runRepairWorkerJob } from "@/queues/repair.worker";

export async function GET(
  req: NextRequest,
  { params }: { params: { analysisId: string } }
) {
  try {
    await connectDB();
    const authUser = await getAuthUser(req);
    const { analysisId } = params;

    if (!analysisId) {
      return NextResponse.json(
        { error: "analysisId is required" },
        { status: 400 }
      );
    }

    const session = await AnalysisSession.findOne({
      $or: [{ analysisId }, { sessionId: analysisId }],
    });

    if (!session) {
      return NextResponse.json(
        { error: `Analysis session '${analysisId}' not found` },
        { status: 404 }
      );
    }

    // Organization Isolation
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

    let assessment = await RepairAssessment.findOne({ analysisId: session.analysisId });

    // If assessment hasn't been generated yet, compute on demand
    if (!assessment) {
      try {
        assessment = await runRepairWorkerJob({
          analysisId: session.analysisId,
          userId: authUser?.userId,
          organizationId: authUser?.organizationId,
        });
      } catch (genErr: any) {
        return NextResponse.json(
          {
            error: "Repair assessment not yet available",
            status: session.status,
            stage: session.currentStage,
          },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      assessment,
    });
  } catch (err: any) {
    console.error("[API Repair GET Error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch repair assessment" },
      { status: 500 }
    );
  }
}
