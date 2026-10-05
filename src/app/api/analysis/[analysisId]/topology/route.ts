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
            code: "TOPOLOGY_NOT_FOUND",
            message: `Topology graph for analysisId '${analysisId}' was not found.`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        analysisId,
        topology: pcb.topology || { nodes: [], edges: [], nodesCount: 0, edgesCount: 0 },
        metrics: {
          nodesCount: pcb.topology?.nodesCount || 0,
          edgesCount: pcb.topology?.edgesCount || 0,
          topologyConfidence: pcb.metrics?.topologyConfidence || 85,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve PCB topology graph.",
        },
      },
      { status: 500 }
    );
  }
});
