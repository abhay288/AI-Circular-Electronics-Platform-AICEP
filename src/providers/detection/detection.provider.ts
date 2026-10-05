import { SAMPLE_DATASETS } from "@/lib/data/sampleDatasets";

export interface DetectionInput {
  analysisId: string;
  imageUrl: string;
  sampleId?: string;
  mode?: "LIVE" | "DEMO";
}

export interface DetectedComponentData {
  componentId: string;
  type: string;
  name: string;
  manufacturer: string;
  partNumber: string;
  package: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  confidence: number;
  condition: "MINT" | "GOOD" | "FAIR" | "DEGRADED" | "FAILED";
  healthScore: number;
  marketplaceEligible: boolean;
}

export interface DetectionOutput {
  components: DetectedComponentData[];
  totalDetected: number;
  confidenceAvg: number;
  processingTimeMs: number;
  model: string;
  version: string;
  provider: "MOCK" | "YOLO" | "RT-DETR";
  status: "DEMO" | "PROD";
}

export interface DetectionProvider {
  detect(input: DetectionInput): Promise<DetectionOutput>;
}

/**
 * Deterministic Mock / Demo Detection Provider
 */
export class MockDetectionProvider implements DetectionProvider {
  async detect(input: DetectionInput): Promise<DetectionOutput> {
    const sample = (input.sampleId && SAMPLE_DATASETS[input.sampleId]) || SAMPLE_DATASETS["router-board"];

    const components: DetectedComponentData[] = sample.detection.components.map((c) => ({
      componentId: c.id,
      type: c.type,
      name: c.name,
      manufacturer: c.manufacturer,
      partNumber: c.id.toUpperCase(),
      package: c.package,
      boundingBox: c.coordinates,
      confidence: +(c.confidence / 100).toFixed(3),
      condition: c.health > 85 ? "MINT" : c.health > 70 ? "GOOD" : "FAIR",
      healthScore: c.health,
      marketplaceEligible: c.health >= 75 && c.status.toLowerCase() !== "critical",
    }));

    return {
      components,
      totalDetected: components.length,
      confidenceAvg: +(sample.detection.confidenceAvg / 100).toFixed(3),
      processingTimeMs: sample.detection.inferenceTimeMs || 64,
      model: "YOLOv11-Circular-Spectro (Mock / Demo Provider)",
      version: "2.4.0",
      provider: "MOCK",
      status: "DEMO",
    };
  }
}

/**
 * Production YOLO Microservice Provider (Python FastAPI)
 */
export class YOLODetectionProvider implements DetectionProvider {
  private serviceUrl: string;

  constructor(serviceUrl?: string) {
    this.serviceUrl = serviceUrl || process.env.AI_SERVICE_URL || "http://localhost:8000";
  }

  async detect(input: DetectionInput): Promise<DetectionOutput> {
    try {
      const response = await fetch(`${this.serviceUrl}/detection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: input.analysisId,
          imageUrl: input.imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`YOLO AI Service returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        components: data.components,
        totalDetected: data.components.length,
        confidenceAvg: data.confidenceAvg || 0.95,
        processingTimeMs: data.processingTimeMs || 120,
        model: "YOLOv11x-Production-PyTorch",
        version: "1.0.0",
        provider: "YOLO",
        status: "PROD",
      };
    } catch (err: any) {
      console.warn(`[YOLO Provider] AI Service offline (${err.message}). Falling back to MockDetectionProvider.`);
      const fallback = new MockDetectionProvider();
      return fallback.detect(input);
    }
  }
}

export class RTDETRDetectionProvider implements DetectionProvider {
  async detect(input: DetectionInput): Promise<DetectionOutput> {
    // Transformer-based RT-DETR provider implementation slot
    const fallback = new MockDetectionProvider();
    const res = await fallback.detect(input);
    return {
      ...res,
      model: "RT-DETR-Large-Circular",
      provider: "RT-DETR",
    };
  }
}
