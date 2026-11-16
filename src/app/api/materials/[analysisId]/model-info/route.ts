import { NextRequest, NextResponse } from "next/server";
import { materialRecoveryService } from "@/providers/materials/materials.provider";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    const { analysisId } = await params;
    const modelInfo = await materialRecoveryService.getModelInfo();

    return NextResponse.json({
      success: true,
      analysisId,
      modelInfo,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: error.message || "Failed to fetch model info" },
      },
      { status: 500 }
    );
  }
}
