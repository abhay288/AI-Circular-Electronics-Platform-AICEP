import { execFile } from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

export interface DirectInferenceResult {
  success: boolean;
  analysisId: string;
  imageHash?: string;
  imageType?: string;
  imageClassification?: any;
  modules?: Record<string, any>;
  model: {
    name: string;
    version: string;
    customTrained: boolean;
    device: string;
    classTaxonomy?: Record<string, string>;
  };
  quality?: any;
  totalDetected: number;
  confidenceAverage: number;
  processingTimeMs: number;
  detections: Array<{
    classId: number;
    className: string;
    confidence: number;
    bbox: { x: number; y: number; width: number; height: number };
    normalizedBbox: { x: number; y: number; width: number; height: number };
  }>;
  pcb: {
    modelName?: string;
    status?: string;
    message?: string;
    board: any;
    layers?: any;
    traces: any[];
    pads: any[];
    vias: any[];
    damagedRegions: any[];
    topology: any;
    metrics: any;
    warnings?: string[];
    reconstruction: any;
  };
  condition: {
    score?: number;
    visualConditionScore?: number;
    overallAssessment?: string;
    findingsCount?: number;
    conditions?: Array<{
      componentId: string;
      className: string;
      visualCondition: string;
      severity: string;
      confidence: number;
      visualEvidence: string;
      electricalIntegrity: string;
      boundingBox: any;
    }>;
    conditionBreakdown: Record<string, number>;
    disclaimer: string;
    modelVersion: string;
  };
  ocr?: {
    totalMarkingsDetected: number;
    readableMarkingsCount: number;
    uncertainMarkingsCount: number;
    markings: Array<{
      markingId: string;
      text: string;
      isReadable: boolean;
      confidence: number;
      type: string;
      clarityScore: number;
      boundingBox: { x: number; y: number; width: number; height: number };
      normalizedBoundingBox: { x: number; y: number; width: number; height: number };
      associatedComponent?: string | null;
      status: string;
      observation: string;
    }>;
    ocrEngine: string;
    policy: string;
  };
  summary?: {
    classification: string;
    statement: string;
    findingsCount: number;
    damageFindings: any[];
    opticalLimitations: string[];
    recommendedManualInspections: string[];
  };
}

// In-memory cache for the duration of a session pipeline run
const pipelineCache = new Map<string, DirectInferenceResult>();

export async function runDirectAIInference(
  imageUrl: string,
  analysisId: string
): Promise<DirectInferenceResult> {
  // Check cache first so detection and pcb stages share one unified real model pass
  if (pipelineCache.has(analysisId)) {
    return pipelineCache.get(analysisId)!;
  }

  const baseDir = process.cwd();
  const scriptPath = path.join(baseDir, "scripts", "direct_ai_inference.py");

  if (!fs.existsSync(scriptPath)) {
    throw new Error(
      `AI_INFERENCE_UNAVAILABLE: Script not found at ${scriptPath}`
    );
  }

  let tempFilePath: string | null = null;
  let imageArg = imageUrl;

  // Check if physical file exists in session uploads directory first (fastest, no base64 overhead)
  const cleanId = analysisId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const uploadDir = path.join(baseDir, ".eco_sessions", "uploads");
  const candidates = [
    path.join(uploadDir, `${cleanId}.jpg`),
    path.join(uploadDir, `${cleanId}.png`),
    path.join(uploadDir, `${cleanId}.webp`),
  ];
  const foundFile = candidates.find((c) => fs.existsSync(c));
  if (foundFile) {
    imageArg = foundFile;
  } else if (imageUrl.startsWith("data:image")) {
    // Handle base64 Data URIs safely without hitting Windows argv command line length limits
    tempFilePath = path.join(
      os.tmpdir(),
      `eco_intel_${cleanId}_${Date.now()}.b64`
    );
    fs.writeFileSync(tempFilePath, imageUrl, "utf-8");
    imageArg = tempFilePath;
  }

  return new Promise((resolve, reject) => {
    // Look for python executable
    const pythonCmd = process.platform === "win32" ? "python" : "python3";

    execFile(
      pythonCmd,
      [scriptPath, imageArg, analysisId],
      {
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large PCB geometry payloads
        timeout: 60000, // 60s timeout
      },
      (error, stdout, stderr) => {
        // Clean up temp file if created
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          try {
            fs.unlinkSync(tempFilePath);
          } catch (_) {}
        }

        if (error) {
          const detail = stderr?.trim() || error.message;
          return reject(
            new Error(
              `AI_INFERENCE_UNAVAILABLE: Real PyTorch YOLO & OpenCV pipeline execution failed: ${detail}`
            )
          );
        }

        try {
          // Extract JSON string from stdout
          const jsonStart = stdout.indexOf("{");
          const jsonEnd = stdout.lastIndexOf("}");
          if (jsonStart === -1 || jsonEnd === -1) {
            return reject(
              new Error(
                `AI_INFERENCE_PARSE_ERROR: Failed to parse AI output. Raw stdout: ${stdout.slice(0, 500)}`
              )
            );
          }

          const rawJson = stdout.substring(jsonStart, jsonEnd + 1);
          const parsed: DirectInferenceResult = JSON.parse(rawJson);

          if (!parsed.success) {
            return reject(
              new Error(
                `AI_INFERENCE_FAILED: Model returned error: ${(parsed as any).error || "Unknown error"}`
              )
            );
          }

          // Cache result for subsequent stages in the same pipeline run
          pipelineCache.set(analysisId, parsed);
          // Auto-expire cache after 5 minutes
          setTimeout(() => pipelineCache.delete(analysisId), 300000);

          resolve(parsed);
        } catch (parseErr: any) {
          reject(
            new Error(
              `AI_INFERENCE_JSON_ERROR: Could not decode model JSON response: ${parseErr.message}`
            )
          );
        }
      }
    );
  });
}
