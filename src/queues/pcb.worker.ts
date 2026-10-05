import { Worker, Job } from "bullmq";
import dbConnect from "@/lib/db";
import { AnalysisSession } from "@/models/AnalysisSession";
import { UploadedAsset } from "@/models/UploadedAsset";
import { DetectionResult } from "@/models/DetectionResult";
import { Component } from "@/models/Component";
import { PCBAnalysis } from "@/models/PCBAnalysis";
import { AuditLog } from "@/models/AuditLog";
import { pcbAnalysisService } from "@/providers/pcb/pcb.provider";
import { redisConnection, PCBJobPayload } from "./pcb.queue";

/**
 * Core business logic for executing a PCB Analysis & Reconstruction Job
 */
export async function runPCBWorkerJob(payload: PCBJobPayload) {
  await dbConnect();
  const { analysisId, assetId } = payload;

  const session = await AnalysisSession.findOne({ analysisId });
  if (!session) {
    throw new Error(`AnalysisSession not found for analysisId=${analysisId}`);
  }

  // Idempotency check: if PCB analysis is already completed, do not duplicate
  const existingPCB = await PCBAnalysis.findOne({ analysisId });
  if (existingPCB && (session.status === "PCB_COMPLETE" || session.stageStatuses?.pcb === "completed")) {
    console.log(`[PCBWorker] PCB Analysis already completed for analysisId=${analysisId}. Skipping duplicate work.`);
    return {
      success: true,
      pcbAnalysisId: existingPCB._id,
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

  const startTime = Date.now();

  // Audit: PCB_ANALYSIS_STARTED
  await AuditLog.create({
    analysisId,
    userId: session.userId ? String(session.userId) : "system-user",
    action: "PCB_ANALYSIS_STARTED",
    resource: "AnalysisSession",
    resourceId: analysisId,
    metadata: {
      provider: process.env.PCB_PROVIDER || "mock",
      sampleId: session.sampleId,
      timestamp: new Date().toISOString(),
    },
  });

  // Update session stage
  session.status = "PCB_ANALYSIS_PROCESSING";
  session.currentStage = "PCB";
  session.stageStatuses.pcb = "processing";
  session.progress = Math.max(session.progress, 35);
  session.markModified("stageStatuses");
  await session.save();

  try {
    // Fetch detections to associate with traces & pads
    let detections: any[] = [];
    const detResult = await DetectionResult.findOne({ analysisId });
    if (detResult && detResult.components && detResult.components.length > 0) {
      detections = detResult.components;
    } else {
      const compDocs = await Component.find({ analysisId });
      detections = compDocs.map((c) => ({
        componentId: c.serialNumber,
        type: c.type,
        name: c.name,
        confidence: c.confidence,
        boundingBox: c.boundingBox,
      }));
    }

    // Execute PCB analysis via provider (Mock or Vision)
    const pcbOutput = await pcbAnalysisService.analyze({
      analysisId: session.analysisId,
      sampleId: session.sampleId,
      imageUrl: imageUrl || "/images/samples/router_board.jpg",
      detections,
      componentsCount: detections.length,
    });

    // Audit pipeline milestones
    await AuditLog.create({
      analysisId,
      userId: session.userId ? String(session.userId) : "system-user",
      action: "PCB_GEOMETRY_DETECTED",
      resource: "PCBAnalysis",
      resourceId: analysisId,
      metadata: {
        widthPixels: pcbOutput.board?.widthPixels,
        heightPixels: pcbOutput.board?.heightPixels,
        confidence: pcbOutput.board?.confidence,
      },
    });

    await AuditLog.create({
      analysisId,
      userId: session.userId ? String(session.userId) : "system-user",
      action: "TRACE_ANALYSIS_COMPLETED",
      resource: "PCBAnalysis",
      resourceId: analysisId,
      metadata: {
        tracesCount: pcbOutput.traces?.length || 0,
        padsCount: pcbOutput.pads?.length || 0,
        viasCount: pcbOutput.vias?.length || 0,
      },
    });

    await AuditLog.create({
      analysisId,
      userId: session.userId ? String(session.userId) : "system-user",
      action: "TOPOLOGY_GENERATED",
      resource: "PCBAnalysis",
      resourceId: analysisId,
      metadata: {
        nodesCount: pcbOutput.topology?.nodesCount || 0,
        edgesCount: pcbOutput.topology?.edgesCount || 0,
      },
    });

    await AuditLog.create({
      analysisId,
      userId: session.userId ? String(session.userId) : "system-user",
      action: "DAMAGE_ANALYSIS_COMPLETED",
      resource: "PCBAnalysis",
      resourceId: analysisId,
      metadata: {
        damagedRegionsCount: pcbOutput.damagedRegions?.length || 0,
      },
    });

    await AuditLog.create({
      analysisId,
      userId: session.userId ? String(session.userId) : "system-user",
      action: "RECONSTRUCTION_COMPLETED",
      resource: "PCBAnalysis",
      resourceId: analysisId,
      metadata: {
        reconstructionConfidence: pcbOutput.reconstruction?.overallReconstructionConfidence || 85,
        visualIntegrityEstimate: pcbOutput.reconstruction?.visualIntegrityEstimate || 90,
      },
    });

    // Idempotent upsert of PCBAnalysis document
    const pcbDoc = await PCBAnalysis.findOneAndUpdate(
      { analysisId: session.analysisId },
      {
        analysisId: session.analysisId,
        provider: pcbOutput.provider,
        modelName: pcbOutput.modelName || "EcoIntel-PCB-Topology-Engine",
        modelVersion: pcbOutput.modelVersion || "v1.0.0",
        status: pcbOutput.status || "COMPLETED",
        board: pcbOutput.board,
        layers: pcbOutput.layers,
        components: pcbOutput.components || [],
        traces: pcbOutput.traces || [],
        pads: pcbOutput.pads || [],
        vias: pcbOutput.vias || [],
        damagedRegions: pcbOutput.damagedRegions || [],
        topology: pcbOutput.topology,
        reconstruction: pcbOutput.reconstruction,
        metrics: pcbOutput.metrics,
        warnings: pcbOutput.warnings || [],
        boardType: pcbOutput.boardType,
        layerCount: pcbOutput.layerCount,
        componentCount: pcbOutput.componentCount,
        traceCount: pcbOutput.traceCount,
        traceContinuity: pcbOutput.traceContinuity,
        boardIntegrity: pcbOutput.boardIntegrity,
        reconstructedRegions: pcbOutput.reconstructedRegions || [],
        schematics: pcbOutput.schematics || {},
      },
      { upsert: true, new: true }
    );

    // Update AnalysisSession
    session.pcbAnalysisId = pcbDoc._id;
    session.reconstructionResult = {
      pcbId: `PCB-${session.analysisId}`,
      boardModel: pcbOutput.boardType || "Multi-layer FR-4 Substrate",
      layerCount: pcbOutput.layers?.estimatedCount || pcbOutput.layerCount || 2,
      traceIntegrityPercent: pcbOutput.metrics?.visualIntegrityScore || pcbOutput.traceContinuity || 90,
      severedTracesRepaired: pcbOutput.reconstructedRegions?.[0]?.repairedTraces || 1,
      reconstructionConfidence: +( (pcbOutput.reconstruction?.overallReconstructionConfidence || 85) / 100 ).toFixed(2),
      schematics: pcbOutput.schematics || {},
    };

    session.status = "PCB_COMPLETE";
    session.currentStage = "RUL"; // RUL queued, Phase 3 stops here
    session.stageStatuses.pcb = "completed";
    session.stageStatuses.rul = "pending";
    session.progress = Math.max(session.progress, 50);
    session.markModified("stageStatuses");
    await session.save();

    return {
      success: true,
      pcbAnalysisId: pcbDoc._id,
      status: "PCB_COMPLETE",
    };
  } catch (err: any) {
    console.error(`[PCBWorker Error on ${analysisId}]:`, err.message);

    session.status = "PCB_ANALYSIS_FAILED";
    session.error = {
      code: "PCB_ANALYSIS_FAILED",
      message: err.message || "PCB analysis could not be completed.",
      stage: "PCB",
    };
    session.stageStatuses.pcb = "failed";
    await session.save();

    // Audit: PCB_ANALYSIS_FAILED
    await AuditLog.create({
      analysisId,
      userId: session.userId ? String(session.userId) : "system-user",
      action: "PCB_ANALYSIS_FAILED",
      resource: "AnalysisSession",
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
let pcbWorker: Worker<PCBJobPayload> | null = null;

if (redisConnection && process.env.REDIS_URL) {
  try {
    pcbWorker = new Worker<PCBJobPayload>(
      "pcb-queue",
      async (job: Job<PCBJobPayload>) => {
        console.log(`[BullMQ PCBWorker] Processing job ${job.id} for analysisId=${job.data.analysisId}`);
        return runPCBWorkerJob(job.data);
      },
      {
        connection: redisConnection,
        concurrency: 2,
      }
    );

    pcbWorker.on("completed", (job) => {
      console.log(`[BullMQ PCBWorker] Job ${job.id} completed successfully.`);
    });

    pcbWorker.on("failed", (job, err) => {
      console.error(`[BullMQ PCBWorker] Job ${job?.id} failed:`, err.message);
    });
  } catch (workerInitErr: any) {
    console.warn(`[BullMQ PCBWorker] Worker initialization skipped: ${workerInitErr.message}`);
  }
}

export { pcbWorker };
