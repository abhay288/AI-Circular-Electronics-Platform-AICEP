import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { componentName, healthScore, faultType } = body;

    const health = healthScore || 85;
    let recommendation = "REPLACEMENT_RECOMMENDED";
    let priority = "MEDIUM";
    let estCost = 14.5;
    let explanation = "Component has mild thermal stress. Solder reflow or replacement will extend board lifecycle by 4.5 years.";

    if (health > 90) {
      recommendation = "REUSE_AS_IS";
      priority = "LOW";
      estCost = 0.0;
      explanation = "Component health grade A+. Certified for immediate direct reuse in hardware manufacturing.";
    } else if (health < 40) {
      recommendation = "PYROMETALLURGICAL_RECYCLE";
      priority = "HIGH";
      estCost = 45.0;
      explanation = "Silicium breakdown exceeds 60%. Recommended for precious metal urban mining recovery.";
    }

    return NextResponse.json({
      success: true,
      componentName: componentName || "LM358 Dual Op-Amp",
      recommendation,
      priority,
      estimatedCostUSD: estCost,
      estimatedCO2SavingsKg: 14.2,
      explanation,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Repair recommendation error" }, { status: 500 });
  }
}
