import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AnalysisSession } from "@/models/AnalysisSession";
import { Component } from "@/models/Component";
import { PCBAnalysis } from "@/models/PCBAnalysis";
import { RULPrediction } from "@/models/RULPrediction";
import { rulService, RULInput } from "@/providers/rul/rul.provider";
import { RULScenarioSimulationSchema } from "@/lib/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    await connectDB();
    const { analysisId } = await params;
    const body = await req.json();

    const parseResult = RULScenarioSimulationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid scenario simulation parameters",
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const {
      temperatureC,
      voltageV,
      currentA,
      loadPercentage,
      operatingHours,
      operatingCycles,
      componentAgeYears,
    } = parseResult.data;

    // Fetch baseline RUL prediction and AnalysisSession
    const [rulDoc, session, components, pcbDoc] = await Promise.all([
      RULPrediction.findOne({ analysisId }).lean(),
      AnalysisSession.findOne({ $or: [{ analysisId }, { sessionId: analysisId }] }).lean(),
      Component.find({ analysisId }).lean(),
      PCBAnalysis.findOne({ analysisId }).lean(),
    ]);

    if (!session && !rulDoc) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `Analysis '${analysisId}' was not found.`,
          },
        },
        { status: 404 }
      );
    }

    const baseFeatures = rulDoc?.inputFeatures || {};
    const simTemp = temperatureC ?? baseFeatures.temperatureC ?? 45;
    const simVolt = voltageV ?? baseFeatures.voltageV ?? 5.0;
    const simCurr = currentA ?? baseFeatures.currentA ?? 0.8;
    const simLoad = loadPercentage ?? baseFeatures.loadPercentage ?? 50;
    const simHours = operatingHours ?? baseFeatures.operatingHours ?? 15000;
    const simCycles = operatingCycles ?? baseFeatures.operatingCycles ?? 1200;
    const simAge = componentAgeYears ?? baseFeatures.componentAgeYears ?? 2.5;

    const damaged = pcbDoc?.damagedRegions || [];
    const corrosionCount = damaged.filter((d: any) => d.type === "corrosion").length;
    const thermalCount = damaged.filter((d: any) => d.type === "burn_mark" || d.type === "discoloration").length;
    const physicalCount = damaged.filter((d: any) => d.type === "crack" || d.type === "physical_damage").length;
    const traceCount = damaged.filter((d: any) => d.type === "scratched_trace" || d.type === "broken_trace").length;
    const visualIntegrity = pcbDoc?.metrics?.visualIntegrityScore ?? 85;

    const simInput: RULInput = {
      analysisId,
      sampleId: session?.sampleId,
      temperatureC: simTemp,
      voltageV: simVolt,
      currentA: simCurr,
      loadPercentage: simLoad,
      operatingHours: simHours,
      operatingCycles: simCycles,
      componentAgeYears: simAge,
      pcbIntegrityScore: visualIntegrity,
      topologyRiskScore: 15,
      visualHealthScore: visualIntegrity,
      corrosionScore: corrosionCount * 15,
      thermalDamageScore: thermalCount * 20,
      physicalDamageScore: physicalCount * 10,
      traceDamageScore: traceCount * 15,
      components: components.map((c) => ({
        componentId: c.serialNumber || String(c._id),
        componentType: c.type,
        manufacturer: c.manufacturer,
        partNumber: c.partNumber,
        packageType: c.package,
        visualDamageSeverity: c.condition === "DEGRADED" || c.condition === "FAILED" ? "HIGH" : "LOW",
      })),
      isScenarioSimulation: true,
    };

    // Run prediction WITHOUT saving to DB (never overwrite baseline)
    const simulatedResult = await rulService.predict(simInput);

    const baselineHours = rulDoc?.rulHours ?? 28000;
    const baselineYears = rulDoc?.rulYears ?? 3.2;
    const deltaHours = simulatedResult.rulHours - baselineHours;
    const deltaYears = +(simulatedResult.rulYears - baselineYears).toFixed(1);

    return NextResponse.json({
      success: true,
      data: {
        analysisId,
        provenance: "SIMULATED",
        mode: "WHAT_IF_SCENARIO",
        label: "Scenario estimate — not a measured laboratory result.",
        scenarioParameters: {
          temperatureC: simTemp,
          voltageV: simVolt,
          currentA: simCurr,
          loadPercentage: simLoad,
          operatingHours: simHours,
          operatingCycles: simCycles,
          componentAgeYears: simAge,
        },
        baseline: {
          healthScore: rulDoc?.healthScore ?? 80,
          rulHours: baselineHours,
          rulYears: baselineYears,
        },
        simulated: {
          healthScore: simulatedResult.healthScore,
          healthStatus: simulatedResult.healthStatus,
          rulHours: simulatedResult.rulHours,
          rulYears: simulatedResult.rulYears,
          predictionInterval: simulatedResult.predictionInterval,
          confidence: simulatedResult.confidence,
          failureRisk: simulatedResult.failureRisk,
        },
        impactDelta: {
          deltaHours,
          deltaYears,
          healthScoreDelta: simulatedResult.healthScore - (rulDoc?.healthScore ?? 80),
          summary:
            deltaHours < 0
              ? `Scenario stresses accelerate degradation, reducing RUL by ${Math.abs(deltaYears)} years (${Math.abs(deltaHours)} operating hours).`
              : deltaHours > 0
              ? `De-rated operating conditions extend expected life by ${deltaYears} years (${deltaHours} operating hours).`
              : "Operating conditions match baseline baseline with neutral impact.",
        },
        limitations: [
          "Scenario simulation relies on physics-of-failure Arrhenius kinetics and Coffin-Manson cycles.",
          "Results are what-if estimations and do not modify the original stored analysis.",
        ],
      },
    });
  } catch (error: any) {
    console.error("[API POST /api/rul/:analysisId/scenario] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SCENARIO_SIMULATION_ERROR",
          message: error.message || "Failed to execute scenario simulation",
        },
      },
      { status: 500 }
    );
  }
}
