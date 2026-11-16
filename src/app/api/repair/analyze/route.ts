import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AnalysisSession from "@/models/AnalysisSession";
import { getAuthUser } from "@/lib/auth";
import { enqueueRepairJob } from "@/queues/repair.queue";
import { runRepairWorkerJob } from "@/queues/repair.worker";
import AuditLog from "@/models/AuditLog";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const authUser = await getAuthUser(req);
    const body = await req.json().catch(() => ({}));
    const { analysisId } = body;

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

    // Audit log
    await AuditLog.create({
      userId: authUser?.userId || (session.userId ? String(session.userId) : "system-user"),
      organizationId: authUser?.organizationId || (session.organizationId ? String(session.organizationId) : undefined),
      action: "REPAIR_ASSESSMENT_REQUESTED",
      resource: "AnalysisSession",
      resourceId: session.analysisId,
      metadata: { analysisId: session.analysisId },
      timestamp: new Date(),
    });

    // Enqueue or run
    try {
      const job = await enqueueRepairJob({
        analysisId: session.analysisId,
        userId: authUser?.userId,
        organizationId: authUser?.organizationId,
      });

      return NextResponse.json({
        success: true,
        message: "Repair intelligence analysis initiated",
        jobId: job.jobId,
        analysisId: session.analysisId,
        status: "PROCESSING",
      });
    } catch {
      // In-process fallback execution
      const repairDoc = await runRepairWorkerJob({
        analysisId: session.analysisId,
        userId: authUser?.userId,
        organizationId: authUser?.organizationId,
      });

      return NextResponse.json({
        success: true,
        message: "Repair intelligence analysis completed synchronously",
        analysisId: session.analysisId,
        status: "COMPLETED",
        assessment: repairDoc,
      });
    }
  } catch (err: any) {
    console.error("[API Repair Analyze Error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to trigger repair analysis" },
      { status: 500 }
    );
  }
}
