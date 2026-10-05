import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { detectionService } from "@/providers/detection/detection.provider";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const contentType = req.headers.get("content-type") || "";
    let analysisId = `direct-${Date.now()}`;
    let imageUrl = "";
    let sampleId: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("image") as File | null;
      analysisId = (formData.get("analysisId") as string) || analysisId;
      sampleId = (formData.get("sampleId") as string) || undefined;

      if (!file && !sampleId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "MISSING_IMAGE",
              message: "Image file or sampleId is required for AI detection",
            },
          },
          { status: 400 }
        );
      }

      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        imageUrl = `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
      }
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      analysisId = body.analysisId || analysisId;
      imageUrl = body.imageUrl || "";
      sampleId = body.sampleId;

      if (!imageUrl && !sampleId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "MISSING_IMAGE",
              message: "imageUrl or sampleId is required in JSON payload",
            },
          },
          { status: 400 }
        );
      }
    }

    const detectionOutput = await detectionService.detect({
      analysisId,
      imageUrl: imageUrl || "/images/samples/router_board.jpg",
      sampleId,
      sourceType: sampleId ? "SAMPLE" : "UPLOAD",
    });

    return NextResponse.json({
      success: true,
      data: {
        analysisId,
        totalDetected: detectionOutput.totalDetected,
        confidenceAverage: detectionOutput.confidenceAverage || detectionOutput.confidenceAvg,
        processingTimeMs: detectionOutput.processingTimeMs,
        model: detectionOutput.model,
        version: detectionOutput.version,
        provider: detectionOutput.provider,
        status: detectionOutput.status,
        quality: detectionOutput.quality,
        warnings: detectionOutput.warnings,
        components: detectionOutput.components,
      },
    });
  } catch (error: any) {
    console.error("[POST /api/detection Error]:", error.message);
    const code = error.message?.includes("AI_SERVICE_UNAVAILABLE")
      ? "AI_SERVICE_UNAVAILABLE"
      : "DETECTION_FAILED";

    return NextResponse.json(
      {
        success: false,
        error: {
          code,
          message: error.message || "Component detection could not be completed.",
        },
      },
      { status: 500 }
    );
  }
}
