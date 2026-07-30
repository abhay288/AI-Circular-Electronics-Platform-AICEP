import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      analytics: {
        totalCO2PreventedTons: 96.3,
        totalCleanEnergySavedGWh: 1.42,
        totalWaterSavedGallons: 420000,
        componentsReusedCount: 73450,
        preciousMetalsRecoveredKg: 2400,
        landfillDiversionRatePercent: 100.0,
        monthlyBreakdown: [
          { month: "Jan 2026", co2Tons: 14.2 },
          { month: "Feb 2026", co2Tons: 18.6 },
          { month: "Mar 2026", co2Tons: 22.4 },
          { month: "Apr 2026", co2Tons: 26.1 },
          { month: "May 2026", co2Tons: 15.0 },
        ],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Carbon analytics error" }, { status: 500 });
  }
}
