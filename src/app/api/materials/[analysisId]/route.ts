import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { MaterialRecovery } from "@/models/MaterialRecovery";
import { AnalysisSession } from "@/models/AnalysisSession";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    await connectDB();
    const { analysisId } = await params;

    if (!analysisId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "analysisId is required" } },
        { status: 400 }
      );
    }

    const materialDoc = await MaterialRecovery.findOne({ analysisId }).lean();

    if (!materialDoc) {
      // Check if session exists
      const session = await AnalysisSession.findOne({
        $or: [{ analysisId }, { sessionId: analysisId }],
      }).lean();

      if (!session) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: `Analysis session '${analysisId}' was not found.`,
            },
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_ANALYZED",
            message: `Material recovery assessment for '${analysisId}' has not been performed yet.`,
            currentStage: session.currentStage,
            status: session.status,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      analysisId,
      materialRecovery: materialDoc,
    });
  } catch (error: any) {
    console.error("[API Material GET Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error.message || "Failed to retrieve material recovery assessment",
        },
      },
      { status: 500 }
    );
  }
}
