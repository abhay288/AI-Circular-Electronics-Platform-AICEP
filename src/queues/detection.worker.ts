import { Worker, Job } from "bullmq";
import dbConnect from "@/lib/db";
import { AnalysisSession } from "@/models/AnalysisSession";
import { UploadedAsset } from "@/models/UploadedAsset";
import { DetectionResult } from "@/models/DetectionResult";
import { Component } from "@/models/Component";
import { AuditLog } from "@/models/AuditLog";
import { detectionService } from "@/providers/detection/detection.provider";
import { redisConnection, DetectionJobPayload } from "./detection.queue";
import { analysisPipeline } from "@/services/pipeline.service";

/**
 * Core business logic for executing a Detection Job
 */
export async function runDetectionWorkerJob(payload: DetectionJobPayload) {
  await dbConnect();
  const { analysisId, assetId, sourceType } = payload;

  const session = await AnalysisSession.findOne({ analysisId });
  if (!session) {
    throw new Error(`AnalysisSession not found for analysisId=${analysisId}`);
  }

  // Idempotency check: if detection is already completed, do not duplicate
  const existingDetection = await DetectionResult.findOne({ analysisId });
  if (existingDetection && session.stageStatuses?.detection === "completed") {
    console.log(`[DetectionWorker] Detection already completed for analysisId=${analysisId}. Skipping duplicate work.`);
    return {
      success: true,
      detectionId: existingDetection._id,
      reused: true,
    };
  }

  // Determine image source
  let imageUrl = session.imageUrl;
  if (!imageUrl && assetId) {
    const asset = await UploadedAsset.findById(assetId);
    if (asset?.storageUrl) {
      imageUrl = asset.storageUrl;
    }
  }

  // Audit: DETECTION_STARTED
  await AuditLog.create({
    analysisId,
    userId: session.userId,
    action: "DETECTION_STARTED",
    resourceType: "AnalysisSession",
    resourceId: analysisId,
    metadata: {
      sourceType: sourceType || session.sourceType,
      sampleId: session.sampleId,
      timestamp: new Date().toISOString(),
    },
  });

  // Update session stage
  session.currentStage = "DETECTION";
  session.stageStatuses.detection = "processing";
  session.progress = Math.max(session.progress, 15);
  await session.save();

  const startTime = Date.now();

  try {
    // Call DetectionService (chooses Mock or YOLO based on config & input)
    const output = await detectionService.detect({
      analysisId: session.analysisId,
      imageUrl: imageUrl || "/images/samples/router_board.jpg",
      sampleId: session.sampleId,
      mode: session.mode,
      sourceType: (sourceType || session.sourceType) as any,
    });

    // Idempotent upsert of DetectionResult
    const detectionDoc = await DetectionResult.findOneAndUpdate(
      { analysisId: session.analysisId },
      {
        analysisId: session.analysisId,
        assetId: assetId || undefined,
        components: output.components,
        totalDetected: output.totalDetected,
        confidenceAverage: output.confidenceAverage || output.confidenceAvg,
        confidenceAvg: output.confidenceAvg,
        processingTimeMs: output.processingTimeMs,
        modelName: output.model,
        modelVersion: output.version,
        datasetVersion: output.datasetVersion || "pcb-components-v1",
        model: output.model,
        version: output.version,
        provider: output.provider,
        status: output.status,
        quality: output.quality || {
          quality: "GOOD",
          score: 0.9,
          warnings: [],
        },
        warnings: output.warnings || [],
        imageWidth: output.imageDimensions?.width || 1920,
        imageHeight: output.imageDimensions?.height || 1080,
        detections: output.detections || [],
      },
      { upsert: true, new: true }
    );

    // Idempotently create Component records
    await Component.deleteMany({ analysisId: session.analysisId });
    const componentDocs = output.components.map((c, idx) => {
      const seq = String(idx + 1).padStart(3, "0");
      const serialNum = `CMP-ECI-${session.analysisId.slice(-4).toUpperCase()}-${seq}`;
      const centerCoord = c.center || {
        x: +(c.boundingBox.x + c.boundingBox.width / 2).toFixed(2),
        y: +(c.boundingBox.y + c.boundingBox.height / 2).toFixed(2),
      };

      return {
        analysisId: session.analysisId,
        detectionResultId: String(detectionDoc._id),
        serialNumber: serialNum,
        type: c.type,
        name: c.name,
        manufacturer: c.manufacturer || "Generic",
        partNumber: c.partNumber || `${c.type.toUpperCase()}-${seq}`,
        package: c.package || "SMD",
        boundingBox: c.boundingBox,
        bbox: c.boundingBox,
        center: centerCoord,
        confidence: c.confidence,
        condition: "UNKNOWN" as const, // Real condition pending Health/RUL phase
        healthScore: 0,
        estimatedRUL: { hours: 0, years: 0 },
        marketplaceEligible: false,
      };
    });

    if (componentDocs.length > 0) {
      await Component.insertMany(componentDocs);
    }

    // Update AnalysisSession
    session.detectionId = detectionDoc._id;
    session.detectionResult = {
      model: output.model,
      inferenceTimeMs: output.processingTimeMs,
      componentsCount: output.totalDetected,
      components: output.components,
      confidenceAvg: +(output.confidenceAvg * 100).toFixed(1),
    };
    session.stageStatuses.detection = "completed";
    session.progress = Math.max(session.progress, 25);
    await session.save();

    // Audit: DETECTION_COMPLETED
    await AuditLog.create({
      analysisId,
      userId: session.userId,
      action: "DETECTION_COMPLETED",
      resourceType: "DetectionResult",
      resourceId: String(detectionDoc._id),
      metadata: {
        model: output.model,
        version: output.version,
        durationMs: Date.now() - startTime,
        resultCount: output.totalDetected,
        confidenceAvg: output.confidenceAvg,
      },
    });

    // Trigger next pipeline stage: PCB Analysis
    if (session.status !== "FAILED") {
      const { enqueuePCBJob } = await import("./pcb.queue");
      await enqueuePCBJob({
        analysisId,
        detectionResultId: String(detectionDoc._id),
        assetId: assetId || (session.sourceFileId ? String(session.sourceFileId) : undefined),
        sourceType: (sourceType || session.sourceType) as any,
      });
    }

    return {
      success: true,
      detectionId: detectionDoc._id,
      totalDetected: output.totalDetected,
    };
  } catch (err: any) {
    console.error(`[DetectionWorker Error on ${analysisId}]:`, err.message);

    session.status = "FAILED";
    session.error = {
      code: "DETECTION_FAILED",
      message: err.message || "Component detection could not be completed.",
      stage: "DETECTION",
    };
    session.stageStatuses.detection = "failed";
    await session.save();

    // Audit: DETECTION_FAILED
    await AuditLog.create({
      analysisId,
      userId: session.userId,
      action: "DETECTION_FAILED",
      resourceType: "AnalysisSession",
      resourceId: analysisId,
      metadata: {
        error: err.message,
        durationMs: Date.now() - startTime,
      },
    });

    throw err;
  }
}

// Start BullMQ Worker if Redis connection is active
let detectionWorker: Worker<DetectionJobPayload> | null = null;

if (redisConnection && process.env.REDIS_URL) {
  try {
    detectionWorker = new Worker<DetectionJobPayload>(
      "detection-queue",
      async (job: Job<DetectionJobPayload>) => {
        console.log(`[BullMQ Worker] Processing detection job ${job.id} for analysisId=${job.data.analysisId}`);
        return runDetectionWorkerJob(job.data);
      },
      {
        connection: redisConnection,
        concurrency: 4,
      }
    );

    detectionWorker.on("completed", (job) => {
      console.log(`[BullMQ Worker] Job ${job.id} completed successfully.`);
    });

    detectionWorker.on("failed", (job, err) => {
      console.error(`[BullMQ Worker] Job ${job?.id} failed:`, err.message);
    });
  } catch (workerInitErr: any) {
    console.warn(`[BullMQ Worker] Worker initialization skipped: ${workerInitErr.message}`);
  }
}

export { detectionWorker };
