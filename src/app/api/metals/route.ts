import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pcbWeightKg = 1.0 } = body;

    const goldGrams = +(pcbWeightKg * 0.32).toFixed(2);
    const silverGrams = +(pcbWeightKg * 1.5).toFixed(2);
    const copperGrams = +(pcbWeightKg * 18.0).toFixed(2);
    const palladiumGrams = +(pcbWeightKg * 0.045).toFixed(3);

    const goldValue = +(goldGrams * 78.40).toFixed(2);
    const silverValue = +(silverGrams * 0.95).toFixed(2);
    const copperValue = +(copperGrams * 0.009).toFixed(2);
    const palladiumValue = +(palladiumGrams * 49.20).toFixed(2);

    const totalValueUSD = +(goldValue + silverValue + copperValue + palladiumValue).toFixed(2);

    return NextResponse.json({
      success: true,
      pcbWeightKg,
      yields: [
        { metal: "Gold (Au)", symbol: "Au", yieldGrams: goldGrams, marketRateUSD: 78.40, estimatedValueUSD: goldValue },
        { metal: "Silver (Ag)", symbol: "Ag", yieldGrams: silverGrams, marketRateUSD: 0.95, estimatedValueUSD: silverValue },
        { metal: "Copper (Cu)", symbol: "Cu", yieldGrams: copperGrams, marketRateUSD: 0.009, estimatedValueUSD: copperValue },
        { metal: "Palladium (Pd)", symbol: "Pd", yieldGrams: palladiumGrams, marketRateUSD: 49.20, estimatedValueUSD: palladiumValue },
      ],
      totalEstimatedMarketValueUSD: totalValueUSD,
      recoveryEfficiencyPercent: 98.4,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Metals estimation error" }, { status: 500 });
  }
}
