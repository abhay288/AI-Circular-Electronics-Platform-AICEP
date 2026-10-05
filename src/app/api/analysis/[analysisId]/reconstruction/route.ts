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
            code: "RECONSTRUCTION_NOT_FOUND",
            message: `Reconstruction estimate for analysisId '${analysisId}' was not found.`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        analysisId,
        board: pcb.board,
        layers: pcb.layers,
        components: pcb.components || [],
        traces: pcb.traces || [],
        pads: pcb.pads || [],
        vias: pcb.vias || [],
        topology: pcb.topology || {},
        damagedRegions: pcb.damagedRegions || [],
        reconstruction: pcb.reconstruction || {},
        confidence: pcb.reconstruction?.overallReconstructionConfidence || 85,
        visualIntegrityEstimate: pcb.reconstruction?.visualIntegrityEstimate || 90,
        limitations: pcb.reconstruction?.limitations || [
          "Single-side optical imaging cannot observe buried inner layers (e.g. power & ground planes).",
          "Traces running under large BGA / QFP packages are visually occluded and treated as inferred.",
          "Visual trace continuity does not substitute for four-wire Kelvin electrical continuity testing.",
        ],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve reconstruction estimate.",
        },
      },
      { status: 500 }
    );
  }
});
