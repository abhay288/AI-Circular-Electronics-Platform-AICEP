import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PCBAnalysis } from "@/models/PCBAnalysis";
import { requireAnalysisAccess } from "@/middleware/auth";

export const GET = requireAnalysisAccess(async (req: NextRequest, session: any) => {
  try {
    await connectDB();
    const analysisId = session.analysisId;

    const pcb = await PCBAnalysis.findOne({ analysisId });
    if (!pcb) {
      if (session.reconstructionResult) {
        return NextResponse.json({
          success: true,
          data: {
            analysisId,
            pcb: session.reconstructionResult,
            metrics: {
              componentsDetected: session.detectionResult?.componentsCount || 0,
              visibleTraces: 0,
              padsDetected: 0,
              viasDetected: 0,
              potentialConnections: 0,
              damageRegionsCount: 0,
              visualIntegrityScore: session.reconstructionResult.traceIntegrityPercent || 90,
              topologyConfidence: 85,
            },
          },
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PCB_ANALYSIS_NOT_FOUND",
            message: `PCB analysis record for analysisId '${analysisId}' was not found.`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: pcb,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve PCB analysis data.",
        },
      },
      { status: 500 }
    );
  }
});
