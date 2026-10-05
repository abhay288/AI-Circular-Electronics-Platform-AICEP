import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { RULPrediction } from "@/models/RULPrediction";
import { Component } from "@/models/Component";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    await connectDB();
    const { analysisId } = await params;

    const rulDoc = await RULPrediction.findOne({ analysisId });
    if (rulDoc && rulDoc.components && rulDoc.components.length > 0) {
      return NextResponse.json({
        success: true,
        data: {
          analysisId,
          totalComponents: rulDoc.components.length,
          components: rulDoc.components,
        },
      });
    }

    // Fallback: Read directly from Component collection
    const components = await Component.find({ analysisId }).lean();
    if (components.length > 0) {
      const formatted = components.map((c) => ({
        componentId: c.serialNumber || String(c._id),
        componentType: c.type,
        healthScore: c.healthScore || 80,
        healthStatus: c.condition === "MINT" ? "HEALTHY" : c.condition === "FAILED" ? "CRITICAL" : c.condition || "GOOD",
        estimatedRULHours: c.estimatedRUL?.hours || 25000,
        estimatedRULYears: c.estimatedRUL?.years || 2.8,
        riskLevel: c.healthScore < 50 ? "HIGH" : "LOW",
        confidence: c.confidence || 0.85,
        primaryContributingFactor: "Visual condition inspection",
      }));

      return NextResponse.json({
        success: true,
        data: {
          analysisId,
          totalComponents: formatted.length,
          components: formatted,
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "COMPONENTS_NOT_FOUND",
          message: `No components found for analysisId '${analysisId}'.`,
        },
      },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Failed to fetch component RUL",
        },
      },
      { status: 500 }
    );
  }
}
