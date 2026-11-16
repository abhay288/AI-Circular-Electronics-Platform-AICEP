import mongoose, { Schema, Model, Document } from "mongoose";

export type AssetType =
  | "PCB"
  | "ELECTRONIC_DEVICE"
  | "COMPONENT"
  | "RECOVERED_COMPONENT"
  | "REFURBISHED_DEVICE"
  | "REPAIRED_DEVICE";

export type PassportStatus =
  | "CREATED"
  | "ACTIVE"
  | "UPDATED"
  | "TRANSFERRED"
  | "REPAIRED"
  | "REFURBISHED"
  | "RECOVERED"
  | "RECYCLED"
  | "RETIRED"
  | "REVOKED";

export type BlockchainStatus =
  | "NONE"
  | "PENDING"
  | "CONFIRMED"
  | "FAILED"
  | "SIMULATED"
  | "READY"
  | "MINTED"
  | "VERIFIED";

export type VerificationStatus =
  | "VALID"
  | "INVALID"
  | "NOT_ANCHORED"
  | "PENDING"
  | "UNKNOWN";

export type EvidenceLevel =
  | "VERIFIED"
  | "MEASURED"
  | "KNOWN"
  | "DATASHEET"
  | "DATABASE_DERIVED"
  | "AI_ESTIMATED"
  | "INFERRED"
  | "SIMULATED"
  | "DEMO"
  | "UNKNOWN";

export type SourceType =
  | "USER_INPUT"
  | "MEASURED"
  | "MANUFACTURER"
  | "DATASHEET"
  | "DATABASE"
  | "AI_MODEL"
  | "PCB_ANALYSIS"
  | "RUL_MODEL"
  | "MATERIAL_MODEL"
  | "REPAIR_RECORD"
  | "BLOCKCHAIN"
  | "SYSTEM_GENERATED"
  | "DEMO_DATASET";

export interface IDataProvenance {
  field: string;
  sourceType: SourceType;
  sourceId: string;
  sourceVersion?: string;
  evidenceLevel: EvidenceLevel;
  timestamp: Date;
}

export interface IPassportEvent {
  eventId: string;
  passportId: string;
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
  actor: string;
  organization: string;
  timestamp: Date;
  location?: string;
  description: string;
  evidence?: string;
  metadata?: Record<string, any>;
  contentHash: string;
  blockchainStatus?: string;
  blockchainTxHash?: string;
}

export interface IPassportVersionSnapshot {
  version: number;
  contentHash: string;
  previousVersionHash?: string;
  createdAt: Date;
  createdBy: string;
  changeSummary: string;
}

export interface IPassportDocument {
  documentId: string;
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
  documentHash: string; // SHA-256
  uploadedBy: string;
  uploadedAt: Date;
}

export interface IComponentSummaryItem {
  componentId: string;
  name: string;
  type: string;
  manufacturer: string;
  partNumber: string;
  package: string;
  health: number;
  rulHours?: number;
  materialContribution?: string;
  repairStatus?: string;
  confidence: number;
  evidenceLevel: EvidenceLevel;
}

export interface IDigitalPassport {
  passportId: string;
  analysisId: string;
  assetId: string;
  assetType: AssetType;
  organizationId?: string;

  status: PassportStatus;
  version: number;

  identity: {
    assetName: string;
    assetType: AssetType;
    manufacturer: string;
    model: string;
    serialNumber: string;
    partNumber: string;
    boardRevision: string;
    manufacturingDate?: string;
    countryOfOrigin: string;
    organization: string;
    analysisId: string;
  };

  technicalProfile: {
    boardDimensions?: {
      widthMm: number;
      heightMm: number;
      thicknessMm: number;
      source: string;
      evidenceLevel: EvidenceLevel;
    };
    boardAreaCm2?: {
      value: number;
      source: string;
      evidenceLevel: EvidenceLevel;
    };
    estimatedLayers?: {
      value: number;
      source: string;
      evidenceLevel: EvidenceLevel;
    };
    componentCount?: {
      value: number;
      source: string;
      evidenceLevel: EvidenceLevel;
    };
    traceCount?: {
      value: number;
      source: string;
      evidenceLevel: EvidenceLevel;
    };
    padCount?: {
      value: number;
      source: string;
      evidenceLevel: EvidenceLevel;
    };
    viaCount?: {
      value: number;
      source: string;
      evidenceLevel: EvidenceLevel;
    };
    connectorCount?: {
      value: number;
      source: string;
      evidenceLevel: EvidenceLevel;
    };
    detectedComponentCategories?: {
      value: string[];
      source: string;
      evidenceLevel: EvidenceLevel;
    };
    pcbType?: {
      value: string;
      source: string;
      evidenceLevel: EvidenceLevel;
    };
    visualCondition?: {
      value: string;
      source: string;
      evidenceLevel: EvidenceLevel;
    };
    topologyInformation?: Record<string, any>;
  };

  componentSummary: IComponentSummaryItem[];

  healthSummary: {
    healthScore: number;
    healthStatus: string;
    riskLevel: string;
    healthConfidence: number;
    predictionTimestamp: Date;
    modelVersion: string;
    source: string;
    evidenceLevel: EvidenceLevel;
    isPhysicalCertification: boolean;
  };

  rulSummary: {
    estimatedRUL: number;
    unit: "HOURS" | "YEARS";
    lowerBound: number;
    upperBound: number;
    confidence: number;
    dataCompleteness: number;
    modelVersion: string;
    label: string;
    isExactLifetime: boolean;
  };

  materialSummary: {
    estimatedMaterialMassGrams: number;
    recoverableMaterialMassGrams: number;
    preciousMetals: Array<{
      element: string;
      massGrams: number;
      recoverableGrams: number;
      confidence: number;
      evidenceLevel: EvidenceLevel;
    }>;
    baseMetals: Array<{
      element: string;
      massGrams: number;
      recoverableGrams: number;
      confidence: number;
      evidenceLevel: EvidenceLevel;
    }>;
    criticalMaterials: Array<{
      element: string;
      massGrams: number;
      recoverableGrams: number;
      confidence: number;
      evidenceLevel: EvidenceLevel;
    }>;
    materialConfidence: number;
    evidenceLevel: EvidenceLevel;
  };

  repairSummary: {
    repairStatus:
      | "NO_REPAIR_REQUIRED"
      | "RECOMMENDED"
      | "IN_PROGRESS"
      | "COMPLETED"
      | "FAILED"
      | "NOT_ASSESSED";
    recommendedActions: string[];
    performedActions: Array<{
      action: string;
      technician: string;
      timestamp: Date;
      evidence?: string;
    }>;
    repairConfidence: number;
    repairDate?: Date;
    technician?: string;
    beforeHealth?: number;
    afterHealth?: number;
  };

  lifecycleEvents: IPassportEvent[];

  ownershipHistory: {
    currentOwner: string;
    previousOwner?: string;
    transfers: Array<{
      from: string;
      to: string;
      timestamp: Date;
      authorizedBy: string;
      reason: string;
      verificationStatus: string;
    }>;
  };

  verification: {
    contentHash: string;
    previousVersionHash?: string;
    canonicalVersion: string;
    verificationStatus: VerificationStatus;
    lastVerifiedAt?: Date;
  };

  blockchain: {
    provider: "MOCK" | "POLYGON";
    network: string;
    chainId?: string;
    contractAddress?: string;
    transactionHash?: string;
    blockNumber?: number;
    anchoredHash?: string;
    status: BlockchainStatus;
    anchoredAt?: Date;
    explorerUrl?: string;
    anchorPolicy?: "manual" | "automatic" | "disabled";
    isSimulated: boolean;
  };

  documents: IPassportDocument[];
  metadata: Record<string, any>;
  provenance: IDataProvenance[];
  versionHistory: IPassportVersionSnapshot[];

  // Backward compatibility fields
  componentId?: string;
  deviceOrigin?: string;
  recoveryDate?: Date;
  healthScore?: number;
  estimatedRUL?: {
    hours: number;
    years: number;
  };
  repairHistory?: Array<{
    date: Date;
    action: string;
    technician: string;
  }>;
  reuseCount?: number;
  blockchainStatus?: BlockchainStatus;
  statusLabel?: string;
  network?: string;
  contractAddress?: string;
  tokenId?: string;
  transactionHash?: string;
  verificationUrl?: string;
  qrCode?: string;
  ipfsHash?: string;
  provider?: "MOCK" | "POLYGON";

  createdAt?: Date;
  updatedAt?: Date;
}

const DataProvenanceSchema = new Schema<IDataProvenance>(
  {
    field: { type: String, required: true },
    sourceType: { type: String, required: true },
    sourceId: { type: String, required: true },
    sourceVersion: { type: String },
    evidenceLevel: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PassportEventSchema = new Schema<IPassportEvent>(
  {
    eventId: { type: String, required: true },
    passportId: { type: String, required: true },
    eventType: {
      type: String,
      required: true,
      enum: [
        "CREATED",
        "ANALYZED",
        "INSPECTED",
        "REPAIRED",
        "REFURBISHED",
        "TRANSFERRED",
        "LISTED",
        "RESERVED",
        "SOLD",
        "LISTING_ARCHIVED",
        "RECOVERED",
        "RECYCLED",
        "REUSED",
        "RETIRED",
        "REVOKED",
        "CORRECTION_ISSUED",
      ],
    },
    actor: { type: String, required: true },
    organization: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    location: { type: String },
    description: { type: String, required: true },
    evidence: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
    contentHash: { type: String, required: true },
    blockchainStatus: { type: String },
    blockchainTxHash: { type: String },
  },
  { _id: false }
);

const PassportVersionSnapshotSchema = new Schema<IPassportVersionSnapshot>(
  {
    version: { type: Number, required: true },
    contentHash: { type: String, required: true },
    previousVersionHash: { type: String },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String, required: true },
    changeSummary: { type: String, required: true },
  },
  { _id: false }
);

const PassportDocumentSchema = new Schema<IPassportDocument>(
  {
    documentId: { type: String, required: true },
    documentName: { type: String, required: true },
    documentType: {
      type: String,
      required: true,
      enum: [
        "INSPECTION_REPORT",
        "REPAIR_REPORT",
        "MATERIAL_REPORT",
        "MANUFACTURER_DOC",
        "DATASHEET",
        "CERTIFICATE",
        "IMAGE_EVIDENCE",
        "OTHER",
      ],
    },
    storageReference: { type: String, required: true },
    documentHash: { type: String, required: true },
    uploadedBy: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ComponentSummaryItemSchema = new Schema<IComponentSummaryItem>(
  {
    componentId: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    manufacturer: { type: String, default: "UNKNOWN" },
    partNumber: { type: String, default: "UNKNOWN" },
    package: { type: String, default: "UNKNOWN" },
    health: { type: Number, default: 100 },
    rulHours: { type: Number },
    materialContribution: { type: String },
    repairStatus: { type: String, default: "NOT_ASSESSED" },
    confidence: { type: Number, default: 0.9 },
    evidenceLevel: { type: String, default: "AI_ESTIMATED" },
  },
  { _id: false }
);

const DigitalPassportSchema = new Schema<IDigitalPassport>(
  {
    passportId: { type: String, required: true, unique: true, index: true },
    analysisId: { type: String, required: true, index: true },
    assetId: { type: String, required: true, index: true },
    assetType: {
      type: String,
      required: true,
      enum: [
        "PCB",
        "ELECTRONIC_DEVICE",
        "COMPONENT",
        "RECOVERED_COMPONENT",
        "REFURBISHED_DEVICE",
        "REPAIRED_DEVICE",
      ],
      default: "PCB",
      index: true,
    },
    organizationId: { type: String, index: true },

    status: {
      type: String,
      required: true,
      enum: [
        "CREATED",
        "ACTIVE",
        "UPDATED",
        "TRANSFERRED",
        "REPAIRED",
        "REFURBISHED",
        "RECOVERED",
        "RECYCLED",
        "RETIRED",
        "REVOKED",
      ],
      default: "CREATED",
      index: true,
    },
    version: { type: Number, default: 1 },

    identity: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },

    technicalProfile: {
      type: Schema.Types.Mixed,
      default: {},
    },

    componentSummary: {
      type: [ComponentSummaryItemSchema],
      default: [],
    },

    healthSummary: {
      type: Schema.Types.Mixed,
      default: {},
    },

    rulSummary: {
      type: Schema.Types.Mixed,
      default: {},
    },

    materialSummary: {
      type: Schema.Types.Mixed,
      default: {},
    },

    repairSummary: {
      type: Schema.Types.Mixed,
      default: {
        repairStatus: "NOT_ASSESSED",
        recommendedActions: [],
        performedActions: [],
        repairConfidence: 0,
      },
    },

    lifecycleEvents: {
      type: [PassportEventSchema],
      default: [],
    },

    ownershipHistory: {
      type: Schema.Types.Mixed,
      default: {
        currentOwner: "UNKNOWN",
        transfers: [],
      },
    },

    verification: {
      type: Schema.Types.Mixed,
      default: {
        contentHash: "",
        canonicalVersion: "1.0",
        verificationStatus: "NOT_ANCHORED",
      },
    },

    blockchain: {
      type: Schema.Types.Mixed,
      default: {
        provider: "MOCK",
        network: "Demo Blockchain Network",
        status: "NONE",
        isSimulated: true,
      },
    },

    documents: {
      type: [PassportDocumentSchema],
      default: [],
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    provenance: {
      type: [DataProvenanceSchema],
      default: [],
    },

    versionHistory: {
      type: [PassportVersionSnapshotSchema],
      default: [],
    },

    // Backward compatibility fields
    componentId: { type: String },
    deviceOrigin: { type: String, default: "UNKNOWN" },
    recoveryDate: { type: Date, default: Date.now },
    healthScore: { type: Number, default: 94 },
    estimatedRUL: {
      hours: { type: Number, default: 42000 },
      years: { type: Number, default: 4.8 },
    },
    repairHistory: { type: Schema.Types.Mixed, default: [] },
    reuseCount: { type: Number, default: 1 },
    blockchainStatus: {
      type: String,
      enum: ["NONE", "PENDING", "CONFIRMED", "FAILED", "SIMULATED", "READY", "MINTED", "VERIFIED"],
      default: "READY",
    },
    statusLabel: { type: String, default: "Passport Ready" },
    network: { type: String, default: "Demo Blockchain Network" },
    contractAddress: { type: String },
    tokenId: { type: String },
    transactionHash: { type: String },
    verificationUrl: { type: String },
    qrCode: { type: String },
    ipfsHash: { type: String },
    provider: {
      type: String,
      enum: ["MOCK", "POLYGON"],
      default: "MOCK",
    },
  },
  { timestamps: true }
);

// Search indexes
DigitalPassportSchema.index({ organizationId: 1, status: 1 });
DigitalPassportSchema.index({ "identity.serialNumber": 1 });
DigitalPassportSchema.index({ "identity.partNumber": 1 });


export const DigitalPassport: Model<IDigitalPassport> =
  mongoose.models.DigitalPassport ||
  mongoose.model<IDigitalPassport>("DigitalPassport", DigitalPassportSchema);

export default DigitalPassport;
