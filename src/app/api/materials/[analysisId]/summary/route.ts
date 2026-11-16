import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { MaterialRecovery } from "@/models/MaterialRecovery";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    await connectDB();
    const { analysisId } = await params;

    const materialDoc = await MaterialRecovery.findOne({ analysisId }).lean();
    if (!materialDoc) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `Material recovery record for '${analysisId}' was not found.`,
          },
        },
        { status: 404 }
      );
    }

    const preciousMetals = materialDoc.preciousMetals || [];
    const detectedPreciousMetals = preciousMetals.filter(
      (p: any) => p.presence === "DETECTED_ESTIMATED" || p.presence === "PROBABLE"
    );

    return NextResponse.json({
      success: true,
      analysisId,
      status: materialDoc.status,
      summary: {
        boardMassGrams: materialDoc.boardMass?.massValue || 0,
        boardMassSource: materialDoc.boardMass?.massSource || "ESTIMATED",
        totalEstimatedMaterialMassGrams: materialDoc.totalEstimatedMaterialMassGrams,
        totalRecoverableMaterialMassGrams: materialDoc.totalRecoverableMaterialMassGrams,
        confidence: materialDoc.confidence,
        dataCompleteness: materialDoc.dataCompleteness,
        totalMaterialsIdentified: (materialDoc.materialSummary || []).length,
        preciousMetalsDetectedCount: detectedPreciousMetals.length,
        recoveryEfficiencyPercent: materialDoc.recoveryEfficiencyPercent,
        provider: materialDoc.provider,
        modelVersion: materialDoc.modelVersion,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: error.message || "Failed to fetch summary" },
      },
      { status: 500 }
    );
  }
}
