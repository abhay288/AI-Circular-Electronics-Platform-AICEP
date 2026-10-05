/**
 * EcoIntel Phase 4 Verification Suite
 * Tests Health Assessment, Remaining Useful Life (RUL) Prediction,
 * Provider Architecture, Uncertainty Intervals, Insufficient Data Handling,
 * Scenario Simulation, Idempotency, and Session Lifecycle.
 */

import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "../src/lib/db";
import { AnalysisSession } from "../src/models/AnalysisSession";
import { PCBAnalysis } from "../src/models/PCBAnalysis";
import { DetectionResult } from "../src/models/DetectionResult";
import { Component } from "../src/models/Component";
import { RULPrediction } from "../src/models/RULPrediction";
import { AuditLog } from "../src/models/AuditLog";
import {
  rulService,
  MockRULProvider,
  XGBoostRULProvider,
  RULInput,
} from "../src/providers/rul/rul.provider";
import { runRULWorkerJob } from "../src/queues/rul.worker";
import { AnalysisPipelineService } from "../src/services/pipeline.service";

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

async function runPhase4Audit() {
  console.log("\n============================================================");
  console.log("   ECOINTEL PHASE 4: HEALTH ASSESSMENT & RUL AUDIT");
  console.log("============================================================\n");

  await connectDB();

  const testAnalysisId = `ECI-TEST-P4-${Date.now()}`;

  // 1. Mock RUL Prediction
  console.log("\x1b[36m[1/7] Testing Mock RUL Provider & Physics Kinetics...\x1b[0m");
  const mockProvider = new MockRULProvider();
  const mockResult = await mockProvider.predict({
    analysisId: testAnalysisId,
    sampleId: "router-board",
    temperatureC: 48,
    voltageV: 5.0,
    operatingCycles: 1500,
    operatingHours: 18000,
    componentAgeYears: 2.5,
  });

  assert(mockResult.healthScore > 0 && mockResult.healthScore <= 100, "1. Mock Health Score Generated", `${mockResult.healthScore}/100`);
  assert(["HEALTHY", "GOOD", "FAIR", "DEGRADED", "CRITICAL"].includes(mockResult.healthStatus), "16. Health Status Taxonomy Valid", mockResult.healthStatus);
  assert(mockResult.rulYears > 0, "1. Mock RUL in Years Calculated", `${mockResult.rulYears} yrs`);
  assert(mockResult.rulHours > 0, "1. Mock RUL in Hours Calculated", `${mockResult.rulHours} hrs`);
  assert(mockResult.confidence > 0 && mockResult.confidence <= 1.0, "Model Confidence Calibrated", `${Math.round(mockResult.confidence * 100)}%`);

  // Uncertainty Interval Checks (lowerBound < mean < upperBound)
  const pi = mockResult.predictionInterval;
  assert(
    !!pi && pi.lowerBoundYears < mockResult.rulYears && mockResult.rulYears < pi.upperBoundYears,
    "Uncertainty Bounds Honest ([lower < mean < upper])",
    `[${pi?.lowerBoundYears} < ${mockResult.rulYears} < ${pi?.upperBoundYears}]`
  );

  // 2. XGBoost Provider Architecture & Error Handling
  console.log("\n\x1b[36m[2/7] Testing XGBoost Provider Architecture & Model Registry...\x1b[0m");
  const xgbProvider = new XGBoostRULProvider();
  assert(!!xgbProvider, "2. XGBoost Provider Initialized");

  const modelInfo = await rulService.getModelInfo();
  assert(!!modelInfo.provider, "18. Model Provider Metadata Available", modelInfo.provider);
  assert(!!modelInfo.version || !!modelInfo.modelVersion, "18. Model Version Tracked", modelInfo.version || modelInfo.modelVersion);

  // 3. Test Missing Model Handling (when service unreachable or invalid URL)
  console.log("\n\x1b[36m[3/7] Testing Model Failure & Error Transparency...\x1b[0m");
  let missingModelCaught = false;
  try {
    const brokenProvider = new XGBoostRULProvider("http://localhost:9999");
    await brokenProvider.predict({ analysisId: "FAIL-TEST" });
  } catch (err: any) {
    missingModelCaught = true;
    assert(true, "3. Missing Model Raises Explicit Error (No Silent Fallback)", err.message);
  }
  if (!missingModelCaught) {
    assert(false, "3. Missing Model Should Raise Error");
  }

  // 4. Missing Features & Insufficient Data Handling
  console.log("\n\x1b[36m[4/7] Testing Data Completeness & Insufficient Data Mode...\x1b[0m");
  const limitedInput: RULInput = {
    analysisId: `ECI-LIMITED-${Date.now()}`,
    // Operating hours, temperature, cycles NOT provided (optical image only)
    visualHealthScore: 82,
    pcbIntegrityScore: 80,
  };
  const limitedResult = await mockProvider.predict(limitedInput);
  assert((limitedResult.dataCompleteness ?? 100) < 60, "4. Missing Telemetry Lowers Data Completeness", `${limitedResult.dataCompleteness}%`);
  assert((limitedResult.limitations?.length ?? 0) > 0, "Scientific Limitations Explicitly Reported", `${limitedResult.limitations?.length} notices`);
  assert(
    limitedResult.status === "PARTIAL" || limitedResult.status === "INSUFFICIENT_DATA",
    "7. Insufficient Telemetry Flagged Accurately",
    limitedResult.status
  );

  // 5. Complete Data & Risk Classification
  console.log("\n\x1b[36m[5/7] Testing Full Feature Ingestion & Risk Classification...\x1b[0m");
  const completeInput: RULInput = {
    analysisId: `ECI-FULL-${Date.now()}`,
    sampleId: "router-board",
    visualHealthScore: 92,
    corrosionScore: 0,
    thermalDamageScore: 5,
    physicalDamageScore: 0,
    operatingHours: 12000,
    operatingCycles: 850,
    temperatureC: 38,
    voltageV: 3.3,
    loadPercentage: 45,
    componentAgeYears: 1.5,
    components: [
      { componentId: "U1", componentType: "Microcontroller", packageType: "LQFP-64" },
      { componentId: "C1", componentType: "Capacitor", packageType: "SMD-0805" },
    ],
  };
  const completeResult = await mockProvider.predict(completeInput);
  assert((completeResult.dataCompleteness ?? 0) >= 70, "8 & 9. Complete Data Sufficiency Meter", `${completeResult.dataCompleteness}%`);
  assert(["LOW", "MODERATE", "HIGH", "CRITICAL"].includes(completeResult.failureRisk || ""), "17. Risk Classification Valid", completeResult.failureRisk);
  assert((completeResult.components?.length ?? 0) > 0, "15. Component-Level RUL Estimated", `${completeResult.components?.length} components`);

  // 6. Interactive Scenario Simulation (What-If Analysis)
  console.log("\n\x1b[36m[6/7] Testing Scenario Simulation (Stress Modifiers)...\x1b[0m");
  const baselineResult = await mockProvider.predict({
    ...completeInput,
    temperatureC: 35,
  });
  const stressedScenario = await mockProvider.predict({
    ...completeInput,
    temperatureC: 75, // +40C severe thermal stress
    isScenarioSimulation: true,
  });
  assert(stressedScenario.provenance === "SIMULATED" && stressedScenario.isSynthetic === true, "13. Scenario Result Flagged as Simulation");
  assert(
    stressedScenario.rulHours < baselineResult.rulHours,
    "13. Arrhenius Thermal Acceleration Accelerates Degradation",
    `Baseline ${baselineResult.rulHours}h -> Stressed ${stressedScenario.rulHours}h`
  );

  // 7. AnalysisSession Lifecycle, DB Persistence & Idempotency
  console.log("\n\x1b[37m[7/7] Testing Pipeline Integration, Session Lifecycle & Idempotency...\x1b[0m");

  // Create mock Detection and PCB analysis for session
  const session = await AnalysisSession.create({
    analysisId: testAnalysisId,
    deviceName: "Test Enterprise Switchboard",
    deviceType: "PCB",
    sourceType: "SAMPLE",
    sampleId: "router-board",
    mode: "DEMO",
    status: "PCB_COMPLETE",
    currentStage: "PCB",
    progress: 45,
    stageStatuses: {
      detection: "completed",
      pcb: "completed",
      rul: "pending",
      materials: "pending",
      repair: "pending",
      passport: "pending",
      carbon: "pending",
      report: "pending",
    },
  });

  await Component.create({
    analysisId: testAnalysisId,
    type: "IC",
    name: "STM32F407 Microcontroller",
    manufacturer: "STMicroelectronics",
    partNumber: "STM32F407VGT6",
    package: "LQFP100",
    confidence: 0.96,
    boundingBox: { x: 10, y: 10, width: 25, height: 25 },
    condition: "GOOD",
    healthScore: 85,
    estimatedRUL: { hours: 30000, years: 3.4 },
    marketplaceEligible: true,
  });

  await PCBAnalysis.create({
    analysisId: testAnalysisId,
    provider: "MOCK",
    modelName: "pcb-geom-v1",
    modelVersion: "1.0.0",
    status: "COMPLETED",
    board: {
      widthPixels: 1920,
      heightPixels: 1080,
      aspectRatio: 1.77,
      physicalDimensionsAvailable: true,
      confidence: 0.95,
    },
    metrics: {
      componentsDetected: 1,
      visibleTraces: 12,
      padsDetected: 40,
      viasDetected: 16,
      potentialConnections: 8,
      damageRegionsCount: 0,
      visualIntegrityScore: 92,
      topologyConfidence: 88,
    },
  });

  // Execute RUL Worker Job
  const workerResult = await runRULWorkerJob({ analysisId: testAnalysisId });
  assert(workerResult.success === true, "RUL Worker Executed Job Successfully");

  // Verify DB Persistence
  const savedRul = await RULPrediction.findOne({ analysisId: testAnalysisId });
  assert(!!savedRul, "10. RULPrediction Persisted to MongoDB", `_id: ${savedRul?._id}`);
  assert(savedRul?.healthScore === (workerResult as any).healthScore, "Health Score Matches DB", `${savedRul?.healthScore}%`);

  // Verify Session Stage Progression to RUL_COMPLETE
  const updatedSession = await AnalysisSession.findOne({ analysisId: testAnalysisId });
  assert(updatedSession?.status === "RUL_COMPLETE", "21. Session Transitioned to RUL_COMPLETE", updatedSession?.status);
  assert(updatedSession?.stageStatuses?.rul === "completed", "RUL Stage Marked Completed");
  assert(updatedSession?.currentStage === "MATERIALS", "Next Circular Stage is MATERIALS (Not Executed)");

  // 11. Idempotency Test: Running the worker again should reuse existing without recalculation
  const rerunResult = await runRULWorkerJob({ analysisId: testAnalysisId });
  assert(rerunResult.reused === true, "11. Duplicate Job Handled Idempotently (No duplicate work)");

  // Verify Audit Log
  const auditLogs = await AuditLog.find({ analysisId: testAnalysisId });
  assert(auditLogs.length >= 2, "33. Audit Logs Emitted (Started + Completed)", `${auditLogs.length} events`);

  // Clean up test session
  await Promise.all([
    AnalysisSession.deleteOne({ analysisId: testAnalysisId }),
    Component.deleteMany({ analysisId: testAnalysisId }),
    PCBAnalysis.deleteOne({ analysisId: testAnalysisId }),
    RULPrediction.deleteOne({ analysisId: testAnalysisId }),
    AuditLog.deleteMany({ analysisId: testAnalysisId }),
  ]);

  console.log("\n============================================================");
  console.log(`   PHASE 4 AUDIT SUMMARY: ${passedCount} PASSED / ${failedCount} FAILED`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runPhase4Audit().catch((err) => {
  console.error("FATAL ERROR IN PHASE 4 AUDIT:", err);
  process.exit(1);
});
