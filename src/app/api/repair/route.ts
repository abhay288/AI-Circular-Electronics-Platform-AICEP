import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { RepairReport } from "@/lib/db/models/RepairReport";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { componentName, healthScore, faultType, pcbAnalysisId } = body;

    const health = healthScore || 85;
    let recommendation: "reflow" | "reballing" | "component_swap" | "full_recycle" = "component_swap";
    let priority = "MEDIUM";
    let estCost = 14.5;
    let explanation = "Component has mild thermal stress. Solder reflow or replacement will extend board lifecycle by 4.5 years.";

    if (health > 90) {
      recommendation = "reflow";
      priority = "LOW";
      estCost = 0.0;
      explanation = "Component health grade A+. Certified for immediate direct reuse in hardware manufacturing.";
    } else if (health < 40) {
      recommendation = "full_recycle";
      priority = "HIGH";
      estCost = 45.0;
      explanation = "Silicium breakdown exceeds 60%. Recommended for precious metal urban mining recovery.";
    }

    // Save to DB
    const report = await RepairReport.create({
      reportId: `rep_${Date.now()}`,
      pcbAnalysisId: pcbAnalysisId || new mongoose.Types.ObjectId(), // mock if not provided
      recommendedAction: recommendation,
      estimatedRepairCostUSD: estCost,
      estimatedCO2SavingsKg: 14.2,
      feasibilityIndexPercent: health,
      diagnosticNotes: [explanation],
    });

    return NextResponse.json({
      success: true,
      componentName: componentName || "LM358 Dual Op-Amp",
      recommendation,
      priority,
      estimatedCostUSD: estCost,
      estimatedCO2SavingsKg: 14.2,
      explanation,
      generatedAt: report.createdAt,
      reportId: report.reportId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Repair recommendation error" }, { status: 500 });
  }
}
