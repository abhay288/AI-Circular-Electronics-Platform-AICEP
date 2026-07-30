import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { componentType, ageYears, operatingTemp, voltage, cycles } = body;

    const baseHours = 60000;
    const tempFactor = Math.max(0.2, 1 - (operatingTemp || 45) / 120);
    const voltageFactor = Math.max(0.3, 1 - Math.abs((voltage || 3.3) - 3.3) / 5);
    const cyclesFactor = Math.max(0.4, 1 - (cycles || 1000) / 50000);

    const predictedHours = Math.round(baseHours * tempFactor * voltageFactor * cyclesFactor);
    const predictedYears = +(predictedHours / 8760).toFixed(1);
    const healthScore = Math.min(100, Math.round((predictedHours / baseHours) * 100));

    return NextResponse.json({
      success: true,
      componentType: componentType || "ATmega328P",
      healthScore,
      predictedRULHours: predictedHours,
      predictedYears,
      failureProbability: +((100 - healthScore) / 100).toFixed(2),
      simulationParameters: {
        operatingTempCelsius: operatingTemp || 45,
        inputVoltageVolts: voltage || 3.3,
        operatingCycles: cycles || 1000,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "RUL simulation error" }, { status: 500 });
  }
}
