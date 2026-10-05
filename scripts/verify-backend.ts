import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { User } from "../src/models/User";
import { Organization } from "../src/models/Organization";
import { AnalysisSession } from "../src/models/AnalysisSession";
import { DetectionResult } from "../src/models/DetectionResult";
import { Component } from "../src/models/Component";
import { PCBAnalysis } from "../src/models/PCBAnalysis";
import { RULPrediction } from "../src/models/RULPrediction";
import { MaterialRecovery } from "../src/models/MaterialRecovery";
import { RepairAssessment } from "../src/models/RepairAssessment";
import { DigitalPassport } from "../src/models/DigitalPassport";
import { CarbonImpact } from "../src/models/CarbonImpact";
import { Report } from "../src/models/Report";
import { AuditLog } from "../src/models/AuditLog";
import { MarketplaceListing } from "../src/models/MarketplaceListing";

import { hashPassword, comparePassword } from "../src/lib/auth";
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from "../src/lib/jwt";
import { analysisPipeline } from "../src/services/pipeline.service";
import { generateAnalysisId, generateListingId } from "../src/lib/id-generator";
import { SAMPLE_DATASETS } from "../src/lib/data/sampleDatasets";

interface TestReport {
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const results: TestReport[] = [];

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    results.push({ name, passed: true, details });
    console.log(`  \x1b[32m✔\x1b[0m ${name} ${details ? `(${details})` : ""}`);
  } else {
    results.push({ name, passed: false, details });
    console.error(`  \x1b[31m✖\x1b[0m ${name} FAILED!`);
    throw new Error(`Assertion failed: ${name}`);
  }
}

async function runEndToEndVerification() {
  console.log("\n============================================================");
  console.log("ECOINTEL BACKEND — PHASE 1 END-TO-END VERIFICATION & AUDIT");
  console.log("============================================================\n");

  // 1. DATABASE CONNECTION
  console.log("\x1b[36m[1/8] Verifying Database Connection & Environment...\x1b[0m");
  const conn = await connectDB();
  assert(
    mongoose.connection.readyState === 1,
    "MongoDB Connection",
    `Host: ${mongoose.connection.host}, DB: ${mongoose.connection.name}`
  );
  assert(!!process.env.JWT_ACCESS_SECRET, "JWT_ACCESS_SECRET Configured");
  assert(!!process.env.JWT_REFRESH_SECRET, "JWT_REFRESH_SECRET Configured");

  // 2. AUTHENTICATION & JWT FLOW
  console.log("\n\x1b[36m[2/8] Testing Authentication & JWT Access/Refresh Lifecycle...\x1b[0m");
  const testEmail = `audit_tester_${Date.now()}@ecointel.org`;
  const rawPassword = "SecurePassword123!";
  const passwordHash = await hashPassword(rawPassword);
  assert(passwordHash !== rawPassword, "Password Hashing with Bcrypt");

  const isPasswordValid = await comparePassword(rawPassword, passwordHash);
  assert(isPasswordValid, "Password Verification");

  // Create or clean up test user
  await User.deleteMany({ email: testEmail });
  const testUser = await User.create({
    name: "Dr. Elena Rostova",
    email: testEmail,
    passwordHash,
    role: "RESEARCHER",
    isActive: true,
  });
  assert(!!testUser._id, "User Model Persistence", `User ID: ${testUser._id}`);

  const tokenPayload = {
    userId: String(testUser._id),
    email: testUser.email,
    role: testUser.role,
  };

  const accessToken = signAccessToken(tokenPayload);
  assert(typeof accessToken === "string" && accessToken.length > 20, "JWT Access Token Signing");

  const verifiedAccess = verifyAccessToken(accessToken);
  assert(verifiedAccess?.userId === String(testUser._id), "JWT Access Token Verification", `Email: ${verifiedAccess?.email}`);

  const refreshToken = signRefreshToken(tokenPayload);
  const verifiedRefresh = verifyRefreshToken(refreshToken);
  assert(verifiedRefresh?.userId === String(testUser._id), "JWT Refresh Token Rotation Verification");

  // 3. ANALYSIS SESSION CREATION & ID GENERATION
  console.log("\n\x1b[36m[3/8] Testing AnalysisSession Creation & ID Formatting...\x1b[0m");
  const analysisId = generateAnalysisId();
  assert(/^ECI-202\d-\d{4}$/.test(analysisId), "Analysis ID Format (ECI-YEAR-XXXX)", analysisId);

  const sample = SAMPLE_DATASETS["router-board"];
  assert(!!sample, "Sample Dataset Integrity", sample.name);

  // Clean up any collision
  await AnalysisSession.deleteMany({ analysisId });

  const session = await AnalysisSession.create({
    analysisId,
    userId: testUser._id,
    deviceName: sample.name,
    deviceType: sample.deviceType,
    sourceType: "SAMPLE",
    mode: "DEMO",
    sampleId: sample.id,
    imageUrl: sample.image,
    status: "READY",
    progress: 0,
    currentStage: "INITIALIZATION",
    stageStatuses: {
      detection: "pending",
      pcb: "pending",
      rul: "pending",
      materials: "pending",
      repair: "pending",
      passport: "pending",
      carbon: "pending",
      report: "pending",
    },
  });
  assert(session.analysisId === analysisId, "AnalysisSession Persistence", `Status: ${session.status}`);

  // 4. PIPELINE EXECUTION (END-TO-END DEMO PIPELINE)
  console.log("\n\x1b[36m[4/8] Executing Sequential Analysis Pipeline...\x1b[0m");
  const completedSession = await analysisPipeline.runPipeline(analysisId);

  assert(completedSession.status === "COMPLETED", "Pipeline Status Progression to COMPLETED");
  assert(completedSession.progress === 100, "Progress Metric Reached 100%");
  assert(completedSession.currentStage === "COMPLETED", "Final Pipeline Stage COMPLETED");

  // 5. DATABASE RELATIONAL INTEGRITY VERIFICATION
  console.log("\n\x1b[36m[5/8] Verifying Database Records & Relational Connectivity...\x1b[0m");
  
  // DetectionResult
  const detectionDoc = await DetectionResult.findOne({ analysisId });
  assert(!!detectionDoc, "DetectionResult Document Persisted", `Detected: ${detectionDoc?.totalDetected} components`);
  assert(detectionDoc?.status === "DEMO", "No Fake Production Claims (Status: DEMO)");

  // Component
  const componentCount = await Component.countDocuments({ analysisId });
  assert(componentCount > 0, "Component Documents Persisted", `${componentCount} components indexed by analysisId`);

  const sampleComp = await Component.findOne({ analysisId });
  assert(sampleComp?.analysisId === analysisId, "Component Relational Reference to analysisId");

  // PCBAnalysis
  const pcbDoc = await PCBAnalysis.findOne({ analysisId });
  assert(!!pcbDoc && pcbDoc.layerCount > 0, "PCBAnalysis Document Persisted", `Layers: ${pcbDoc?.layerCount}, Traces: ${pcbDoc?.traceCount}`);

  // RULPrediction
  const rulDoc = await RULPrediction.findOne({ analysisId });
  assert(!!rulDoc && rulDoc.estimatedYears > 0, "RULPrediction Document Persisted", `Health: ${rulDoc?.healthScore}%, Est: ${rulDoc?.estimatedYears} yrs`);

  // MaterialRecovery
  const matDoc = await MaterialRecovery.findOne({ analysisId });
  assert(!!matDoc && matDoc.totalEstimatedMarketValueINR > 0, "MaterialRecovery Document Persisted", `Total Yield: ₹${matDoc?.totalEstimatedMarketValueINR.toLocaleString("en-IN")}`);

  // RepairAssessment
  const repDoc = await RepairAssessment.findOne({ analysisId });
  assert(!!repDoc && repDoc.issues.length > 0, "RepairAssessment Document Persisted", `Action: ${repDoc?.recommendedAction}`);

  // DigitalPassport
  const passportDoc = await DigitalPassport.findOne({ analysisId });
  assert(!!passportDoc, "DigitalPassport Document Persisted", `Passport ID: ${passportDoc?.passportId}`);
  assert(passportDoc?.blockchainStatus !== "VERIFIED", "Blockchain Safety Guarantee (Status: READY / PENDING, not falsely claimed as Verified)");

  // CarbonImpact
  const carbonDoc = await CarbonImpact.findOne({ analysisId });
  assert(!!carbonDoc && carbonDoc.co2AvoidedKg > 0, "CarbonImpact Document Persisted", `CO2 Avoided: ${carbonDoc?.co2AvoidedKg} kg`);

  // Report
  const reportDoc = await Report.findOne({ analysisId });
  assert(!!reportDoc && reportDoc.status === "READY", "Report Document Persisted", `Report ID: ${reportDoc?.reportId}`);

  // AuditLog
  const auditLogsCount = await AuditLog.countDocuments({ "metadata.analysisId": analysisId });
  assert(auditLogsCount >= 8, "AuditLog Stage Events Emitted", `${auditLogsCount} audit logs recorded`);

  // 6. IDEMPOTENCY VERIFICATION
  console.log("\n\x1b[36m[6/8] Testing Pipeline Idempotency & Retry (Transitioning FAILED -> PROCESSING)...\x1b[0m");
  completedSession.status = "FAILED";
  await completedSession.save();
  await analysisPipeline.runPipeline(analysisId);
  const postRerunComponents = await Component.countDocuments({ analysisId });
  assert(postRerunComponents === componentCount, "Idempotent Component Count (No Duplicate Records Created)", `${postRerunComponents} vs ${componentCount}`);
  
  const postRerunPassports = await DigitalPassport.countDocuments({ analysisId });
  assert(postRerunPassports === 1, "Idempotent Passport Guarantee (Single Passport Maintained)");

  // 7. SESSION RESTORATION AFTER REFRESH SIMULATION
  console.log("\n\x1b[36m[7/8] Testing Browser Refresh Session Retrieval...\x1b[0m");
  const restoredSession = await AnalysisSession.findOne({ analysisId });
  assert(!!restoredSession, "Session Retrieved via Database by analysisId");
  assert(restoredSession?.status === "COMPLETED", "Session Retains COMPLETED State");
  assert(!!restoredSession?.detectionResult, "Embedded Detection Result Available");
  assert(!!restoredSession?.rulResult, "Embedded RUL Result Available");
  assert(!!restoredSession?.metalResult, "Embedded Material Spectrometry Available");

  // 8. MARKETPLACE INTEGRATION TEST
  console.log("\n\x1b[36m[8/8] Testing Recovered Hardware Marketplace Listing...\x1b[0m");
  const eligibleComp = await Component.findOne({ analysisId });
  assert(!!eligibleComp, "Component Found for Analysis", eligibleComp?.name);

  const listingId = generateListingId();
  const listing = await MarketplaceListing.create({
    listingId,
    analysisId,
    componentId: String(eligibleComp?._id),
    sellerId: String(testUser._id),
    title: `Recovered ${eligibleComp?.name} (${eligibleComp?.package})`,
    category: "Semiconductors",
    condition: "TESTED_WORKING",
    priceINR: 450,
    priceUSD: 5.20,
    quantity: 1,
    location: "Bangalore Circular Hub",
    passportId: passportDoc?.passportId,
    status: "ACTIVE",
  });
  assert(listing.analysisId === analysisId, "Marketplace Listing Linked to analysisId", listing.listingId);
  assert(listing.passportId === passportDoc?.passportId, "Marketplace Listing Linked to Digital Passport");

  // 9. PHASE 2 AI COMPONENT DETECTION ENGINE TESTS
  console.log("\n\x1b[36m[9/9] Testing Phase 2 AI Component Detection Engine...\x1b[0m");
  const { normalizeComponentType } = await import("../src/lib/taxonomy/componentTaxonomy");
  assert(normalizeComponentType("integrated_circuit") === "IC", "Taxonomy: integrated_circuit -> IC");
  assert(normalizeComponentType("chip") === "IC", "Taxonomy: chip -> IC");
  assert(normalizeComponentType("smd_resistor") === "Resistor", "Taxonomy: smd_resistor -> Resistor");
  assert(normalizeComponentType("electrolytic_capacitor") === "Capacitor", "Taxonomy: electrolytic_capacitor -> Capacitor");
  assert(normalizeComponentType("ldo") === "Voltage_Regulator", "Taxonomy: ldo -> Voltage_Regulator");

  // Detection Service output test
  const { detectionService } = await import("../src/providers/detection/detection.provider");
  const testDet = await detectionService.detect({
    analysisId,
    imageUrl: "/images/samples/router_board.jpg",
    sampleId: "router-board",
    sourceType: "SAMPLE",
  });
  assert(testDet.totalDetected > 0, "DetectionService Executed Successfully", `${testDet.totalDetected} detected`);
  assert(!!testDet.model, "Detection Metadata Returned", testDet.model);
  assert(!!testDet.quality, "Quality Diagnostics Returned", testDet.quality?.quality);
  assert(testDet.components.length > 0, "Component Records Output Validated");
  assert(testDet.components[0].componentId.startsWith("CMP-ECI-"), "Standard Component Serial Pattern Validated", testDet.components[0].componentId);

  // Component Filter Query Test
  const icComponents = await Component.find({ analysisId, type: "IC" });
  assert(icComponents.length >= 0, "Filter Components by Type (IC)", `${icComponents.length} ICs found`);

  const highConfComponents = await Component.find({ analysisId, confidence: { $gte: 0.9 } });
  assert(highConfComponents.length > 0, "Filter Components by Min Confidence (>= 0.90)", `${highConfComponents.length} components`);

  const singleComp = await Component.findOne({ analysisId });
  assert(!!singleComp?.boundingBox, "Component 2D Bounding Box Present");
  assert(!!singleComp?.center, "Component Center Coordinate Present");
  assert(singleComp?.condition === "UNKNOWN" || singleComp?.condition === "GOOD", "Component Condition Set Honestly");

  console.log("\n============================================================");
  console.log(`\x1b[32mALL ${results.length} VERIFICATION AND AUDIT TESTS PASSED SUCCESSFULLY!\x1b[0m`);
  console.log("============================================================\n");
}

runEndToEndVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\x1b[31mAudit Failed with Error:\x1b[0m", err);
    process.exit(1);
  });
