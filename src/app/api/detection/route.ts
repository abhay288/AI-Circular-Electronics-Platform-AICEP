import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Component } from "@/lib/db/models/Component";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const formData = await req.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json({ error: "Image file is required for AI detection" }, { status: 400 });
    }

    // Mock YOLOv11 / RT-DETR 50-micron spectro-spatial neural inference response
    const detectedComponents = [
      {
        serialNumber: `comp_lm358_${Date.now()}_1`,
        name: "LM358 Dual Op-Amp IC",
        type: "CustomIC",
        manufacturer: "Texas Instruments",
        confidenceScore: 0.992,
        healthScore: 92,
        remainingUsefulLifeHours: 56000,
        status: "detected",
      },
      {
        serialNumber: `comp_atmega328p_${Date.now()}_2`,
        name: "ATmega328P Microcontroller",
        type: "CustomIC",
        manufacturer: "Microchip Tech",
        confidenceScore: 0.987,
        healthScore: 88,
        remainingUsefulLifeHours: 48000,
        status: "detected",
      },
      {
        serialNumber: `comp_cap_220uf_${Date.now()}_3`,
        name: "Solid Polymer Capacitor 220uF",
        type: "Capacitor",
        manufacturer: "Nichicon",
        confidenceScore: 0.975,
        healthScore: 95,
        remainingUsefulLifeHours: 62000,
        status: "detected",
      },
    ];

    // Save to Database
    const savedComponents = await Component.insertMany(detectedComponents);

    return NextResponse.json({
      success: true,
      jobId: `job_det_${Date.now()}`,
      status: "COMPLETED",
      model: "YOLOv11-SpectroSpatial-v4.2",
      inferenceTimeMs: 42,
      componentsCount: savedComponents.length,
      components: savedComponents,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Detection pipeline failure" }, { status: 500 });
  }
}
