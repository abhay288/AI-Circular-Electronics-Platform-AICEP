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
            code: "TRACES_NOT_FOUND",
            message: `Trace detection records for analysisId '${analysisId}' were not found.`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        analysisId,
        traces: pcb.traces || [],
        pads: pcb.pads || [],
        vias: pcb.vias || [],
        totalTraces: pcb.traces?.length || 0,
        totalPads: pcb.pads?.length || 0,
        totalVias: pcb.vias?.length || 0,
        layer: "VISIBLE_TOP",
        method: "Computer Vision Surface Optical Extraction",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve PCB trace detection records.",
        },
      },
      { status: 500 }
    );
  }
});
