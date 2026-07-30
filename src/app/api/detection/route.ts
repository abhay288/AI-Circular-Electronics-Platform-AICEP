import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json({ error: "Image file is required for AI detection" }, { status: 400 });
    }

    // Mock YOLOv11 / RT-DETR 50-micron spectro-spatial neural inference response
    const detectedComponents = [
      {
        id: "comp_lm358",
        name: "LM358 Dual Op-Amp IC",
        category: "IC_CHIP",
        package: "SOP-8",
        manufacturer: "Texas Instruments",
        confidence: 0.992,
        healthScore: 92,
        remainingLifespanHours: 56000,
        siliconGrade: "A+",
        boundingBox: { x: 120, y: 180, width: 85, height: 85 },
      },
      {
        id: "comp_atmega328p",
        name: "ATmega328P Microcontroller",
        category: "MICROCONTROLLER",
        package: "TQFP-32",
        manufacturer: "Microchip Tech",
        confidence: 0.987,
        healthScore: 88,
        remainingLifespanHours: 48000,
        siliconGrade: "A",
        boundingBox: { x: 260, y: 140, width: 140, height: 140 },
      },
      {
        id: "comp_cap_220uf",
        name: "Solid Polymer Capacitor 220uF",
        category: "CAPACITOR",
        package: "SMD",
        manufacturer: "Nichicon",
        confidence: 0.975,
        healthScore: 95,
        remainingLifespanHours: 62000,
        siliconGrade: "A+",
        boundingBox: { x: 440, y: 220, width: 60, height: 60 },
      },
    ];

    return NextResponse.json({
      success: true,
      jobId: `job_det_${Date.now()}`,
      status: "COMPLETED",
      model: "YOLOv11-SpectroSpatial-v4.2",
      inferenceTimeMs: 42,
      componentsCount: detectedComponents.length,
      components: detectedComponents,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Detection pipeline failure" }, { status: 500 });
  }
}
