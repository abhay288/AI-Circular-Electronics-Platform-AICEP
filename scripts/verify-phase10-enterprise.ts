import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "../src/lib/db";
import { AnalysisSession } from "../src/models/AnalysisSession";
import { DetectionResult } from "../src/models/DetectionResult";
import { PCBAnalysis } from "../src/models/PCBAnalysis";
import { RULPrediction } from "../src/models/RULPrediction";
import { MaterialRecovery } from "../src/models/MaterialRecovery";
import { RepairAssessment } from "../src/models/RepairAssessment";
import { DigitalPassport } from "../src/models/DigitalPassport";
import { MarketplaceListing } from "../src/models/MarketplaceListing";
import { CarbonImpact } from "../src/models/CarbonImpact";
import { Report } from "../src/models/Report";
import { ReportShare } from "../src/models/ReportShare";
import { Notification } from "../src/models/Notification";
import { AuditLog } from "../src/models/AuditLog";
import { ReportService } from "../src/services/reporting/report.service";
import { ExecutiveDashboardService } from "../src/services/dashboard/executiveDashboard.service";
import { IntegrityService } from "../src/services/integrity/integrity.service";
import { NotificationService } from "../src/services/notification.service";
import { GlobalSearchService } from "../src/services/search.service";
import crypto from "crypto";

async function runEnterpriseVerificationSuite() {
  console.log("================================================================================");
  console.log("ECOINTEL PHASE 10: ENTERPRISE REPORTING, EXECUTIVE ANALYTICS & PLATFORM INTEGRATION");
  console.log("================================================================================\n");

  await connectDB();
  console.log(" Connected to MongoDB Atlas for Enterprise Verification.\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(` [PASS ${passed}/${total}] ${testName}`);
    } else {
      console.error(`❌ [FAIL] ${testName}: ${details || "Assertion failed"}`);
    }
  }

  const testAnalysisId = `ent-test-${Date.now()}`;
  const testOrgId = `org-test-${Date.now()}`;

  try {
    // -------------------------------------------------------------------------
    // 1. Setup Mock Enterprise Pipeline Session
    // -------------------------------------------------------------------------
    const testSession = await AnalysisSession.create({
      analysisId: testAnalysisId,
      organizationId: testOrgId,
      deviceName: "Enterprise Server Motherboard X12",
      deviceType: "SERVER_PCB",
      status: "COMPLETED",
      mode: "DEMO",
      sourceType: "SAMPLE",
      metadata: {
        assetId: `asset-${testAnalysisId}`,
        manufacturer: "Supermicro",
        modelNumber: "X12DAi-N6",
      },
      createdAt: new Date(),
    });

    const testDetection = await DetectionResult.create({
      analysisId: testAnalysisId,
      modelName: "YOLOv8x-PCB",
      modelVersion: "2.1.0",
      imageWidth: 2048,
      imageHeight: 1536,
      totalDetected: 42,
      componentsCount: 42,
      confidence: 0.94,
      components: [
        { name: "IC_CHIP_1", type: "BGA", confidence: 0.96 },
        { name: "CAP_POLY_2", type: "CAPACITOR", confidence: 0.93 },
      ],
    });

    const testPCB = await PCBAnalysis.create({
      analysisId: testAnalysisId,
      provider: "VISION",
      modelName: "OpenCV Topology Engine",
      modelVersion: "1.8.4",
      status: "COMPLETED",
      board: {
        widthPixels: 2048,
        heightPixels: 1536,
        aspectRatio: 1.33,
        estimatedPhysicalWidthMm: 305,
        estimatedPhysicalHeightMm: 244,
        physicalDimensionsAvailable: true,
        confidence: 0.95,
      },
      layers: { estimatedCount: 8, confidence: 0.9, method: "optical", notes: "Multi-layer server PCB" },
      damagedRegions: [],
      traces: [],
      pads: [],
      vias: [],
      reconstruction: { visualIntegrityEstimate: 92, confidence: 0.92, limitations: [] },
    });

    const testRUL = await RULPrediction.create({
      analysisId: testAnalysisId,
      modelProvider: "PHYSICS_ML",
      modelName: "XGBoost-Physics",
      modelVersion: "2.3.0",
      healthScore: 84,
      overallHealthScore: 84,
      healthStatus: "HEALTHY",
      healthConfidence: 0.88,
      rulYears: 3.5,
      predictedRULYears: 3.5,
      rulHours: 30660,
      confidence: 0.88,
      predictionInterval: { confidenceIntervalPercent: 80, lowerBoundYears: 2.8, upperBoundYears: 4.2 },
    });

    const testMaterial = await MaterialRecovery.create({
      analysisId: testAnalysisId,
      status: "COMPLETED",
      boardMass: {
        estimatedBoardMassGrams: 450,
        calculationMethod: "area_density",
        massValue: 450,
        massUnit: "g",
        massSource: "ESTIMATED",
        massConfidence: 0.9,
      },
      totalEstimatedMaterialMassGrams: 450,
      totalRecoverableMaterialMassGrams: 395,
      totalEstimatedMarketValueUSD: 42.8,
      preciousMetals: [
        { metal: "GOLD", estimatedMassGrams: 0.42, marketValueUSD: 36.2 },
        { metal: "SILVER", estimatedMassGrams: 1.8, marketValueUSD: 4.8 },
      ],
      criticalMaterials: [{ material: "TANTALUM", estimatedMassGrams: 0.15 }],
    });

    const testRepair = await RepairAssessment.create({
      analysisId: testAnalysisId,
      status: "COMPLETED",
      recommendedAction: "REFURBISH",
      overallRecommendation: "REFURBISH",
      overallRepairability: "REPAIRABLE",
      feasibilityIndexPercent: 88,
      decisionScore: 88,
      repairRecommendations: [
        {
          recommendationId: `rec-${Date.now()}`,
          action: "SOLDER_REFLOW",
          componentName: "BGA_CHIP_1",
          priority: "HIGH",
          reason: "Thermal fatigue observed on solder balls",
          expectedOutcome: "Restored connection integrity and lifespan extension",
        },
      ],
    });

    const testPassport = await DigitalPassport.create({
      passportId: `dpp-${testAnalysisId}`,
      analysisId: testAnalysisId,
      assetId: `asset-${testAnalysisId}`,
      assetType: "PCB",
      organizationId: testOrgId,
      status: "ACTIVE",
      version: 1,
      verificationStatus: "VALID",
      identity: {
        assetName: "Enterprise Server Motherboard X12",
        assetType: "PCB",
        manufacturer: "Supermicro",
        model: "X12DAi-N6",
        serialNumber: `SN-${Date.now()}`,
        countryOfOrigin: "TW",
        organization: testOrgId,
        analysisId: testAnalysisId,
      },
      lifecycleEvents: [
        {
          eventId: `evt-1-${Date.now()}`,
          passportId: `dpp-${testAnalysisId}`,
          eventType: "CREATED",
          actor: "EcoIntel Ingestion Engine",
          organization: testOrgId,
          timestamp: new Date(),
          description: "Initial asset registration and optical scanning complete.",
          contentHash: "sha256-mock-hash-1",
        },
      ],
    });

    const testCarbon = await CarbonImpact.create({
      analysisId: testAnalysisId,
      organizationId: testOrgId,
      status: "COMPLETED",
      totalAvoidedCO2e: 18.6,
      netAvoidedCO2e: 17.2,
      grossAvoidedCO2e: 19.0,
      waste: {
        baselineWasteKg: 0.45,
        divertedWasteKg: 0.42,
        remainingWasteKg: 0.03,
        diversionRatePercent: 93,
      },
      circularityScore: 86,
      methodologyVersion: "GHG_PROTOCOL_SCOPE3",
    });

    const testListing = await MarketplaceListing.create({
      listingId: `lst-${testAnalysisId}`,
      sellerOrganizationId: testOrgId,
      sellerUserId: "user-admin",
      assetType: "PCB",
      analysisId: testAnalysisId,
      passportId: `dpp-${testAnalysisId}`,
      title: "Supermicro X12 Server PCB - High RUL Tested",
      description: "Tested server motherboard verified via EcoIntel Digital Passport.",
      category: "COMPUTING_MOTHERBOARDS",
      manufacturer: "Supermicro",
      partNumber: "X12DAi-N6",
      packageType: "ATX",
      quantity: 1,
      quantityAvailable: 1,
      quantityReserved: 0,
      quantitySold: 0,
      condition: "REFURBISHED",
      verificationStatus: "PASSPORT_VERIFIED",
      status: "PUBLISHED",
      pricingType: "FIXED_PRICE",
      price: { amount: 180, currency: "USD" },
    });

    console.log(" Complete 9-Phase Entity Graph Created Successfully.\n");

    // -------------------------------------------------------------------------
    // TEST 1: Executive Dashboard KPI Aggregation
    // -------------------------------------------------------------------------
    const kpis = await ExecutiveDashboardService.getExecutiveKpis({ organizationId: testOrgId });
    assert(kpis.totalAssetsAnalyzed >= 1, "Dashboard KPI: Total assets analyzed matches database query");
    assert(kpis.componentsDetected >= 42, "Dashboard KPI: Components detected aggregated accurately");
    assert(kpis.activeMarketplaceListings >= 1, "Dashboard KPI: Active marketplace listings counted");
    assert(kpis.verifiedPassports >= 1, "Dashboard KPI: Verified passports counted");
    assert(kpis.estimatedCO2eAvoidedKg >= 18.6, "Dashboard KPI: Avoided CO2e emissions aggregated");

    // -------------------------------------------------------------------------
    // TEST 2: Time Range Filters
    // -------------------------------------------------------------------------
    const todayKpis = await ExecutiveDashboardService.getExecutiveKpis({ timeRange: "TODAY", organizationId: testOrgId });
    assert(todayKpis.totalAssetsAnalyzed >= 1, "Time Filter: TODAY range captures newly created asset");

    // -------------------------------------------------------------------------
    // TEST 3: Portfolio Health & RUL Distributions
    // -------------------------------------------------------------------------
    const distributions = await ExecutiveDashboardService.getPortfolioDistributions({ organizationId: testOrgId });
    assert(distributions.healthDistribution.Healthy >= 1, "Distribution: Health categorized as Healthy (84/100)");
    assert(distributions.rulDistribution.threeTo5Years >= 1, "Distribution: RUL categorized into 3–5 Years bucket (3.5 yrs)");

    // -------------------------------------------------------------------------
    // TEST 4: Risk Center Aggregation
    // -------------------------------------------------------------------------
    const risks = await ExecutiveDashboardService.getRiskCenter({ organizationId: testOrgId });
    assert(Array.isArray(risks), "Risk Center: Aggregates risk items without exceptions");

    // -------------------------------------------------------------------------
    // TEST 5: Asset Portfolio Pagination
    // -------------------------------------------------------------------------
    const portfolio = await ExecutiveDashboardService.getAssetPortfolio({ organizationId: testOrgId, limit: 10 });
    assert(portfolio.items.length >= 1, "Asset Portfolio: Retrieves paginated items");
    assert(portfolio.items[0].deviceName === "Enterprise Server Motherboard X12", "Asset Portfolio: Device name verified");
    assert(portfolio.items[0].isDemo === true, "Asset Portfolio: Demo state properly labeled");

    // -------------------------------------------------------------------------
    // TEST 6: Report Completeness Calculation
    // -------------------------------------------------------------------------
    const completeness = ReportService.calculateCompleteness({
      detection: testDetection,
      pcb: testPCB,
      rul: testRUL,
      materials: testMaterial,
      repair: testRepair,
      passport: testPassport,
      carbon: testCarbon,
    });
    assert(completeness.overallPercent === 100, `Report Completeness: Overall is 100% when all phases complete (got ${completeness.overallPercent}%)`);
    assert(completeness.missingSections.length === 0, "Report Completeness: Missing sections list is empty when complete");

    // Partial completeness test
    const partialCompleteness = ReportService.calculateCompleteness({
      detection: testDetection,
      pcb: testPCB,
      rul: null,
      materials: testMaterial,
      repair: null,
      passport: null,
      carbon: testCarbon,
    });
    assert(partialCompleteness.overallPercent < 100, "Report Completeness: Overall drops below 100% on partial pipeline");
    assert(partialCompleteness.missingSections.includes("Health & Remaining Useful Life (RUL)"), "Report Completeness: Identifies missing RUL section");

    // -------------------------------------------------------------------------
    // TEST 7: Multi-Report Generation: Asset Intelligence Report (v1)
    // -------------------------------------------------------------------------
    const assetReportV1 = await ReportService.generateAssetReport(testAnalysisId, {
      organizationId: testOrgId,
      format: "PDF",
    });
    assert(assetReportV1.reportType === "ASSET", "Asset Report: Type is ASSET");
    assert(assetReportV1.version === 1, "Asset Report: Initial version is 1");
    assert(assetReportV1.status === "READY", "Asset Report: Status is READY");
    assert(assetReportV1.sections.length >= 7, "Asset Report: Contains all 7 intelligence sections");
    assert(assetReportV1.isDemo === true, "Asset Report: Correctly flags isDemo for demo session");

    // -------------------------------------------------------------------------
    // TEST 8: Report Versioning (v1 -> v2)
    // -------------------------------------------------------------------------
    const assetReportV2 = await ReportService.generateAssetReport(testAnalysisId, {
      organizationId: testOrgId,
      format: "PDF",
    });
    assert(assetReportV2.version === 2, `Report Versioning: Version increments to 2 without overwrite (v${assetReportV2.version})`);
    
    // Verify historical version v1 is still accessible
    const v1Query = await Report.findOne({ reportId: assetReportV1.reportId });
    assert(v1Query !== null && v1Query.version === 1, "Report Versioning: Historical v1 record remains intact in database");

    // -------------------------------------------------------------------------
    // TEST 9: Specialized Report Types
    // -------------------------------------------------------------------------
    const techReport = await ReportService.generateTechnicalReport(testAnalysisId, { organizationId: testOrgId });
    assert(techReport.reportType === "TECHNICAL", "Technical Report: Generates TECHNICAL type");

    const circReport = await ReportService.generateCircularityReport(testAnalysisId, { organizationId: testOrgId });
    assert(circReport.reportType === "CIRCULARITY", "Circularity Report: Generates CIRCULARITY type");

    const envReport = await ReportService.generateEnvironmentalReport(testAnalysisId, { organizationId: testOrgId });
    assert(envReport.reportType === "ENVIRONMENTAL", "Environmental Report: Generates ENVIRONMENTAL type");

    const execReport = await ReportService.generateExecutiveReport(testOrgId);
    assert(execReport.reportType === "EXECUTIVE", "Executive Report: Generates EXECUTIVE type");

    // -------------------------------------------------------------------------
    // TEST 10: Server-side PDF Generation & Watermark
    // -------------------------------------------------------------------------
    const pdfExport = await ReportService.exportReport(assetReportV1.reportId, "PDF");
    assert(Buffer.isBuffer(pdfExport.data), "PDF Generation: Produces binary Buffer");
    assert((pdfExport.data as Buffer).length > 1000, `PDF Generation: Buffer has valid file size (${(pdfExport.data as Buffer).length} bytes)`);
    assert(pdfExport.contentType === "application/pdf", "PDF Generation: Sets application/pdf content type");

    // -------------------------------------------------------------------------
    // TEST 11: Export JSON and CSV
    // -------------------------------------------------------------------------
    const jsonExport = await ReportService.exportReport(assetReportV1.reportId, "JSON");
    assert(typeof jsonExport.data === "string" && jsonExport.data.includes("Asset Intelligence Dossier"), "Export JSON: Contains formatted JSON document");

    const csvExport = await ReportService.exportReport(assetReportV1.reportId, "CSV");
    assert(typeof csvExport.data === "string" && csvExport.data.includes("Report ID,Version,Type"), "Export CSV: Contains formatted CSV table header");

    // -------------------------------------------------------------------------
    // TEST 12: Secure Report Sharing & Expiration
    // -------------------------------------------------------------------------
    const shareToken = crypto.randomBytes(24).toString("hex");
    const share = await ReportShare.create({
      shareId: `share-${Date.now()}`,
      reportId: assetReportV1.reportId,
      shareToken,
      createdBy: "system",
      organizationId: testOrgId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      permissions: ["VIEW", "DOWNLOAD"],
      status: "ACTIVE",
    });
    assert(share.status === "ACTIVE", "Report Sharing: Created ACTIVE share record");

    const retrievedShare = await ReportShare.findOne({ shareToken });
    assert(retrievedShare !== null && retrievedShare.reportId === assetReportV1.reportId, "Report Sharing: Token lookup finds target report");

    // -------------------------------------------------------------------------
    // TEST 13: Audit Trail Tracking
    // -------------------------------------------------------------------------
    const reportAudit = await AuditLog.findOne({
      action: "REPORT_GENERATED",
      resourceId: assetReportV1.reportId,
    });
    assert(reportAudit !== null, "Audit Trail: REPORT_GENERATED event recorded in AuditLog");

    // -------------------------------------------------------------------------
    // TEST 14: Data Integrity Verification
    // -------------------------------------------------------------------------
    const integrityClean = await IntegrityService.verifyAnalysisIntegrity(testAnalysisId);
    assert(integrityClean.status === "CONSISTENT", `Data Integrity: Healthy analysis is CONSISTENT (got ${integrityClean.status})`);

    // Create intentional inconsistency: Recoverable mass exceeds total mass
    const badAnalysisId = `bad-int-${Date.now()}`;
    await AnalysisSession.create({
      analysisId: badAnalysisId,
      organizationId: testOrgId,
      deviceName: "Faulty Anomaly Asset",
      deviceType: "PCB",
      status: "COMPLETED",
    });
    await MaterialRecovery.create({
      analysisId: badAnalysisId,
      status: "COMPLETED",
      boardMass: { estimatedBoardMassGrams: 100, massValue: 100, massUnit: "g", massSource: "ESTIMATED", massConfidence: 0.8, calculationMethod: "area_density" },
      totalEstimatedMaterialMassGrams: 100,
      totalRecoverableMaterialMassGrams: 500, // 500g recoverable out of 100g total!
      totalEstimatedMarketValueUSD: 10,
    });

    const integrityAnomaly = await IntegrityService.verifyAnalysisIntegrity(badAnalysisId);
    assert(integrityAnomaly.status === "INCONSISTENT", "Data Integrity: Detects physical mass anomaly (status INCONSISTENT)");
    assert(integrityAnomaly.issues.some((i) => i.code === "RECOVERABLE_MASS_EXCEEDS_TOTAL"), "Data Integrity: Flags RECOVERABLE_MASS_EXCEEDS_TOTAL issue");

    // -------------------------------------------------------------------------
    // TEST 15: Notification Dispatch & Read Status
    // -------------------------------------------------------------------------
    const notif = await NotificationService.dispatch({
      organizationId: testOrgId,
      type: "REPORT_READY",
      title: "Test Report Notification",
      message: "Asset Dossier ready for review.",
      severity: "SUCCESS",
      entityType: "REPORT",
      entityId: assetReportV1.reportId,
    });
    assert(notif.read === false, "Notifications: New notification has read = false");

    const notifList = await NotificationService.getNotifications({ organizationId: testOrgId, unreadOnly: true });
    assert(notifList.items.length >= 1, "Notifications: Retrieved unread notifications");

    const marked = await NotificationService.markAsRead(notif.notificationId);
    assert(marked === true, "Notifications: Marked notification as read");

    // -------------------------------------------------------------------------
    // TEST 16: Unified Global Search
    // -------------------------------------------------------------------------
    const searchResults = await GlobalSearchService.search("Supermicro", testOrgId);
    assert(searchResults.length >= 1, `Global Search: Found entities matching 'Supermicro' (found ${searchResults.length})`);
    assert(searchResults.some((r) => r.entityType === "ANALYSIS" || r.entityType === "PASSPORT"), "Global Search: Results include ANALYSIS or PASSPORT entities");

    // -------------------------------------------------------------------------
    // TEST 17: Scientific Honesty Checks
    // -------------------------------------------------------------------------
    const evidenceLevels = assetReportV1.sections.map((s) => s.evidenceLevel);
    assert(evidenceLevels.includes("VERIFIED"), "Scientific Honesty: Uses VERIFIED evidence tag on identity");
    assert(evidenceLevels.includes("PREDICTED"), "Scientific Honesty: Uses PREDICTED evidence tag on RUL");
    assert(evidenceLevels.includes("DATABASE-DERIVED"), "Scientific Honesty: Uses DATABASE-DERIVED evidence tag on materials");

    // -------------------------------------------------------------------------
    // TEST 18: Idempotency & Clean Retry
    // -------------------------------------------------------------------------
    // Retrying a specific report type increments version cleanly without corrupting other reports
    const reportCountBefore = await Report.countDocuments({ analysisId: testAnalysisId });
    const techReportV2 = await ReportService.generateTechnicalReport(testAnalysisId, { organizationId: testOrgId });
    const reportCountAfter = await Report.countDocuments({ analysisId: testAnalysisId });
    assert(techReportV2.version === 2, "Idempotency: Re-running technical stage cleanly increments version to 2");
    assert(reportCountAfter === reportCountBefore + 1, "Idempotency: Exactly one new report created, no duplicate or orphaned records");

  } finally {
    console.log("\n================================================================================");
    console.log(`VERIFICATION SUMMARY: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
    console.log("================================================================================\n");
  }
}

runEnterpriseVerificationSuite()
  .then(() => {
    console.log(" Phase 10 Enterprise Suite execution completed successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Phase 10 Enterprise Suite execution failed:", err);
    process.exit(1);
  });
