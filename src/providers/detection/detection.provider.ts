import { SAMPLE_DATASETS } from "@/lib/data/sampleDatasets";
import { normalizeComponentType } from "@/lib/taxonomy/componentTaxonomy";

export interface DetectionInput {
  analysisId: string;
  imageUrl: string;
  sampleId?: string;
  mode?: "LIVE" | "DEMO";
  sourceType?: "SAMPLE" | "UPLOAD" | "CAMERA";
}

export interface DetectedComponentData {
  componentId: string;
  type: string;
  name: string;
  manufacturer: string;
  partNumber: string;
  package: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  bbox?: { x: number; y: number; width: number; height: number };
  center?: { x: number; y: number };
  confidence: number;
  condition: "UNKNOWN" | "MINT" | "GOOD" | "FAIR" | "DEGRADED" | "FAILED";
  healthScore: number;
  marketplaceEligible: boolean;
}

export interface DetectionOutput {
  components: DetectedComponentData[];
  totalDetected: number;
  confidenceAvg: number;
  confidenceAverage?: number;
  processingTimeMs: number;
  model: string;
  version: string;
  datasetVersion?: string;
  provider: "MOCK" | "YOLO" | "RT-DETR";
  status: "DEMO" | "PROD";
  quality?: {
    quality: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
    score: number;
    warnings: string[];
  };
  warnings?: string[];
  imageDimensions?: { width: number; height: number };
  detections?: Array<{
    classId: number;
    className: string;
    confidence: number;
    bbox: { x: number; y: number; width: number; height: number };
    normalizedBbox: { x: number; y: number; width: number; height: number };
  }>;
}

export interface DetectionProvider {
  detect(input: DetectionInput): Promise<DetectionOutput>;
}

/**
 * Deterministic Mock / Demo Detection Provider
 */
export class MockDetectionProvider implements DetectionProvider {
  async detect(input: DetectionInput): Promise<DetectionOutput> {
    const sample =
      (input.sampleId && SAMPLE_DATASETS[input.sampleId]) ||
      SAMPLE_DATASETS["router-board"];

    const components: DetectedComponentData[] = sample.detection.components.map(
      (c, idx) => {
        const canonicalType = normalizeComponentType(c.type);
        const seq = String(idx + 1).padStart(3, "0");
        const compId = `CMP-ECI-${input.analysisId.slice(-4).toUpperCase()}-${seq}`;

        return {
          componentId: compId,
          type: canonicalType,
          name: c.name,
          manufacturer: c.manufacturer || "Generic",
          partNumber: c.id.toUpperCase(),
          package: c.package || "SMD",
          boundingBox: c.coordinates,
          bbox: c.coordinates,
          center: {
            x: +(c.coordinates.x + c.coordinates.width / 2).toFixed(2),
            y: +(c.coordinates.y + c.coordinates.height / 2).toFixed(2),
          },
          confidence: +(c.confidence / 100).toFixed(3),
          // In initial detection stage, real health/RUL is UNKNOWN until health stage runs
          condition: "UNKNOWN",
          healthScore: 0,
          marketplaceEligible: false,
        };
      }
    );

    return {
      components,
      totalDetected: components.length,
      confidenceAvg: +(sample.detection.confidenceAvg / 100).toFixed(3),
      confidenceAverage: +(sample.detection.confidenceAvg / 100).toFixed(3),
      processingTimeMs: sample.detection.inferenceTimeMs || 64,
      model: "EcoIntel-PCB-YOLO (Demo Dataset Provider)",
      version: "v0.1.0-demo",
      datasetVersion: "pcb-components-v1-demo",
      provider: "MOCK",
      status: "DEMO",
      quality: {
        quality: "EXCELLENT",
        score: 0.96,
        warnings: [],
      },
      warnings: [],
      imageDimensions: { width: 1920, height: 1080 },
    };
  }
}

/**
 * Production YOLO Microservice Provider (Python FastAPI)
 */
export class YOLODetectionProvider implements DetectionProvider {
  private serviceUrl: string;
  private apiKey: string;

  constructor(serviceUrl?: string, apiKey?: string) {
    this.serviceUrl =
      serviceUrl || process.env.AI_SERVICE_URL || "http://localhost:8001";
    this.apiKey =
      apiKey || process.env.AI_SERVICE_API_KEY || "eco-intel-internal-ai-key-2026";
  }

  async detect(input: DetectionInput): Promise<DetectionOutput> {
    const url = `${this.serviceUrl}/detection`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          analysisId: input.analysisId,
          imageUrl: input.imageUrl,
        }),
      });
    } catch (networkErr: any) {
      throw new Error(
        `AI_SERVICE_UNAVAILABLE: Could not connect to AI microservice at ${this.serviceUrl} (${networkErr.message}).`
      );
    }

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      throw new Error(
        `DETECTION_FAILED: AI Service responded with HTTP ${response.status}: ${errBody || response.statusText}`
      );
    }

    const payload = await response.json();
    if (!payload.success) {
      throw new Error(
        payload.error?.message || "DETECTION_FAILED: YOLO inference failed on image."
      );
    }

    const rawDetections = payload.detections || [];
    const components: DetectedComponentData[] = rawDetections.map(
      (d: any, idx: number) => {
        const canonicalType = normalizeComponentType(d.className);
        const seq = String(idx + 1).padStart(3, "0");
        const compId = `CMP-ECI-${input.analysisId.slice(-4).toUpperCase()}-${seq}`;

        const normBox = d.normalizedBbox || {
          x: d.bbox.x / payload.image.width,
          y: d.bbox.y / payload.image.height,
          width: d.bbox.width / payload.image.width,
          height: d.bbox.height / payload.image.height,
        };

        const percentBox = {
          x: +(normBox.x * 100).toFixed(2),
          y: +(normBox.y * 100).toFixed(2),
          width: +(normBox.width * 100).toFixed(2),
          height: +(normBox.height * 100).toFixed(2),
        };

        return {
          componentId: compId,
          type: canonicalType,
          name: `${canonicalType} ${d.className !== canonicalType ? d.className : ""}`.trim(),
          manufacturer: "Identified via Optical AI",
          partNumber: `${canonicalType.toUpperCase()}-${d.classId}`,
          package: canonicalType === "IC" ? "QFP/BGA" : "SMD",
          boundingBox: percentBox,
          bbox: percentBox,
          center: {
            x: +(percentBox.x + percentBox.width / 2).toFixed(2),
            y: +(percentBox.y + percentBox.height / 2).toFixed(2),
          },
          confidence: d.confidence,
          condition: "UNKNOWN",
          healthScore: 0,
          marketplaceEligible: false,
        };
      }
    );

    return {
      components,
      totalDetected: payload.totalDetected || components.length,
      confidenceAvg: payload.confidenceAverage || 0,
      confidenceAverage: payload.confidenceAverage || 0,
      processingTimeMs: payload.processingTimeMs || 0,
      model: payload.model?.name || "EcoIntel-PCB-YOLO",
      version: payload.model?.version || "v0.1.0",
      datasetVersion: "pcb-components-v1",
      provider: "YOLO",
      status: "PROD",
      quality: payload.quality,
      warnings: payload.warnings || [],
      imageDimensions: payload.image,
      detections: payload.detections,
    };
  }
}

/**
 * Detection Service Orchestrator
 * Switches dynamically between Mock and YOLO based on environment and source type.
 */
export class DetectionService {
  private mockProvider: MockDetectionProvider;
  private yoloProvider: YOLODetectionProvider;

  constructor() {
    this.mockProvider = new MockDetectionProvider();
    this.yoloProvider = new YOLODetectionProvider();
  }

  getProvider(sourceType?: string, sampleId?: string): DetectionProvider {
    const configured = (process.env.DETECTION_PROVIDER || "mock").toLowerCase();
    
    // If configured as YOLO and it's a real user upload (not a fixed demo sample)
    if (configured === "yolo" && sourceType !== "SAMPLE" && (!sampleId || sampleId === "custom")) {
      return this.yoloProvider;
    }

    if (configured === "yolo" && sourceType === "UPLOAD") {
      return this.yoloProvider;
    }

    return this.mockProvider;
  }

  async detect(input: DetectionInput): Promise<DetectionOutput> {
    const provider = this.getProvider(input.sourceType, input.sampleId);
    return provider.detect(input);
  }
}

export const detectionService = new DetectionService();
export default detectionService;
