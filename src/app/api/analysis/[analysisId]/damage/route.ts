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
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DAMAGE_DATA_NOT_FOUND",
            message: `Damage analysis for analysisId '${analysisId}' was not found.`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        analysisId,
        damagedRegions: pcb.damagedRegions || [],
        totalDamages: pcb.damagedRegions?.length || 0,
        visualIntegrityEstimate: pcb.reconstruction?.visualIntegrityEstimate || pcb.metrics?.visualIntegrityScore || 90,
        disclaimer: "Visual anomaly detection only. Physical electrical continuity requires Kelvin 4-wire testing.",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve damage analysis data.",
        },
      },
      { status: 500 }
    );
  }
});
