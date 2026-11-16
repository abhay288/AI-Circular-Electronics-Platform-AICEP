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

    return NextResponse.json({
      success: true,
      analysisId,
      provider: materialDoc.provider,
      modelVersion: materialDoc.modelVersion,
      databaseVersion: materialDoc.databaseVersion,
      sources: materialDoc.materialSources || [],
      limitations: materialDoc.limitations || [],
      dataCompleteness: materialDoc.dataCompleteness,
      confidence: materialDoc.confidence,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: error.message || "Failed to fetch sources" },
      },
      { status: 500 }
    );
  }
}
