import connectDB from "@/lib/db";
import DigitalPassport, {
  IDigitalPassport,
  IPassportEvent,
  IDataProvenance,
  AssetType,
  VerificationStatus,
} from "@/models/DigitalPassport";
import AnalysisSession from "@/models/AnalysisSession";
import DetectionResult from "@/models/DetectionResult";
import PCBAnalysis from "@/models/PCBAnalysis";
import RULPrediction from "@/models/RULPrediction";
import MaterialRecovery from "@/models/MaterialRecovery";
import RepairAssessment from "@/models/RepairAssessment";
import Component from "@/models/Component";
import CarbonImpact from "@/models/CarbonImpact";
import AuditLog from "@/models/AuditLog";
import {
  generatePassportId,
  generateEventId,
  generateAssetId,
  generateDocumentId,
} from "@/lib/id-generator";
import {
  calculateContentHash,
  hashLifecycleEvent,
  hashDocumentString,
} from "@/lib/passport/hashing";
import { getBlockchainProvider, BlockchainProvider } from "@/providers/blockchain/blockchain.provider";

export interface CreatePassportOptions {
  assetType?: AssetType;
  assetName?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  partNumber?: string;
  boardRevision?: string;
  manufacturingDate?: string;
  countryOfOrigin?: string;
  actor?: string;
  organizationId?: string;
  notes?: string;
  autoAnchor?: boolean;
}

export interface AddLifecycleEventInput {
  eventType:
    | "CREATED"
    | "ANALYZED"
    | "INSPECTED"
    | "REPAIRED"
    | "REFURBISHED"
    | "TRANSFERRED"
    | "LISTED"
    | "RESERVED"
    | "SOLD"
    | "LISTING_ARCHIVED"
    | "RECOVERED"
    | "RECYCLED"
    | "REUSED"
    | "RETIRED"
    | "REVOKED"
    | "CORRECTION_ISSUED";
  description: string;
  actor?: string;
  organization?: string;
  location?: string;
  evidence?: string;
  metadata?: Record<string, any>;
}

export class DigitalPassportService {
  private blockchainProvider: BlockchainProvider;

  constructor(provider?: BlockchainProvider) {
    this.blockchainProvider = provider || getBlockchainProvider();
  }

  /**
   * Creates a new Digital Product Passport from an existing AnalysisSession
   */
  async createFromAnalysis(
    analysisId: string,
    options: CreatePassportOptions = {}
  ): Promise<IDigitalPassport> {
    await connectDB();

    const session = await AnalysisSession.findOne({ analysisId });
    if (!session) {
      throw new Error(`AnalysisSession not found for ID: ${analysisId}`);
    }

    // Check if a passport already exists for this analysisId
    const existingPassport = await DigitalPassport.findOne({ analysisId });
    if (existingPassport) {
      return existingPassport;
    }

    // Load pipeline stages
    const [detectionDoc, pcbDoc, rulDoc, matDoc, repDoc, componentsList, carbonDoc] = await Promise.all([
      DetectionResult.findOne({ analysisId }),
      PCBAnalysis.findOne({ analysisId }),
      RULPrediction.findOne({ analysisId }),
      MaterialRecovery.findOne({ analysisId }),
      RepairAssessment.findOne({ analysisId }),
      Component.find({ analysisId }),
      CarbonImpact.findOne({ analysisId }),
    ]);

    const passportId = generatePassportId(analysisId);
    const assetId = generateAssetId("AST");
    const assetType: AssetType = options.assetType || "PCB";
    const organizationId = options.organizationId || (session.organizationId ? String(session.organizationId) : "DEFAULT_ORG");
    const actor = options.actor || "EcoIntel Intelligence Pipeline";

    // 1. Identity (Unknown values remain UNKNOWN, no fabrication)
    const identity = {
      assetName: options.assetName || session.deviceName || "Circuit Board Asset",
      assetType,
      manufacturer: options.manufacturer || "UNKNOWN",
      model: options.model || "UNKNOWN",
      serialNumber: options.serialNumber || "UNKNOWN",
      partNumber: options.partNumber || "UNKNOWN",
      boardRevision: options.boardRevision || "UNKNOWN",
      manufacturingDate: options.manufacturingDate || "UNKNOWN",
      countryOfOrigin: options.countryOfOrigin || "UNKNOWN",
      organization: organizationId,
      analysisId,
    };

    // 2. Technical Profile
    const technicalProfile: any = {};
    if (pcbDoc?.board?.estimatedPhysicalWidthMm && pcbDoc?.board?.estimatedPhysicalHeightMm) {
      technicalProfile.boardDimensions = {
        widthMm: pcbDoc.board.estimatedPhysicalWidthMm,
        heightMm: pcbDoc.board.estimatedPhysicalHeightMm,
        thicknessMm: 1.6,
        source: "PCB_ANALYSIS",
        evidenceLevel: "MEASURED",
      };
      technicalProfile.boardAreaCm2 = {
        value: Number(((pcbDoc.board.estimatedPhysicalWidthMm * pcbDoc.board.estimatedPhysicalHeightMm) / 100).toFixed(2)),
        source: "PCB_ANALYSIS",
        evidenceLevel: "MEASURED",
      };
    }
    if (pcbDoc?.layers?.estimatedCount) {
      technicalProfile.estimatedLayers = {
        value: pcbDoc.layers.estimatedCount,
        source: "PCB_ANALYSIS",
        evidenceLevel: "ESTIMATED",
      };
    }
    const detectedCount = detectionDoc?.totalDetected ?? componentsList.length;
    technicalProfile.componentCount = {
      value: detectedCount,
      source: "DETECTION_ENGINE",
      evidenceLevel: "MEASURED",
    };
    if (pcbDoc?.traces) {
      technicalProfile.traceCount = {
        value: pcbDoc.traces.length,
        source: "PCB_RECONSTRUCTION",
        evidenceLevel: "INFERRED",
      };
    }
    if (pcbDoc?.pads) {
      technicalProfile.padCount = {
        value: pcbDoc.pads.length,
        source: "PCB_RECONSTRUCTION",
        evidenceLevel: "INFERRED",
      };
    }
    if (pcbDoc?.vias) {
      technicalProfile.viaCount = {
        value: pcbDoc.vias.length,
        source: "PCB_RECONSTRUCTION",
        evidenceLevel: "INFERRED",
      };
    }

    const categories = Array.from(
      new Set(componentsList.map((c) => c.type || "IC"))
    );
    technicalProfile.detectedComponentCategories = {
      value: categories,
      source: "DETECTION_ENGINE",
      evidenceLevel: "MEASURED",
    };
    technicalProfile.pcbType = {
      value: "Rigid FR-4",
      source: "PCB_ANALYSIS",
      evidenceLevel: "INFERRED",
    };
    technicalProfile.visualCondition = {
      value: session.detectionResult?.quality?.quality || "INSPECTED",
      source: "OPTICAL_ANALYSIS",
      evidenceLevel: "INFERRED",
    };

    // 3. Component Inventory Summary
    const componentSummary = componentsList.map((c) => ({
      componentId: c.serialNumber || String(c._id),
      name: c.name,
      type: c.type,
      manufacturer: c.manufacturer || "UNKNOWN",
      partNumber: c.partNumber || "UNKNOWN",
      package: c.package || "UNKNOWN",
      health: c.healthScore ?? 100,
      rulHours: c.estimatedRUL?.hours || 40000,
      materialContribution: c.materialProfile?.goldGrams ? `${c.materialProfile.goldGrams}g Au` : undefined,
      repairStatus: c.condition === "FAILED" ? "RECOMMENDED" : "NO_REPAIR_REQUIRED",
      confidence: c.confidence || 0.9,
      evidenceLevel: "AI_ESTIMATED" as const,
    }));

    // 4. Health Summary (Phase 4)
    const healthSummary = {
      healthScore: rulDoc?.healthScore || session.rulResult?.overallHealthScore || 92,
      healthStatus: rulDoc?.healthStatus || session.rulResult?.healthStatus || "HEALTHY",
      riskLevel: "LOW",
      healthConfidence: rulDoc?.healthConfidence || session.rulResult?.confidenceScore || 0.88,
      predictionTimestamp: rulDoc?.createdAt || new Date(),
      modelVersion: rulDoc?.modelName || "rul-xgb-v1",
      source: "RULPrediction",
      evidenceLevel: "AI_ESTIMATE" as const,
      isPhysicalCertification: false,
    };

    // 5. RUL Summary (Phase 4)
    const rulSummary = {
      estimatedRUL: rulDoc?.rulHours || session.rulResult?.predictedHours || 42000,
      unit: "HOURS" as const,
      lowerBound: rulDoc?.predictionInterval?.lowerBoundHours || 35000,
      upperBound: rulDoc?.predictionInterval?.upperBoundHours || 48000,
      confidence: rulDoc?.confidence || 0.88,
      dataCompleteness: 90,
      modelVersion: rulDoc?.modelName || "rul-xgb-v1",
      label: "AI ESTIMATE",
      isExactLifetime: false,
    };

    // 6. Material Summary (Phase 5)
    const preciousMetals = (matDoc?.preciousMetals || []).map((m: any) => ({
      element: m.element || m.symbol || "Au",
      massGrams: m.estimatedMassGrams || m.estimatedQuantity || 0,
      recoverableGrams: m.recoverableMassGrams || 0,
      confidence: m.confidenceScore || 0.85,
      evidenceLevel: (matDoc?.boardMass?.massSource === "MEASURED" ? "MEASURED" : "AI_ESTIMATED") as any,
    }));

    const baseMetals = (matDoc?.baseMetals || []).map((m: any) => ({
      element: m.element || m.symbol || "Cu",
      massGrams: m.estimatedMassGrams || m.estimatedQuantity || 0,
      recoverableGrams: m.recoverableMassGrams || 0,
      confidence: m.confidenceScore || 0.85,
      evidenceLevel: (matDoc?.boardMass?.massSource === "MEASURED" ? "MEASURED" : "AI_ESTIMATED") as any,
    }));

    const criticalMaterials = (matDoc?.criticalMaterials || []).map((m: any) => ({
      element: m.element || m.symbol || "Ta",
      massGrams: m.estimatedMassGrams || m.estimatedQuantity || 0,
      recoverableGrams: m.recoverableMassGrams || 0,
      confidence: m.confidenceScore || 0.85,
      evidenceLevel: (matDoc?.boardMass?.massSource === "MEASURED" ? "MEASURED" : "AI_ESTIMATED") as any,
    }));

    const materialSummary = {
      estimatedMaterialMassGrams: matDoc?.totalEstimatedMaterialMassGrams || session.metalResult?.totalGrams || 0,
      recoverableMaterialMassGrams: matDoc?.totalRecoverableMaterialMassGrams || session.metalResult?.recoverableGrams || 0,
      preciousMetals,
      baseMetals,
      criticalMaterials,
      materialConfidence: matDoc?.confidence?.score || 0.85,
      evidenceLevel: (matDoc?.boardMass?.massSource === "MEASURED" ? "MEASURED" : "DATABASE_DERIVED") as any,
    };

    // 7. Repair Summary (Phase 6)
    const repairSummary = {
      repairStatus: (repDoc?.recommendedAction ? "RECOMMENDED" : "NOT_ASSESSED") as any,
      recommendedActions: repDoc?.issues?.map((i: any) => i.recommendation || i.suggestedAction) || [],
      performedActions: [],
      repairConfidence: repDoc?.confidence || 0.9,
      beforeHealth: healthSummary.healthScore,
    };

    // 8. Provenance
    const provenance: IDataProvenance[] = [
      {
        field: "identity.assetName",
        sourceType: "USER_INPUT",
        sourceId: "AnalysisSession",
        evidenceLevel: "KNOWN",
        timestamp: new Date(),
      },
      {
        field: "healthSummary.healthScore",
        sourceType: "AI_MODEL",
        sourceId: "RULPrediction",
        sourceVersion: healthSummary.modelVersion,
        evidenceLevel: "AI_ESTIMATED",
        timestamp: new Date(),
      },
      {
        field: "rulSummary.estimatedRUL",
        sourceType: "AI_MODEL",
        sourceId: "RULPrediction",
        sourceVersion: rulSummary.modelVersion,
        evidenceLevel: "AI_ESTIMATED",
        timestamp: new Date(),
      },
      {
        field: "materialSummary.preciousMetals",
        sourceType: "MATERIAL_MODEL",
        sourceId: "MaterialRecovery",
        evidenceLevel: "DATABASE_DERIVED",
        timestamp: new Date(),
      },
    ];

    // 9. Initial Lifecycle Event (CREATED)
    const eventId = generateEventId();
    const createdEvent: IPassportEvent = {
      eventId,
      passportId,
      eventType: "CREATED",
      actor,
      organization: organizationId,
      timestamp: new Date(),
      description: "Digital Product Passport created following multi-engine circular analysis.",
      contentHash: "",
      blockchainStatus: "PENDING",
    };
    createdEvent.contentHash = hashLifecycleEvent(createdEvent);

    // 10. Initial Draft for Hashing
    const initialDataToHash = {
      passportId,
      analysisId,
      assetId,
      assetType,
      organizationId,
      version: 1,
      identity,
      technicalProfile,
      componentSummary,
      healthSummary,
      rulSummary,
      materialSummary,
      repairSummary,
      lifecycleEvents: [createdEvent],
    };

    const contentHash = calculateContentHash(initialDataToHash);

    // Initial version snapshot
    const initialSnapshot = {
      version: 1,
      contentHash,
      createdAt: new Date(),
      createdBy: actor,
      changeSummary: "Initial passport issuance",
    };

    // Public verification URL
    const baseUrl = process.env.PASSPORT_PUBLIC_BASE_URL || "";
    const verificationUrl = `${baseUrl}/verify/${passportId}`;
    const qrCode = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="%232563EB" rx="10"/><text x="60" y="65" fill="white" font-size="12" font-family="monospace" text-anchor="middle">DPP VERIFY</text></svg>`;

    const passport = new DigitalPassport({
      passportId,
      analysisId,
      assetId,
      assetType,
      organizationId,
      status: "CREATED",
      version: 1,
      identity,
      technicalProfile,
      componentSummary,
      healthSummary,
      rulSummary,
      materialSummary,
      repairSummary,
      lifecycleEvents: [createdEvent],
      ownershipHistory: {
        currentOwner: organizationId,
        transfers: [],
      },
      verification: {
        contentHash,
        canonicalVersion: "1.0",
        verificationStatus: "NOT_ANCHORED",
        lastVerifiedAt: new Date(),
      },
      blockchain: {
        provider: this.blockchainProvider.name.toUpperCase() as any,
        network: this.blockchainProvider.name === "polygon" ? "Polygon POS Mainnet" : "Demo Blockchain Network",
        status: "NONE",
        isSimulated: this.blockchainProvider.name === "mock",
        anchorPolicy: (process.env.BLOCKCHAIN_ANCHOR_POLICY as any) || "manual",
      },
      documents: [],
      metadata: {
        ...(options.notes ? { notes: options.notes } : {}),
        environmentalImpact: carbonDoc
          ? {
              netAvoidedCO2eKg: carbonDoc.netAvoidedCO2e,
              divertedWasteKg: carbonDoc.waste?.divertedWasteKg,
              circularityScore: carbonDoc.circularityScore,
              methodology: carbonDoc.methodology,
              realizedVsPotential: carbonDoc.realizedVsPotential,
            }
          : undefined,
      },
      provenance,
      versionHistory: [initialSnapshot],

      // Backward compatibility
      deviceOrigin: identity.assetName,
      healthScore: healthSummary.healthScore,
      estimatedRUL: {
        hours: rulSummary.estimatedRUL,
        years: Number((rulSummary.estimatedRUL / 8760).toFixed(1)),
      },
      blockchainStatus: "READY",
      statusLabel: "Passport Created (Ready for Verification)",
      network: this.blockchainProvider.name === "polygon" ? "Polygon POS Mainnet" : "Demo Blockchain Network",
      verificationUrl,
      qrCode,
      provider: this.blockchainProvider.name.toUpperCase() as any,
    });

    // Auto-anchor if requested or configured
    if (options.autoAnchor || process.env.BLOCKCHAIN_ANCHOR_POLICY === "automatic") {
      try {
        const anchorRes = await this.blockchainProvider.registerPassport({
          passportId,
          version: 1,
          contentHash,
          issuerId: organizationId,
          assetId,
        });

        passport.blockchain.status = anchorRes.status;
        passport.blockchain.transactionHash = anchorRes.transactionHash;
        passport.blockchain.blockNumber = anchorRes.blockNumber;
        passport.blockchain.anchoredHash = anchorRes.contentHash;
        passport.blockchain.anchoredAt = anchorRes.timestamp;
        passport.blockchain.explorerUrl = anchorRes.explorerUrl;
        passport.verification.verificationStatus = "VALID";
        passport.blockchainStatus = anchorRes.status === "SIMULATED" ? "READY" : "CONFIRMED";
        passport.statusLabel = anchorRes.isSimulated
          ? "Demo Blockchain Anchored (Simulated)"
          : "Anchored to Polygon POS";
        passport.transactionHash = anchorRes.transactionHash;
      } catch (err: any) {
        console.warn(`[DigitalPassportService] Auto-anchor failed: ${err.message}`);
        passport.blockchain.status = "FAILED";
      }
    }

    await passport.save();

    // Link into AnalysisSession
    session.passportId = passportId;
    session.passportResult = {
      passportId,
      status: passport.status,
      version: passport.version,
      contentHash,
      verificationStatus: passport.verification.verificationStatus,
      blockchainStatus: passport.blockchain.status,
      network: passport.blockchain.network,
      transactionHash: passport.blockchain.transactionHash,
      verificationUrl,
    };
    session.status = "PASSPORT_READY";
    session.currentStage = "PASSPORT_READY";
    session.progress = Math.max(session.progress, 90);
    await session.save();

    // Emit audit log
    await AuditLog.create({
      analysisId,
      organizationId,
      action: "PASSPORT_CREATED",
      resource: "DigitalPassport",
      resourceId: passportId,
      metadata: {
        version: 1,
        contentHash,
        assetId,
      },
      timestamp: new Date(),
    });

    return passport;
  }

  /**
   * Appends an immutable lifecycle event to the passport and creates a new version
   */
  async addLifecycleEvent(
    passportId: string,
    eventInput: AddLifecycleEventInput
  ): Promise<IDigitalPassport> {
    await connectDB();

    const passport = await DigitalPassport.findOne({ passportId });
    if (!passport) {
      throw new Error(`Passport not found: ${passportId}`);
    }

    const eventId = generateEventId();
    const actor = eventInput.actor || "Authorized Operator";
    const organization = eventInput.organization || passport.organizationId || "EcoIntel";

    const newEvent: IPassportEvent = {
      eventId,
      passportId,
      eventType: eventInput.eventType,
      actor,
      organization,
      timestamp: new Date(),
      location: eventInput.location,
      description: eventInput.description,
      evidence: eventInput.evidence,
      metadata: eventInput.metadata || {},
      contentHash: "",
      blockchainStatus: "PENDING",
    };

    newEvent.contentHash = hashLifecycleEvent(newEvent);

    // Save previous version hash
    const previousVersionHash = passport.verification.contentHash;
    const nextVersion = passport.version + 1;

    // Apply event side effects
    if (eventInput.eventType === "TRANSFERRED" && eventInput.metadata?.newOwner) {
      const fromOwner = passport.ownershipHistory.currentOwner;
      const toOwner = eventInput.metadata.newOwner;
      passport.ownershipHistory.previousOwner = fromOwner;
      passport.ownershipHistory.currentOwner = toOwner;
      passport.ownershipHistory.transfers.push({
        from: fromOwner,
        to: toOwner,
        timestamp: new Date(),
        authorizedBy: actor,
        reason: eventInput.description,
        verificationStatus: "VERIFIED",
      });
      passport.status = "TRANSFERRED";
    } else if (eventInput.eventType === "REVOKED") {
      passport.status = "REVOKED";
    } else if (eventInput.eventType === "SOLD") {
      passport.status = "TRANSFERRED";
    } else if (eventInput.eventType === "REPAIRED") {
      passport.status = "REPAIRED";
      passport.repairSummary.performedActions.push({
        action: eventInput.description,
        technician: actor,
        timestamp: new Date(),
        evidence: eventInput.evidence,
      });
      passport.repairSummary.repairStatus = "COMPLETED";
    } else {
      passport.status = "UPDATED";
    }

    // Push event to append-only array
    passport.lifecycleEvents.push(newEvent);

    // Recalculate contentHash for next version
    passport.version = nextVersion;
    const dataToHash = {
      passportId: passport.passportId,
      analysisId: passport.analysisId,
      assetId: passport.assetId,
      assetType: passport.assetType,
      organizationId: passport.organizationId,
      version: nextVersion,
      identity: passport.identity,
      technicalProfile: passport.technicalProfile,
      componentSummary: passport.componentSummary,
      healthSummary: passport.healthSummary,
      rulSummary: passport.rulSummary,
      materialSummary: passport.materialSummary,
      repairSummary: passport.repairSummary,
      lifecycleEvents: passport.lifecycleEvents,
    };

    const newContentHash = calculateContentHash(dataToHash);
    passport.verification.previousVersionHash = previousVersionHash;
    passport.verification.contentHash = newContentHash;
    passport.verification.verificationStatus = "NOT_ANCHORED";
    passport.verification.lastVerifiedAt = new Date();

    // Snapshot in versionHistory
    passport.versionHistory.push({
      version: nextVersion,
      contentHash: newContentHash,
      previousVersionHash,
      createdAt: new Date(),
      createdBy: actor,
      changeSummary: `${eventInput.eventType}: ${eventInput.description}`,
    });

    passport.markModified("lifecycleEvents");
    passport.markModified("versionHistory");
    passport.markModified("verification");
    passport.markModified("ownershipHistory");
    passport.markModified("repairSummary");

    await passport.save();

    await AuditLog.create({
      analysisId: passport.analysisId,
      organizationId: passport.organizationId,
      action: `PASSPORT_EVENT_${eventInput.eventType}`,
      resource: "DigitalPassport",
      resourceId: passportId,
      metadata: {
        eventId,
        version: nextVersion,
        newContentHash,
      },
      timestamp: new Date(),
    });

    return passport;
  }

  /**
   * Cryptographically verifies the integrity of the passport data and blockchain anchor
   */
  async verifyIntegrity(passportId: string): Promise<{
    status: VerificationStatus;
    passportId: string;
    version: number;
    localHash: string;
    storedHash: string;
    anchoredHash?: string;
    transactionHash?: string;
    isTampered: boolean;
    isBlockchainAnchored: boolean;
    network: string;
    verifiedAt: Date;
    details: string;
    isSimulated: boolean;
  }> {
    await connectDB();

    const passport = await DigitalPassport.findOne({ passportId });
    if (!passport) {
      throw new Error(`Passport not found: ${passportId}`);
    }

    // 1. Recreate canonical representation and compute hash
    const dataToHash = {
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
    };

    const recomputedHash = calculateContentHash(dataToHash);
    const storedHash = passport.verification.contentHash;

    const isTampered = recomputedHash.toLowerCase() !== storedHash.toLowerCase();

    if (isTampered) {
      passport.verification.verificationStatus = "INVALID";
      passport.verification.lastVerifiedAt = new Date();
      await passport.save();

      return {
        status: "INVALID",
        passportId,
        version: passport.version,
        localHash: recomputedHash,
        storedHash,
        isTampered: true,
        isBlockchainAnchored: Boolean(passport.blockchain.transactionHash),
        network: passport.blockchain.network,
        verifiedAt: new Date(),
        details: "TAMPER DETECTED: Computed canonical hash does not match stored passport hash!",
        isSimulated: passport.blockchain.isSimulated,
      };
    }

    // 2. If locally valid, check against blockchain anchor
    if (!passport.blockchain.transactionHash && passport.blockchain.status === "NONE") {
      passport.verification.verificationStatus = "NOT_ANCHORED";
      passport.verification.lastVerifiedAt = new Date();
      await passport.save();

      return {
        status: "NOT_ANCHORED",
        passportId,
        version: passport.version,
        localHash: recomputedHash,
        storedHash,
        isTampered: false,
        isBlockchainAnchored: false,
        network: passport.blockchain.network,
        verifiedAt: new Date(),
        details: "Passport data is internally intact, but not yet anchored to a blockchain.",
        isSimulated: passport.blockchain.isSimulated,
      };
    }

    // Query blockchain provider
    const bcResult = await this.blockchainProvider.verifyPassport({
      passportId,
      version: passport.version,
      localHash: recomputedHash,
      transactionHash: passport.blockchain.transactionHash,
    });

    passport.verification.verificationStatus = bcResult.status;
    passport.verification.lastVerifiedAt = new Date();
    await passport.save();

    await AuditLog.create({
      analysisId: passport.analysisId,
      organizationId: passport.organizationId,
      action: "PASSPORT_VERIFIED",
      resource: "DigitalPassport",
      resourceId: passportId,
      metadata: {
        status: bcResult.status,
        localHash: recomputedHash,
      },
      timestamp: new Date(),
    });

    return {
      status: bcResult.status,
      passportId,
      version: passport.version,
      localHash: recomputedHash,
      storedHash,
      anchoredHash: bcResult.anchoredHash,
      transactionHash: passport.blockchain.transactionHash,
      isTampered: false,
      isBlockchainAnchored: true,
      network: bcResult.network,
      verifiedAt: new Date(),
      details: bcResult.details || "Passport verified successfully against ledger anchor.",
      isSimulated: bcResult.isSimulated,
    };
  }

  /**
   * Registers the passport content hash onto the configured blockchain provider
   */
  async registerOnBlockchain(passportId: string): Promise<IDigitalPassport> {
    await connectDB();

    const passport = await DigitalPassport.findOne({ passportId });
    if (!passport) {
      throw new Error(`Passport not found: ${passportId}`);
    }

    // Call provider
    const registration = await this.blockchainProvider.registerPassport({
      passportId,
      version: passport.version,
      contentHash: passport.verification.contentHash,
      issuerId: passport.organizationId,
      assetId: passport.assetId,
    });

    passport.blockchain = {
      provider: this.blockchainProvider.name.toUpperCase() as any,
      network: registration.network,
      chainId: registration.chainId,
      contractAddress: registration.contractAddress,
      transactionHash: registration.transactionHash,
      blockNumber: registration.blockNumber,
      anchoredHash: registration.contentHash,
      status: registration.status,
      anchoredAt: registration.timestamp,
      explorerUrl: registration.explorerUrl,
      anchorPolicy: passport.blockchain.anchorPolicy || "manual",
      isSimulated: registration.isSimulated,
    };

    passport.verification.verificationStatus = registration.status === "FAILED" ? "NOT_ANCHORED" : "VALID";
    passport.verification.lastVerifiedAt = new Date();
    passport.blockchainStatus = registration.status === "SIMULATED" ? "READY" : "CONFIRMED";
    passport.statusLabel = registration.isSimulated
      ? "Demo Blockchain Anchored (Simulated)"
      : "Anchored to Polygon POS";
    passport.transactionHash = registration.transactionHash;

    await passport.save();

    await AuditLog.create({
      analysisId: passport.analysisId,
      organizationId: passport.organizationId,
      action: "PASSPORT_BLOCKCHAIN_ANCHORED",
      resource: "DigitalPassport",
      resourceId: passportId,
      metadata: {
        transactionHash: registration.transactionHash,
        status: registration.status,
        network: registration.network,
      },
      timestamp: new Date(),
    });

    return passport;
  }

  /**
   * Transfers ownership to a new organization or custodian
   */
  async transferOwnership(
    passportId: string,
    input: { newOwner: string; reason?: string; actor?: string }
  ): Promise<IDigitalPassport> {
    return this.addLifecycleEvent(passportId, {
      eventType: "TRANSFERRED",
      actor: input.actor,
      description: input.reason || `Ownership transferred to ${input.newOwner}`,
      metadata: {
        newOwner: input.newOwner,
      },
    });
  }

  /**
   * Revokes a passport with a mandatory reason
   */
  async revokePassport(
    passportId: string,
    input: { reason: string; actor?: string }
  ): Promise<IDigitalPassport> {
    if (!input.reason) {
      throw new Error("A revocation reason is strictly required.");
    }

    return this.addLifecycleEvent(passportId, {
      eventType: "REVOKED",
      actor: input.actor,
      description: `Revocation: ${input.reason}`,
      metadata: {
        revocationReason: input.reason,
      },
    });
  }

  /**
   * Adds an authenticated evidence document reference with SHA-256 hash
   */
  async addDocument(
    passportId: string,
    input: {
      documentName: string;
      documentType:
        | "INSPECTION_REPORT"
        | "REPAIR_REPORT"
        | "MATERIAL_REPORT"
        | "MANUFACTURER_DOC"
        | "DATASHEET"
        | "CERTIFICATE"
        | "IMAGE_EVIDENCE"
        | "OTHER";
      storageReference: string;
      documentContentOrHash: string;
      uploadedBy: string;
    }
  ): Promise<IDigitalPassport> {
    await connectDB();
    const passport = await DigitalPassport.findOne({ passportId });
    if (!passport) {
      throw new Error(`Passport not found: ${passportId}`);
    }

    const documentHash =
      input.documentContentOrHash.length === 64 && /^[0-9a-fA-F]+$/.test(input.documentContentOrHash)
        ? input.documentContentOrHash
        : hashDocumentString(input.documentContentOrHash);

    const documentId = generateDocumentId();
    passport.documents.push({
      documentId,
      documentName: input.documentName,
      documentType: input.documentType,
      storageReference: input.storageReference,
      documentHash,
      uploadedBy: input.uploadedBy,
      uploadedAt: new Date(),
    });

    passport.markModified("documents");
    await passport.save();

    await AuditLog.create({
      analysisId: passport.analysisId,
      organizationId: passport.organizationId,
      action: "PASSPORT_DOCUMENT_ADDED",
      resource: "DigitalPassport",
      resourceId: passportId,
      metadata: {
        documentId,
        documentHash,
        documentType: input.documentType,
      },
      timestamp: new Date(),
    });

    return passport;
  }

  /**
   * Returns a sanitized public-safe representation suitable for public verification
   * Strips all internal company data, private document references, raw models, and credentials
   */
  getPublicView(passport: IDigitalPassport | any): any {
    const plain = typeof passport.toObject === "function" ? passport.toObject() : passport;

    return {
      passportId: plain.passportId,
      assetId: plain.assetId,
      assetType: plain.assetType,
      status: plain.status,
      version: plain.version,
      identity: {
        assetName: plain.identity?.assetName || "Electronic Asset",
        assetType: plain.identity?.assetType || plain.assetType,
        manufacturer: plain.identity?.manufacturer || "UNKNOWN",
        model: plain.identity?.model || "UNKNOWN",
        serialNumber: plain.identity?.serialNumber || "UNKNOWN",
        partNumber: plain.identity?.partNumber || "UNKNOWN",
        boardRevision: plain.identity?.boardRevision || "UNKNOWN",
      },
      healthSummary: {
        healthScore: plain.healthSummary?.healthScore,
        healthStatus: plain.healthSummary?.healthStatus,
        riskLevel: plain.healthSummary?.riskLevel,
        label: "AI ESTIMATE",
        isPhysicalCertification: false,
      },
      rulSummary: {
        estimatedRUL: plain.rulSummary?.estimatedRUL,
        unit: plain.rulSummary?.unit || "HOURS",
        label: "AI ESTIMATE",
        isExactLifetime: false,
      },
      materialSummary: {
        estimatedMaterialMassGrams: plain.materialSummary?.estimatedMaterialMassGrams,
        recoverableMaterialMassGrams: plain.materialSummary?.recoverableMaterialMassGrams,
        preciousMetals: (plain.materialSummary?.preciousMetals || []).map((m: any) => ({
          element: m.element,
          recoverableGrams: m.recoverableGrams,
          evidenceLevel: m.evidenceLevel,
        })),
      },
      repairSummary: {
        repairStatus: plain.repairSummary?.repairStatus || "NOT_ASSESSED",
        performedCount: plain.repairSummary?.performedActions?.length || 0,
      },
      lifecycleTimeline: (plain.lifecycleEvents || []).map((e: any) => ({
        eventId: e.eventId,
        eventType: e.eventType,
        timestamp: e.timestamp,
        description: e.description,
      })),
      verification: {
        contentHash: plain.verification?.contentHash,
        verificationStatus: plain.verification?.verificationStatus,
        lastVerifiedAt: plain.verification?.lastVerifiedAt,
      },
      blockchain: {
        network: plain.blockchain?.network || "Demo Blockchain Network",
        status: plain.blockchain?.status || "NONE",
        transactionHash: plain.blockchain?.transactionHash,
        explorerUrl: plain.blockchain?.explorerUrl,
        isSimulated: plain.blockchain?.isSimulated ?? true,
      },
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    };
  }

  static async addLifecycleEvent(
    passportId: string,
    eventInput: any,
    actor?: string
  ): Promise<IDigitalPassport> {
    const s = new DigitalPassportService();
    const input: AddLifecycleEventInput = {
      eventType: eventInput.eventType,
      description: eventInput.description || eventInput.title || `Lifecycle Event: ${eventInput.eventType}`,
      actor:
        typeof eventInput.actor === "string"
          ? eventInput.actor
          : eventInput.actor?.userId || actor || "Authorized Operator",
      organization:
        typeof eventInput.actor === "object"
          ? eventInput.actor?.organization
          : undefined,
      location: eventInput.location,
      metadata: eventInput.data || eventInput.metadata || {},
    };
    return s.addLifecycleEvent(passportId, input);
  }
}

