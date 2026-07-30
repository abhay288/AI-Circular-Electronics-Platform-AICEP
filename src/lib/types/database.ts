/* ============================================================
   ECOINTEL ENTERPRISE DATABASE & DATA MODELS (MongoDB / TypeScript)
   High-Precision Schemas for Circular Electronics Intelligence
   ============================================================ */

export interface UserSchema {
  _id: string;
  email: string;
  name: string;
  role: "RECYCLER" | "OEM_MANUFACTURER" | "REPAIR_CENTER" | "RESEARCHER" | "ADMIN";
  facilityName?: string;
  facilityLocation?: string;
  polygonWalletAddress?: string;
  apiKeys: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ComponentSchema {
  _id: string;
  partNumber: string;
  name: string;
  category: "IC_CHIP" | "MICROCONTROLLER" | "CAPACITOR" | "MOSFET" | "GPU" | "RELAY" | "RESISTOR";
  packageType: "QFP" | "BGA" | "SOP" | "SMD" | "THROUGH_HOLE";
  manufacturer: string;
  spectroSpatialConfidence: number; // e.g. 0.992
  healthScore: number; // 0 - 100%
  remainingLifespanHours: number;
  remainingYears: number;
  siliconGrade: "A+" | "A" | "B" | "RECYCLE_ONLY";
  preciousMetalsYield: {
    goldGrams: number;
    silverGrams: number;
    copperGrams: number;
    palladiumGrams: number;
    estimatedValueUSD: number;
  };
  blockchainPassportId?: string;
  marketPriceUSD: number;
  status: "DETECTED" | "TESTED" | "PASSPORT_MINTED" | "LISTED" | "RECYCLED";
  createdAt: string;
}

export interface PCBSchema {
  _id: string;
  boardModel: string;
  serialNumber: string;
  layerCount: number;
  dimensionsMM: { width: number; height: number; thickness: number };
  detectedComponentsCount: number;
  severedTracesCount: number;
  reconstructionStatus: "SCANNING" | "TOPOLOGY_RECONSTRUCTED" | "CAD_GENERATED";
  gerberNetlistUrl?: string;
  kicadSchematicsUrl?: string;
  scannedAt: string;
}

export interface PredictionSchema {
  _id: string;
  componentId: string;
  operatingTempCelsius: number;
  inputVoltageVolts: number;
  operatingCycles: number;
  thermalStressFactor: number;
  predictedRULHours: number;
  predictedYears: number;
  physicsFailureProbability: number;
  simulatedAt: string;
}

export interface MarketplaceSchema {
  _id: string;
  componentId: string;
  sellerUserId: string;
  title: string;
  description: string;
  priceUSD: number;
  polygonTokenId: string;
  healthGrade: string;
  warrantyDays: number;
  isVerified: boolean;
  capsuleStatus: "AVAILABLE" | "ESCROW_LOCKED" | "SOLD";
  listedAt: string;
}

export interface BlockchainPassportSchema {
  _id: string;
  passportId: string; // e.g. ECO-PASSPORT-2026-9842
  polygonTransactionHash: string;
  tokenId: string;
  contractAddress: string;
  componentPartNumber: string;
  originFacility: string;
  mintedTimestamp: string;
  recyclingHistory: {
    stage: string;
    timestamp: string;
    location: string;
    verifiedBy: string;
  }[];
  co2OffsetKg: number;
  isVerified: boolean;
}

export interface RepairReportSchema {
  _id: string;
  boardSerialNumber: string;
  faultSummary: string;
  faultyComponentPartNumber: string;
  aiRecommendation: "REFLOW_SOLDER" | "REPLACE_COMPONENT" | "RECYCLE_PCB";
  estimatedRepairCostUSD: number;
  estimatedCO2SavingsKg: number;
  generatedAt: string;
}

export interface CarbonAnalyticsSchema {
  _id: string;
  facilityId: string;
  totalCO2PreventedTons: number;
  totalCleanEnergySavedGWh: number;
  componentsReusedCount: number;
  preciousMetalsRecoveredKg: number;
  landfillDiversionRatePercent: number;
  lastUpdated: string;
}

export interface TransactionSchema {
  _id: string;
  marketplaceListingId: string;
  buyerUserId: string;
  sellerUserId: string;
  amountUSD: number;
  polygonTxHash: string;
  escrowStatus: "PENDING" | "COMPLETED" | "REFUNDED";
  timestamp: string;
}
