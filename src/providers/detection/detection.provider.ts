import { SAMPLE_DATASETS } from "@/lib/data/sampleDatasets";
import { normalizeComponentType } from "@/lib/taxonomy/componentTaxonomy";
import { runDirectAIInference } from "@/lib/services/directPythonService";
import { resolveComponentIntelligence } from "@/lib/services/componentCatalog";

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
  category?: string;
  manufacturer: string;
  partNumber: string;
  package: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  bbox?: { x: number; y: number; width: number; height: number };
  center?: { x: number; y: number };
  confidence: number;
  condition: string;
  visualCondition?: string;
  visualEvidence?: string;
  visibleMarking?: string;
  functionalRole?: string;
  description?: string;
  specifications?: {
    pinCount: string;
    mountingType: string;
    voltageRating: string;
    dimensionsMm?: string;
    operatingDomain: string;
    commonApplications: string;
  };
  datasheetUrl?: string;
  marketplaceEligible?: boolean;
  healthScore?: number;
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
  imageHash?: string;
  imageType?: string;
  imageClassification?: any;
  modules?: any;
  pcb?: any;
  quality?: {
    quality: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
    score: number;
    warnings: string[];
  };
  warnings?: string[];
  imageDimensions?: { width: number; height: number };
  visualCondition?: {
    score: number;
    conditions: any[];
    conditionBreakdown: Record<string, number>;
    disclaimer: string;
    modelVersion: string;
  };
  ocr?: any;
  summary?: any;
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
    const key = input.sampleId || "router-board";
    const sample =
      SAMPLE_DATASETS[key] ||
      SAMPLE_DATASETS[key.replace(/_/g, "-")] ||
      SAMPLE_DATASETS[key.replace(/-/g, "_")] ||
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

    let payload: any = null;
    let usedDirectInference = false;

    // 1. Fast probe of HTTP microservice with 150ms abort timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 150);
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          analysisId: input.analysisId,
          imageUrl: input.imageUrl,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        if (json.success) {
          payload = json;
        }
      }
    } catch (_httpErr) {
      // Microservice daemon not running or timed out, proceed immediately to direct PyTorch YOLO inference
    }

    // 2. If HTTP microservice was not reached or returned failure, run direct real YOLO pipeline
    if (!payload) {
      try {
        const directResult = await runDirectAIInference(input.imageUrl, input.analysisId);
        payload = {
          success: true,
          imageHash: directResult.imageHash,
          imageType: directResult.imageType,
          imageClassification: directResult.imageClassification,
          modules: directResult.modules,
          pcb: directResult.pcb,
          detections: directResult.detections,
          totalDetected: directResult.totalDetected,
          confidenceAverage: directResult.confidenceAverage,
          processingTimeMs: directResult.processingTimeMs,
          model: directResult.model,
          quality: directResult.quality,
          visualCondition: directResult.condition,
          ocr: directResult.ocr,
          summary: directResult.summary,
          image: directResult.quality?.metrics ? {
            width: directResult.quality.metrics.width,
            height: directResult.quality.metrics.height,
          } : { width: 1920, height: 1080 },
        };
        usedDirectInference = true;
      } catch (directErr: any) {
        throw new Error(
          `AI_INFERENCE_UNAVAILABLE: Real YOLO model could not process the image. Reason: ${directErr.message}`
        );
      }
    }

    const rawDetections = payload.detections || [];
    const directConditions = payload.visualCondition?.conditions || [];
    const directMarkings = payload.ocr?.markings || [];
    const imgWidth = payload.image?.width || 1920;
    const imgHeight = payload.image?.height || 1080;

    const components: DetectedComponentData[] = rawDetections.map(
      (d: any, idx: number) => {
        const canonicalType = normalizeComponentType(d.className);
        const seq = String(idx + 1).padStart(3, "0");
        const compId = `CMP-ECI-${input.analysisId.slice(-4).toUpperCase()}-${seq}`;
        const conditionItem = directConditions[idx] || directConditions.find((c: any) => c.componentId === compId);

        // Find any visible marking near or on this component
        const associatedMarking = directMarkings.find((m: any) => {
          const mb = m.boundingBox;
          return mb && (
            mb.x >= d.bbox.x - 20 &&
            mb.x <= d.bbox.x + d.bbox.width + 20 &&
            mb.y >= d.bbox.y - 20 &&
            mb.y <= d.bbox.y + d.bbox.height + 20
          );
        });

        const normBox = d.normalizedBbox || {
          x: d.bbox.x / imgWidth,
          y: d.bbox.y / imgHeight,
          width: d.bbox.width / imgWidth,
          height: d.bbox.height / imgHeight,
        };

        const percentBox = {
          x: +(normBox.x * 100).toFixed(2),
          y: +(normBox.y * 100).toFixed(2),
          width: +(normBox.width * 100).toFixed(2),
          height: +(normBox.height * 100).toFixed(2),
        };

        const isUncertain = d.confidence < 0.45;
        const compCategory = isUncertain ? "Unknown electronic component" : canonicalType;

        // Resolve exact engineering intelligence & specifications
        const intel = resolveComponentIntelligence(
          d.className,
          d.bbox,
          associatedMarking?.isReadable ? associatedMarking.text : undefined,
          idx + 1
        );

        return {
          componentId: compId,
          type: compCategory,
          name: intel.name,
          category: intel.category,
          manufacturer: intel.manufacturer,
          partNumber: associatedMarking?.isReadable ? associatedMarking.text : intel.partNumber,
          package: intel.package,
          functionalRole: intel.functionalRole,
          description: intel.description,
          specifications: intel.specifications,
          datasheetUrl: intel.datasheetUrl,
          boundingBox: percentBox,
          bbox: percentBox,
          center: {
            x: +(percentBox.x + percentBox.width / 2).toFixed(2),
            y: +(percentBox.y + percentBox.height / 2).toFixed(2),
          },
          confidence: d.confidence,
          condition: (conditionItem?.visualCondition || "NORMAL") as any,
          visualCondition: conditionItem?.visualCondition || "NORMAL",
          visualEvidence: conditionItem?.visualEvidence || "Visible optical surface inspection",
          visibleMarking: associatedMarking ? associatedMarking.text : "No readable marking in crop",
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
      version: payload.model?.version || "v1.0.0",
      datasetVersion: "pcb-components-v1",
      provider: "YOLO",
      status: "PROD",
      imageHash: payload.imageHash,
      imageType: payload.imageType,
      imageClassification: payload.imageClassification,
      modules: payload.modules,
      pcb: payload.pcb,
      quality: payload.quality,
      visualCondition: payload.visualCondition,
      ocr: payload.ocr,
      summary: payload.summary,
      warnings: payload.warnings || (usedDirectInference ? ["Executed via direct PyTorch YOLO inference"] : []),
      imageDimensions: payload.image,
      detections: payload.detections,
    };
  }
}

/**
 * Detection Service Orchestrator
 * Routes requests to real YOLO detection engine. Never silently substitutes failed real requests with mock datasets.
 */
export class DetectionService {
  private mockProvider: MockDetectionProvider;
  private yoloProvider: YOLODetectionProvider;

  constructor() {
    this.mockProvider = new MockDetectionProvider();
    this.yoloProvider = new YOLODetectionProvider();
  }

  getProvider(sourceType?: string, sampleId?: string): DetectionProvider {
    const configured = (process.env.DETECTION_PROVIDER || "yolo").toLowerCase();
    
    // Only use mock if specifically requesting an archived sample dataset
    if (sourceType === "SAMPLE" && sampleId && sampleId !== "custom" && configured === "mock") {
      return this.mockProvider;
    }

    // Default to real YOLO model for all uploads and analysis
    return this.yoloProvider;
  }

  async detect(input: DetectionInput): Promise<DetectionOutput> {
    const provider = this.getProvider(input.sourceType, input.sampleId);
    return await provider.detect(input);
  }
}

export const detectionService = new DetectionService();
export default detectionService;
