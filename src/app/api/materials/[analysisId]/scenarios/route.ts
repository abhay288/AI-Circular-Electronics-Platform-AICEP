import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { MaterialRecovery } from "@/models/MaterialRecovery";
import { MaterialScenarioRequestSchema } from "@/lib/validation";

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
      totalEstimatedMaterialMassGrams: materialDoc.totalEstimatedMaterialMassGrams,
      recoveryScenarios: materialDoc.recoveryScenarios,
      notice:
        "Scenarios represent process assumptions (Conservative = pyrometallurgical bulk smelting; Typical = industrial closed-loop hydrometallurgical leaching; Optimistic = advanced selective bioleaching / electro-winning). They do not alter baseline physical material estimates.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: error.message || "Failed to fetch recovery scenarios" },
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    await connectDB();
    const { analysisId } = await params;
    const body = await req.json();

    const parseResult = MaterialScenarioRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid scenario selection",
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { scenario } = parseResult.data;

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

    const scenarioDetail = materialDoc.recoveryScenarios?.[scenario];
    if (!scenarioDetail) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `Scenario '${scenario}' is not available for this analysis.`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      analysisId,
      selectedScenario: scenario,
      scenarioDetail,
      baselineTotalEstimatedMassGrams: materialDoc.totalEstimatedMaterialMassGrams,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: error.message || "Failed to simulate scenario" },
      },
      { status: 500 }
    );
  }
}
