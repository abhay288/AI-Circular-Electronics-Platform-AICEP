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

    return NextResponse.json({
      success: true,
      analysisId,
      preciousMetals,
      scientificNotice:
        "Estimates reflect statistical packaging benchmarks and visual presence of connectors/ICs/MLCCs. They do not constitute certified assay or destructive chemical spectrometry.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: error.message || "Failed to fetch precious metals" },
      },
      { status: 500 }
    );
  }
}
