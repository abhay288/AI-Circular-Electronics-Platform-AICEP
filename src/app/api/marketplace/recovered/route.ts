import { NextRequest, NextResponse } from "next/server";
import { analysisService } from "@/lib/services/analysisService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const analysisId = searchParams.get("analysisId") || searchParams.get("sessionId");

    if (!analysisId) {
      return NextResponse.json(
        { success: false, error: "analysisId query parameter is required" },
        { status: 400 }
      );
    }

    const session = await analysisService.getSession(analysisId);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Analysis session not found" },
        { status: 404 }
      );
    }

    const components = session.detection?.components || [];

    // Filter and score circular recovery eligibility
    const recoveredComponents = components.map((comp) => {
      const isEligible = (comp.health || 0) >= 80 && !comp.status?.toLowerCase().includes("critical");
      return {
        id: comp.id,
        name: comp.name,
        type: comp.type,
        manufacturer: comp.manufacturer,
        package: comp.package,
        confidence: comp.confidence,
        health: comp.health,
        remainingLifeYears: comp.remainingLifeYears,
        passportId: comp.passportId || session.passport?.passportId,
        status: comp.status,
        isEligible,
        condition: comp.health >= 90 ? "Reusable" : comp.health >= 80 ? "Refurbishable" : "Not eligible",
        recommendedAction:
          comp.health >= 90
            ? "Direct Secondary Reuse"
            : comp.health >= 80
            ? "Desolder Rework & Pin Reconditioning"
            : "Recycling / Material Recovery",
        estimatedValueUSD:
          comp.type.toLowerCase().includes("processor") || comp.type.toLowerCase().includes("cpu")
            ? 35.0
            : comp.type.toLowerCase().includes("memory")
            ? 22.0
            : 12.5,
        estimatedValueINR:
          comp.type.toLowerCase().includes("processor") || comp.type.toLowerCase().includes("cpu")
            ? 3025
            : comp.type.toLowerCase().includes("memory")
            ? 1900
            : 1080,
      };
    });

    const eligibleCount = recoveredComponents.filter((c) => c.isEligible).length;

    return NextResponse.json({
      success: true,
      analysisId: session.id,
      deviceName: session.deviceName,
      deviceType: session.deviceType,
      totalComponents: components.length,
      eligibleComponentsCount: eligibleCount,
      components: recoveredComponents,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve recovered components" },
      { status: 500 }
    );
  }
}
