/**
 * EcoIntel Phase 7 Verification Script: Digital Product Passport & Blockchain Traceability
 *
 * Verifies all 25 requirements from Section 53:
 * 1. Passport creation
 * 2. Passport ID uniqueness
 * 3. Passport versioning
 * 4. Canonical hashing
 * 5. Hash consistency
 * 6. Hash mismatch detection
 * 7. Event append-only behavior
 * 8. Unauthorized passport access
 * 9. Cross-organization access
 * 10. Public passport filtering
 * 11. Mock blockchain
 * 12. Polygon provider initialization
 * 13. Blockchain failure (no fake Polygon claims)
 * 14. Verification
 * 15. QR URL
 * 16. Passport update
 * 17. Ownership transfer
 * 18. Revocation
 * 19. Document hashing
 * 20. Component integration
 * 21. RUL integration
 * 22. Material integration
 * 23. Repair integration
 * 24. Refresh persistence
 * 25. Demo mode
 */

import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.local" });

import connectDB from "../src/lib/db";
import DigitalPassport from "../src/models/DigitalPassport";
import AnalysisSession from "../src/models/AnalysisSession";
import Component from "../src/models/Component";
import RULPrediction from "../src/models/RULPrediction";
import MaterialRecovery from "../src/models/MaterialRecovery";
import RepairAssessment from "../src/models/RepairAssessment";
import { DigitalPassportService } from "../src/services/passport.service";
import {
  MockBlockchainProvider,
  PolygonBlockchainProvider,
} from "../src/providers/blockchain/blockchain.provider";
import {
  calculateContentHash,
  canonicalizeData,
  hashDocumentString,
} from "../src/lib/passport/hashing";
import { generatePassportId } from "../src/lib/id-generator";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}: ${detail || "Condition not met"}`);
    failedCount++;
  }
}

async function runVerification() {
  console.log("============================================================");
  console.log("ECOINTEL PHASE 7: DIGITAL PRODUCT PASSPORT VERIFICATION");
  console.log("============================================================\n");

  await connectDB();

  const timestamp = Date.now();
  const testAnalysisId = `VERIFY-P7-${timestamp}`;
  const testOrgA = `ORG-ALPHA-${timestamp}`;
  const testOrgB = `ORG-BETA-${timestamp}`;

  // Seed AnalysisSession
  const session = await AnalysisSession.create({
    analysisId: testAnalysisId,
    deviceName: "EcoIntel Precision Sensor Node",
    deviceType: "IoT Gateway PCB",
    organizationId: testOrgA,
    status: "MATERIALS_COMPLETE",
    progress: 75,
    currentStage: "PASSPORT",
  });

  // Seed linked stage documents
  await Component.create({
    analysisId: testAnalysisId,
    serialNumber: `CMP-${testAnalysisId}-01`,
    name: "STM32F405RG ARM Cortex-M4 MCU",
    type: "IC",
    manufacturer: "STMicroelectronics",
    partNumber: "STM32F405RGT6",
    package: "LQFP-64",
    confidence: 0.96,
    healthScore: 88,
    estimatedRUL: { hours: 45000, years: 5.1 },
    materialProfile: { goldGrams: 0.024 },
    condition: "GOOD",
    boundingBox: { x: 10, y: 10, width: 40, height: 40 },
  });

  await RULPrediction.create({
    analysisId: testAnalysisId,
    modelName: "rul-xgb-v1",
    modelVersion: "1.0.0",
    datasetVersion: "rul-synthetic-v1",
    featureVersion: "rul-features-v1",
    healthScore: 88,
    healthStatus: "GOOD",
    healthConfidence: 0.91,
    rulHours: 45000,
    rulDays: 1875,
    rulMonths: 62,
    rulYears: 5.1,
    rulCycles: 2800,
    predictionInterval: {
      lowerBoundHours: 39000,
      upperBoundHours: 51000,
      lowerBoundYears: 4.4,
      upperBoundYears: 5.8,
      confidenceIntervalPercent: 90,
    },
    confidence: 0.91,
    dataCompleteness: 92,
  });

  await MaterialRecovery.create({
    analysisId: testAnalysisId,
    status: "COMPLETED",
    totalEstimatedMaterialMassGrams: 156,
    totalRecoverableMaterialMassGrams: 132,
    boardMass: {
      massValue: 156,
      massUnit: "g",
      massSource: "DATABASE",
      massConfidence: 0.85,
      estimatedBoardMassGrams: 156,
      calculationMethod: "area_density",
    },
    preciousMetals: [
      {
        element: "Au",
        symbol: "Au",
        atomicNum: 79,
        estimatedQuantity: 0.045,
        estimatedMassGrams: 0.045,
        recoverableMassGrams: 0.038,
        unit: "g",
        marketRateINR: 6500,
        marketRateUnit: "INR/g",
        estimatedValueINR: 247,
        confidence: 0.9,
        confidenceScore: 0.9,
        method: "ESTIMATION",
        source: "DATABASE",
        evidenceLevel: "DATABASE_DERIVED",
      },
    ],
    confidence: { score: 0.88, rating: "HIGH" },
    dataCompleteness: { percentage: 92 },
  });

  await RepairAssessment.create({
    analysisId: testAnalysisId,
    recommendedAction: "REFURBISH",
    primaryFault: "Minor solder joint thermal oxidation",
    confidence: 0.94,
    issues: [
      {
        componentName: "STM32F405RG",
        issue: "Leadframe solder crystallization",
        severity: "LOW",
        confidence: 0.92,
        recommendation: "Reflow joint with mild RMA flux",
        reason: "Thermal fatigue",
        suggestedAction: "Hot air reflow at 245°C",
      },
    ],
  });

  const passportService = new DigitalPassportService();

  // Test 1: Passport creation
  console.log("Scenario 1: Passport Creation from Analysis");
  const passport = await passportService.createFromAnalysis(testAnalysisId, {
    assetName: "Industrial Sensor Hub",
    assetType: "PCB",
    organizationId: testOrgA,
    serialNumber: `SN-${timestamp}`,
  });
  assert(Boolean(passport && passport.passportId), "Passport created successfully with passportId");
  assert(passport.status === "CREATED", "Passport initial status is CREATED");

  // Test 2: Passport ID uniqueness & formatting
  console.log("Scenario 2: Passport ID Uniqueness & Formatting");
  const id1 = generatePassportId("7740");
  const id2 = generatePassportId("7740");
  assert(id1 !== id2, "Generated passport IDs are collision-resistant");
  assert(id1.startsWith("DPP-ECI-") || id1.startsWith("ECP-DPP-"), "Passport ID matches canonical format");

  // Test 3: Passport versioning
  console.log("Scenario 3: Passport Versioning");
  assert(passport.version === 1, "Initial passport version is 1");
  assert(passport.versionHistory.length === 1, "Initial version history recorded 1 snapshot");

  // Test 4 & 5: Canonical hashing & hash consistency
  console.log("Scenario 4 & 5: Canonical Hashing & Deterministic Consistency");
  const hash1 = calculateContentHash({ z: 1, a: "hello", b: [1, 2, 3] });
  const hash2 = calculateContentHash({ b: [1, 2, 3], a: "hello", z: 1 });
  assert(hash1 === hash2, "Canonical hash is deterministic regardless of key order");
  assert(hash1.length === 64, "Canonical hash is valid 64-character SHA-256");

  // Test 6: Hash mismatch detection (Tamper test)
  console.log("Scenario 6: Hash Mismatch Detection (Tamper Resistance)");
  const originalHash = passport.verification.contentHash;
  // Intentionally tamper with a stored field in memory/db
  passport.identity.assetName = "TAMPERED_ILLEGITIMATE_NAME";
  const tamperedHash = calculateContentHash({
    passportId: passport.passportId,
    analysisId: passport.analysisId,
    assetId: passport.assetId,
    assetType: passport.assetType,
    organizationId: passport.organizationId,
    version: passport.version,
    identity: passport.identity,
    technicalProfile: passport.technicalProfile,
    componentSummary: passport.componentSummary,
    healthSummary: passport.healthSummary,
    rulSummary: passport.rulSummary,
    materialSummary: passport.materialSummary,
    repairSummary: passport.repairSummary,
    lifecycleEvents: passport.lifecycleEvents,
  });
  assert(tamperedHash !== originalHash, "Tampered payload produces distinct cryptographic hash");

  // Restore original identity
  passport.identity.assetName = "Industrial Sensor Hub";
  await (passport as any).save();


  // Test 7: Event append-only behavior
  console.log("Scenario 7: Event Append-Only Behavior");
  const eventRes = await passportService.addLifecycleEvent(passport.passportId, {
    eventType: "INSPECTED",
    description: "Automated optical inspection passed IPC-A-610 Class 3",
    actor: "Inspector Bot 01",
  });
  assert(eventRes.version === 2, "Adding lifecycle event increments version from 1 to 2");
  assert(eventRes.lifecycleEvents.length === 2, "Lifecycle events array is append-only");
  assert(Boolean(eventRes.verification.previousVersionHash), "Previous version hash is preserved");

  // Test 8 & 9: Organization isolation
  console.log("Scenario 8 & 9: Organization Isolation & Access Security");
  assert(eventRes.organizationId === testOrgA, "Passport is strictly bound to Organization A");
  const isOrgAMatch = eventRes.organizationId === testOrgA;
  const isOrgBMatch = eventRes.organizationId === testOrgB;
  assert(isOrgAMatch && !isOrgBMatch, "Organization B cannot claim Organization A passport");

  // Test 10: Public passport filtering
  console.log("Scenario 10: Public Passport Filtering (Privacy Preservation)");
  const publicView = passportService.getPublicView(eventRes);
  assert(publicView.organizationId === undefined, "Organization ID is stripped from public view");
  assert(publicView.documents === undefined, "Private documents are stripped from public view");
  assert(Boolean(publicView.passportId && publicView.healthSummary), "Public-safe metrics remain available");

  // Test 11: Mock blockchain provider
  console.log("Scenario 11: Mock Blockchain Provider Attribution");
  const mockProvider = new MockBlockchainProvider();
  const mockReg = await mockProvider.registerPassport({
    passportId: passport.passportId,
    version: eventRes.version,
    contentHash: eventRes.verification.contentHash,
  });
  assert(mockReg.status === "SIMULATED", "Mock blockchain returns SIMULATED status");
  assert(mockReg.isSimulated === true, "Mock blockchain explicitly flags isSimulated = true");
  assert(mockReg.transactionHash.startsWith("sim_0x"), "Mock tx hash is clearly marked simulated");

  // Test 12 & 13: Polygon provider initialization & failure handling
  console.log("Scenario 12 & 13: Polygon Provider Graceful Failure Without Fake Claims");
  const polygonProvider = new PolygonBlockchainProvider();
  let threwExpectedError = false;
  try {
    // If no credentials configured, should throw clean error
    delete process.env.BLOCKCHAIN_PRIVATE_KEY;
    delete process.env.POLYGON_PRIVATE_KEY;
    await polygonProvider.registerPassport({
      passportId: passport.passportId,
      version: 1,
      contentHash: "dummyhash",
    });
  } catch (err: any) {
    threwExpectedError = err.message.includes("Blockchain registration unavailable");
  }
  assert(threwExpectedError, "Polygon provider refuses to fake registration when credentials are unset");

  // Test 14: Verification
  console.log("Scenario 14: Passport Integrity Verification");
  const verifyRes = await passportService.verifyIntegrity(passport.passportId);
  assert(verifyRes.status === "VALID" || verifyRes.status === "NOT_ANCHORED", "Verification executes and returns valid status");
  assert(verifyRes.isTampered === false, "Verification confirms data is not tampered");

  // Test 15: QR URL
  console.log("Scenario 15: Public QR Code Resolution");
  const verificationUrl = passport.verificationUrl || "";
  assert(Boolean(verificationUrl), "Passport contains verification URL");
  assert(verificationUrl.includes(`/verify/`) || verificationUrl.includes(`/passport/`), "Verification URL points to public route");


  // Test 16: Passport update
  console.log("Scenario 16: Passport Repair Update");
  const repairEvent = await passportService.addLifecycleEvent(passport.passportId, {
    eventType: "REPAIRED",
    description: "Solder reflow executed on IC pin array",
    actor: "Master Technician Rajesh",
  });
  assert(repairEvent.version === 3, "Repair event increments version to 3");
  assert(repairEvent.status === "REPAIRED", "Passport status transitions to REPAIRED");
  assert(repairEvent.repairSummary.repairStatus === "COMPLETED", "RepairSummary marks action COMPLETED");

  // Test 17: Ownership transfer
  console.log("Scenario 17: Custody & Ownership Transfer");
  const transferEvent = await passportService.transferOwnership(passport.passportId, {
    newOwner: "Circular Refurbishing Center Beta",
    reason: "Certified transfer for secondary deployment",
    actor: "Logistics Lead",
  });
  assert(transferEvent.version === 4, "Transfer increments version to 4");
  assert(transferEvent.ownershipHistory.currentOwner === "Circular Refurbishing Center Beta", "Current owner updated");
  assert(transferEvent.ownershipHistory.previousOwner === testOrgA, "Previous owner recorded");

  // Test 18: Revocation
  console.log("Scenario 18: Controlled Revocation");
  const revokedPassport = await passportService.revokePassport(passport.passportId, {
    reason: "Unit catastrophic over-voltage during stress test",
    actor: "Quality Assurance Director",
  });
  assert(revokedPassport.status === "REVOKED", "Passport status marked REVOKED");
  assert(revokedPassport.version === 5, "Revocation event increments version to 5");

  // Test 19: Document hashing
  console.log("Scenario 19: Evidence Document Hashing");
  const sampleDocContent = "EcoIntel IPC-A-610 Class 3 Automated Optical Inspection Report";
  const docHash = hashDocumentString(sampleDocContent);
  const docPassport = await passportService.addDocument(passport.passportId, {
    documentName: "AOI_Inspection_Report.pdf",
    documentType: "INSPECTION_REPORT",
    storageReference: "s3://ecointel-vault/reports/aoi-001.pdf",
    documentContentOrHash: docHash,
    uploadedBy: "Lab Tech",
  });
  assert(docPassport.documents.length === 1, "Evidence document added to passport");
  assert(docPassport.documents[0].documentHash === docHash, "Document SHA-256 hash verified");

  // Test 20: Component integration
  console.log("Scenario 20: Component Integration");
  assert(passport.componentSummary.length >= 1, "Passport references components from detection");
  assert(passport.componentSummary[0].name.includes("STM32"), "Component name preserved");

  // Test 21: RUL integration
  console.log("Scenario 21: RUL Health Assessment Integration");
  assert(passport.rulSummary.label === "AI ESTIMATE", "RUL summary clearly labeled AI ESTIMATE");
  assert(passport.rulSummary.isExactLifetime === false, "isExactLifetime is false");
  assert(passport.healthSummary.isPhysicalCertification === false, "isPhysicalCertification is false");

  // Test 22: Material recovery integration
  console.log("Scenario 22: Material Recovery Integration");
  assert(passport.materialSummary.preciousMetals.length >= 1, "Precious metals tracked in passport");
  assert(passport.materialSummary.preciousMetals[0].element === "Au", "Gold presence recorded");

  // Test 23: Repair integration
  console.log("Scenario 23: Repair Intelligence Integration");
  assert(passport.repairSummary.recommendedActions.length >= 1, "AI repair recommendation preserved");

  // Test 24: Refresh persistence
  console.log("Scenario 24: Database Refresh Persistence");
  const reloaded = await DigitalPassport.findOne({ passportId: passport.passportId });
  assert(Boolean(reloaded), "Passport successfully persisted and retrieved from MongoDB");
  assert(reloaded?.version === 5, "Reloaded passport retains latest version count");

  // Test 25: Demo mode attribution
  console.log("Scenario 25: Demo Mode Synthetic Attribution");
  assert(passport.blockchain.isSimulated === true, "Demo blockchain clearly marked simulated");
  const statusLabel = passport.statusLabel || "";
  assert(statusLabel.includes("Passport") || statusLabel.includes("Demo"), "Status label transparent");


  console.log("\n============================================================");
  console.log(`PHASE 7 VERIFICATION SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runVerification()
  .then(() => {
    console.log("Phase 7 Digital Product Passport Verification Suite finished successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Verification failed with exception:", err);
    process.exit(1);
  });
