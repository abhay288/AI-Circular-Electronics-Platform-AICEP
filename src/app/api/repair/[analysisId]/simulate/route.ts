import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import RepairAssessment from "@/models/RepairAssessment";
import AnalysisSession from "@/models/AnalysisSession";
import Component from "@/models/Component";
import { getAuthUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    await connectDB();
    const authUser = await getAuthUser(req);
    const { analysisId } = await params;
    const body = await req.json().catch(() => ({}));
    const { componentId, action = "REPLACE_COMPONENT" } = body;

    if (!componentId) {
      return NextResponse.json(
        { error: "componentId is required for simulation" },
        { status: 400 }
      );
    }

    const session = await AnalysisSession.findOne({
      $or: [{ analysisId }, { sessionId: analysisId }],
    });

    if (!session) {
      return NextResponse.json(
        { error: `Analysis session '${analysisId}' not found` },
        { status: 404 }
      );
    }

    if (
      authUser &&
      authUser.role !== "ADMIN" &&
      session.organizationId &&
      authUser.organizationId &&
      String(session.organizationId) !== String(authUser.organizationId)
    ) {
      return NextResponse.json(
        { error: "Forbidden: Access denied to foreign organization analysis" },
        { status: 403 }
      );
    }

    const [assessment, targetComponent, allComponents] = await Promise.all([
      RepairAssessment.findOne({ analysisId: session.analysisId }),
      Component.findOne({
        analysisId: session.analysisId,
        $or: [{ serialNumber: componentId }, { name: componentId }, { _id: componentId }],
      }),
      Component.find({ analysisId: session.analysisId }),
    ]);

    const compAss = assessment?.componentAssessments?.find(
      (c) => c.componentId.toLowerCase() === componentId.toLowerCase()
    );

    const currentCompHealth = compAss?.healthScore ?? targetComponent?.healthScore ?? 55;
    const currentCompRul = compAss?.rulHours ?? targetComponent?.estimatedRUL?.hours ?? 12000;

    // Simulation calculation (Hypothetical replacement model estimate)
    const simulatedCompHealth = 98;
    const simulatedCompRul = 50000;
    const healthDelta = simulatedCompHealth - currentCompHealth;

    // Estimate hypothetical whole-board health
    const currentBoardHealth = session.rulResult?.overallHealthScore ?? 75;
    const compCount = Math.max(allComponents.length, 1);
    const simulatedBoardHealth = Math.min(
      99,
      Math.round(currentBoardHealth + (healthDelta / compCount) * 1.5)
    );

    const currentBoardRulYears = session.rulResult?.predictedYears ?? 3.5;
    const simulatedBoardRulYears = +(currentBoardRulYears + 1.8).toFixed(1);

    const currentScore = assessment?.decisionScore ?? 75;
    const simulatedDecisionScore = Math.min(98, Math.round(currentScore + 12));

    return NextResponse.json({
      success: true,
      mode: "AI SIMULATION",
      isSimulated: true,
      simulationLabel: "SIMULATION (HYPOTHETICAL WHAT-IF ESTIMATE)",
      warning:
        "This is an isolated digital simulation. Physical hardware records and active sessions remain unchanged.",
      target: {
        componentId,
        action,
        currentCondition: {
          healthScore: currentCompHealth,
          rulHours: currentCompRul,
          damageSeverity: compAss?.damageSeverity || "MEDIUM",
        },
        simulatedCondition: {
          expectedHealthScore: simulatedCompHealth,
          expectedRulHours: simulatedCompRul,
          expectedDamageSeverity: "NONE",
          improvementDelta: healthDelta,
        },
      },
      boardImpact: {
        currentHealthScore: currentBoardHealth,
        simulatedHealthScore: simulatedBoardHealth,
        currentRulYears: currentBoardRulYears,
        simulatedRulYears: simulatedBoardRulYears,
        currentCircularityScore: currentScore,
        simulatedCircularityScore: simulatedDecisionScore,
      },
      feasibility: {
        complexity: "MEDIUM",
        recommendedPrerequisites: [
          "ESD safe workstation",
          "Hot air rework station (350°C profile)",
          "No-clean flux and solder braid",
        ],
        safetyNotes:
          "Qualified technician required. High heat during rework may degrade neighboring MLCCs.",
      },
    });
  } catch (err: any) {
    console.error("[API Repair Simulation Error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to execute repair simulation" },
      { status: 500 }
    );
  }
}
