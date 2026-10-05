import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AnalysisSession } from "@/models/AnalysisSession";
import { getAuthUser } from "@/lib/auth";
import { enqueuePCBJob } from "@/queues/pcb.queue";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const analysisId = body?.analysisId;

    if (!analysisId) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_ANALYSIS_ID", message: "analysisId is required." } },
        { status: 400 }
      );
    }

    const session = await AnalysisSession.findOne({
      $or: [{ analysisId }, { sessionId: analysisId }],
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: `Analysis session '${analysisId}' was not found.` } },
        { status: 404 }
      );
    }

    // Auth verification
    if (session.mode !== "DEMO" && session.userId) {
      const user = await getAuthUser(req);
      if (!user) {
        return NextResponse.json(
          { success: false, error: { code: "AUTH_REQUIRED", message: "Authentication required." } },
          { status: 401 }
        );
      }
      if (String(session.userId) !== user.userId && user.role !== "ADMIN") {
        return NextResponse.json(
          { success: false, error: { code: "FORBIDDEN", message: "Not authorized for this session." } },
          { status: 403 }
        );
      }
    }

    // Enqueue PCB Reconstruction Job
    const queueResult = await enqueuePCBJob({
      analysisId: session.analysisId,
      assetId: session.sourceFileId ? String(session.sourceFileId) : undefined,
      sourceType: session.sourceType,
    });

    return NextResponse.json({
      success: true,
      data: {
        analysisId: session.analysisId,
        status: "PROCESSING",
        stage: "PCB",
        queued: queueResult.queued,
        mode: queueResult.mode,
        message: "PCB reconstruction analysis enqueued successfully.",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to trigger PCB reconstruction.",
        },
      },
      { status: 500 }
    );
  }
}
