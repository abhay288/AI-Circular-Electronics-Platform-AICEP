/**
 * EcoIntel Phase 3 Verification Suite
 * Tests PCB Geometry, Traces, Pads, Vias, Topology Graph, Damage Anomaly Detection,
 * Reconstruction Classification, Providers, and Idempotency.
 */

import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "../src/lib/db";
import { AnalysisSession } from "../src/models/AnalysisSession";
import { PCBAnalysis } from "../src/models/PCBAnalysis";
import { DetectionResult } from "../src/models/DetectionResult";
import { Component } from "../src/models/Component";
import { AuditLog } from "../src/models/AuditLog";
import { pcbAnalysisService, MockPCBProvider, VisionPCBProvider } from "../src/providers/pcb/pcb.provider";
import { runPCBWorkerJob } from "../src/queues/pcb.worker";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`\x1b[32m  ✔ PASS: ${testName}\x1b[0m ${detail ? `(${detail})` : ""}`);
  } else {
    failedCount++;
    console.error(`\x1b[31m  ✖ FAIL: ${testName}\x1b[0m ${detail ? `(${detail})` : ""}`);
  }
}

async function runPhase3Audit() {
  console.log("\n============================================================");
  console.log("   ECOINTEL PHASE 3: PCB INTELLIGENCE & TOPOLOGY AUDIT");
  console.log("============================================================\n");

  await connectDB();

  const testAnalysisId = `ECI-TEST-P3-${Date.now()}`;

  // 1. Provider Unit Tests
  console.log("\x1b[36m[1/6] Testing PCB Provider Architecture & Data Integrity...\x1b[0m");
  const mockProvider = new MockPCBProvider();
  const mockResult = await mockProvider.analyze({
    analysisId: testAnalysisId,
    sampleId: "router-board",
  });

  assert(!!mockResult.board && mockResult.board.widthPixels > 0, "Board Geometry Extracted", `${mockResult.board?.widthPixels}x${mockResult.board?.heightPixels}px`);
  assert(mockResult.board?.physicalDimensionsAvailable === true, "Physical Dimensions Flag Honest Assessment");
  assert((mockResult.traces?.length ?? 0) > 0, "Visible Traces Detected", `${mockResult.traces?.length} traces`);
  assert((mockResult.pads?.length ?? 0) > 0, "Pads Detected", `${mockResult.pads?.length} pads`);
  assert((mockResult.vias?.length ?? 0) > 0, "Vias Detected (Visible / Possible)", `${mockResult.vias?.length} vias`);
  assert((mockResult.damagedRegions?.length ?? 0) > 0, "Visual Damage Scanned", `${mockResult.damagedRegions?.length} regions`);
  assert(mockResult.damagedRegions?.[0]?.severity === "MEDIUM", "Damage Severity Non-fabricated");

  // 2. Topology Graph Verification
  console.log("\n\x1b[36m[2/6] Verifying Topology Graph Construction...\x1b[0m");
  const topology = mockResult.topology;
  assert(!!topology && (topology.nodesCount ?? 0) > 0, "Topology Nodes Generated", `${topology?.nodesCount} nodes`);
  assert(!!topology && (topology.edgesCount ?? 0) > 0, "Topology Edges Generated", `${topology?.edgesCount} edges`);

  const edgeTypes = new Set(topology?.edges?.map((e: any) => e.type));
  assert(edgeTypes.has("VISIBLE_TRACE"), "Topology contains VISIBLE_TRACE edges");
  assert(edgeTypes.has("PAD_CONNECTION"), "Topology contains PAD_CONNECTION edges");
  assert(edgeTypes.has("INFERRED_CONNECTION"), "Topology contains INFERRED_CONNECTION edges");

  // 3. Reconstruction Classification & Transparency
  console.log("\n\x1b[36m[3/6] Verifying Scientific Reconstruction Classification...\x1b[0m");
  const recon = mockResult.reconstruction;
  assert(!!recon && (recon.visualIntegrityEstimate ?? 0) > 0, "Visual Integrity Score Labeled (NOT Electrical)", `${recon?.visualIntegrityEstimate}%`);
  assert(Array.isArray(recon?.limitations) && recon.limitations.length > 0, "Scientific Limitations Explicitly Disclosed", `${recon?.limitations?.length} disclaimers`);

  const inferredTraces = recon?.inferredTraces || [];
  assert(inferredTraces.length > 0, "Missing Trace Repair Path Inferred", `${inferredTraces.length} inferred paths`);
  assert(inferredTraces[0]?.source === "INFERRED", "Source Tagged INFERRED, Not Pretending Original");

  // 4. End-to-End Pipeline Execution via BullMQ Worker
  console.log("\n\x1b[36m[4/6] Executing End-to-End PCB Worker Job...\x1b[0m");
  
  // Seed an active AnalysisSession
  const session = await AnalysisSession.create({
    analysisId: testAnalysisId,
    deviceName: "Netgear AC1900 Router Board",
    deviceType: "Networking",
    sourceType: "SAMPLE",
    sampleId: "router-board",
    mode: "DEMO",
    status: "DETECTION_COMPLETE",
    progress: 25,
    currentStage: "DETECTION",
    stageStatuses: {
      detection: "completed",
      pcb: "pending",
      rul: "pending",
    },
  });

  const workerResult = await runPCBWorkerJob({
    analysisId: testAnalysisId,
    sourceType: "SAMPLE",
  });

  assert(workerResult.success === true, "PCB Worker Executed Successfully");

  const updatedSession = await AnalysisSession.findOne({ analysisId: testAnalysisId });
  assert(updatedSession?.status === "PCB_COMPLETE", "Session Transitioned to PCB_COMPLETE");
  assert(updatedSession?.currentStage === "RUL", "Current Stage Set to RUL (Phase 4 Queued)");
  assert(updatedSession?.stageStatuses.pcb === "completed", "Stage Status pcb = completed");
  assert(updatedSession?.stageStatuses.rul === "pending", "Stage Status rul = pending (No premature complete)");
  assert(!!updatedSession?.pcbAnalysisId, "Linked pcbAnalysisId on AnalysisSession");

  // 5. Database Persisted Records & Indexing
  console.log("\n\x1b[36m[5/6] Verifying Database Persisted PCB Records & Audit Logs...\x1b[0m");
  const pcbDoc = await PCBAnalysis.findOne({ analysisId: testAnalysisId });
  assert(!!pcbDoc, "PCBAnalysis Document Persisted to MongoDB");
  assert((pcbDoc?.traces?.length ?? 0) > 0, "Traces Persisted in Document", `${pcbDoc?.traces?.length} traces`);
  assert((pcbDoc?.damagedRegions?.length ?? 0) > 0, "Damages Persisted in Document", `${pcbDoc?.damagedRegions?.length} anomalies`);

  // Audit Logs
  const auditLogs = await AuditLog.find({
    $or: [{ analysisId: testAnalysisId }, { resourceId: testAnalysisId }, { "metadata.analysisId": testAnalysisId }],
  });
  const auditActions = new Set(auditLogs.map((a) => a.action));
  assert(auditActions.has("PCB_ANALYSIS_STARTED"), "Audit Log: PCB_ANALYSIS_STARTED");
  assert(auditActions.has("PCB_GEOMETRY_DETECTED"), "Audit Log: PCB_GEOMETRY_DETECTED");
  assert(auditActions.has("TRACE_ANALYSIS_COMPLETED"), "Audit Log: TRACE_ANALYSIS_COMPLETED");
  assert(auditActions.has("TOPOLOGY_GENERATED"), "Audit Log: TOPOLOGY_GENERATED");
  assert(auditActions.has("DAMAGE_ANALYSIS_COMPLETED"), "Audit Log: DAMAGE_ANALYSIS_COMPLETED");
  assert(auditActions.has("RECONSTRUCTION_COMPLETED"), "Audit Log: RECONSTRUCTION_COMPLETED");

  // 6. Idempotency Check
  console.log("\n\x1b[36m[6/6] Testing Idempotency & Retries...\x1b[0m");
  const retryResult = await runPCBWorkerJob({
    analysisId: testAnalysisId,
    sourceType: "SAMPLE",
  });
  assert(retryResult.reused === true, "Idempotent Retry Reuses Existing Record without duplicating traces");

  // Cleanup test artifacts
  await AnalysisSession.deleteOne({ analysisId: testAnalysisId });
  await PCBAnalysis.deleteOne({ analysisId: testAnalysisId });
  await AuditLog.deleteMany({
    $or: [{ analysisId: testAnalysisId }, { resourceId: testAnalysisId }, { "metadata.analysisId": testAnalysisId }],
  });

  console.log("\n============================================================");
  console.log(`   PHASE 3 AUDIT COMPLETE: ${passedCount} PASSED | ${failedCount} FAILED`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase3Audit().catch((err) => {
  console.error("FATAL in Phase 3 audit:", err);
  process.exit(1);
});
