import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AnalysisSession } from "@/models/AnalysisSession";
import { Component } from "@/models/Component";
import { PCBAnalysis } from "@/models/PCBAnalysis";
import { RULPrediction } from "@/models/RULPrediction";
import { AuditLog } from "@/models/AuditLog";
import { rulService, RULInput } from "@/providers/rul/rul.provider";
import { RULPredictRequestSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const rawBody = await req.json();

    const parseResult = RULPredictRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid RUL prediction request parameters",
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const {
      analysisId,
      componentId,
      operatingHours,
      operatingCycles,
      temperatureC,
      voltageV,
      currentA,
      loadPercentage,
      componentAgeYears,
    } = parseResult.data;

    const session = await AnalysisSession.findOne({
      $or: [{ analysisId }, { sessionId: analysisId }],
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `Analysis session '${analysisId}' was not found.`,
          },
        },
        { status: 404 }
      );
    }

    // Fetch existing Component detections and PCBAnalysis for feature construction
    const [components, pcbDoc] = await Promise.all([
      Component.find({ analysisId: session.analysisId }).lean(),
      PCBAnalysis.findOne({ analysisId: session.analysisId }).lean(),
    ]);

    const damaged = pcbDoc?.damagedRegions || [];
    const corrosionCount = damaged.filter((d: any) => d.type === "corrosion").length;
    const thermalCount = damaged.filter((d: any) => d.type === "burn_mark" || d.type === "discoloration").length;
    const physicalCount = damaged.filter((d: any) => d.type === "crack" || d.type === "physical_damage").length;
    const traceCount = damaged.filter((d: any) => d.type === "scratched_trace" || d.type === "broken_trace").length;

    const visualIntegrity = pcbDoc?.metrics?.visualIntegrityScore ?? 85;
    const topologyRisk = pcbDoc?.reconstruction?.visualIntegrityEstimate
      ? Math.max(0, 100 - pcbDoc.reconstruction.visualIntegrityEstimate)
      : 15;

    const rulInput: RULInput = {
      analysisId: session.analysisId,
      sampleId: session.sampleId,
      componentId,
      operatingHours,
      operatingCycles,
      temperatureC,
      voltageV,
      currentA,
      loadPercentage,
      componentAgeYears,
      pcbIntegrityScore: visualIntegrity,
      topologyRiskScore: topologyRisk,
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
        hasCorrosion: false,
        hasThermalDamage: false,
        connectedTracesCount: 2,
      })),
    };

    const rulOutput = await rulService.predict(rulInput);

    // Save prediction record
    const rulDoc = await RULPrediction.findOneAndUpdate(
      { analysisId: session.analysisId },
      { ...rulOutput, analysisId: session.analysisId },
      { upsert: true, new: true }
    );

    // Sync individual components
    if (rulOutput.components && rulOutput.components.length > 0) {
      for (const compRul of rulOutput.components) {
        const mappedCondition =
          compRul.healthStatus === "HEALTHY"
            ? "MINT"
            : compRul.healthStatus === "CRITICAL"
            ? "FAILED"
            : (compRul.healthStatus as "GOOD" | "FAIR" | "DEGRADED" | "UNKNOWN");

        await Component.updateOne(
          {
            analysisId: session.analysisId,
            $or: [{ serialNumber: compRul.componentId }, { name: compRul.componentId }],
          },
          {
            $set: {
              condition: mappedCondition,
              healthScore: compRul.healthScore,
              estimatedRUL: {
                hours: compRul.estimatedRULHours,
                years: compRul.estimatedRULYears,
              },
              marketplaceEligible: compRul.healthScore >= 70,
            },
          }
        );
      }
    }

    // Update Session
    session.rulPredictionId = rulDoc._id;
    session.rulResult = {
      overallHealthScore: rulOutput.healthScore,
      predictedYears: rulOutput.rulYears,
      predictedHours: rulOutput.rulHours,
      failureProbability: +(100 - rulOutput.healthScore).toFixed(1),
      confidence: rulOutput.confidence,
      parameters: {
        operatingTempCelsius: rulOutput.inputFeatures?.temperatureC ?? 45,
        inputVoltageVolts: rulOutput.inputFeatures?.voltageV ?? 5.0,
        operatingCycles: rulOutput.inputFeatures?.operatingCycles ?? 1200,
        ageYears: rulOutput.inputFeatures?.componentAgeYears ?? 2.5,
      },
    };
    session.status = "RUL_COMPLETE";
    session.stageStatuses.rul = "completed";
    session.currentStage = "MATERIALS";
    session.markModified("stageStatuses");
    session.progress = 65;
    await session.save();

    await AuditLog.create({
      analysisId: session.analysisId,
      userId: session.userId ? String(session.userId) : "system-user",
      action: "RUL_PREDICTION_COMPLETED",
      resource: "RULPrediction",
      resourceId: String(rulDoc._id),
      metadata: {
        healthScore: rulOutput.healthScore,
        healthStatus: rulOutput.healthStatus,
        rulYears: rulOutput.rulYears,
        provider: rulOutput.modelProvider,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        analysisId: session.analysisId,
        status: rulOutput.status,
        healthScore: rulOutput.healthScore,
        healthStatus: rulOutput.healthStatus,
        healthConfidence: rulOutput.healthConfidence,
        rul: {
          value: rulOutput.rulHours,
          unit: "hours",
          years: rulOutput.rulYears,
          lowerBound: rulOutput.predictionInterval?.lowerBoundHours ?? Math.round(rulOutput.rulHours * 0.8),
          upperBound: rulOutput.predictionInterval?.upperBoundHours ?? Math.round(rulOutput.rulHours * 1.2),
          lowerBoundYears: rulOutput.predictionInterval?.lowerBoundYears ?? +(rulOutput.rulYears * 0.8).toFixed(1),
          upperBoundYears: rulOutput.predictionInterval?.upperBoundYears ?? +(rulOutput.rulYears * 1.2).toFixed(1),
        },
        confidence: rulOutput.confidence,
        uncertainty: rulOutput.uncertaintyHours ?? Math.round(rulOutput.rulHours * 0.15),
        dataCompleteness: rulOutput.dataCompleteness ?? 50,
        failureRisk: rulOutput.failureRisk ?? "MODERATE",
        limitations: rulOutput.limitations ?? [],
      },
    });
  } catch (error: any) {
    console.error("[API POST /api/rul/predict] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RUL_PREDICTION_ERROR",
          message: error.message || "Failed to execute RUL prediction",
        },
      },
      { status: 500 }
    );
  }
}
