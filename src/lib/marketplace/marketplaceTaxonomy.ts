/**
 * EcoIntel Phase 8: Circular Electronics Marketplace Taxonomy & Types
 * Strictly typed data contracts for circular hardware exchange & provenance
 */

export type ListingCondition =
  | "NEW"
  | "USED_TESTED"
  | "USED_UNTESTED"
  | "REFURBISHED"
  | "REPAIRED"
  | "FOR_REPAIR"
  | "FOR_PARTS"
  | "MATERIAL_RECOVERY"
  | "UNKNOWN";

export type ListingVerificationStatus =
  | "PASSPORT_VERIFIED"
  | "PASSPORT_AVAILABLE"
  | "TECHNICALLY_ASSESSED"
  | "SELLER_DECLARED"
  | "UNVERIFIED"
  | "DEMO";

export type ListingStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "PUBLISHED"
  | "RESERVED"
  | "SOLD"
  | "UNAVAILABLE"
  | "EXPIRED"
  | "REJECTED"
  | "ARCHIVED";

export type PricingType = "FIXED_PRICE" | "REQUEST_QUOTE";

export type Currency = "INR" | "USD" | "EUR";

export type AssetType = "COMPONENT" | "PCB" | "MODULE" | "RAW_MATERIAL";

export type ReservationStatus = "ACTIVE" | "EXPIRED" | "CANCELLED" | "CONVERTED";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "DISPUTED";

export type PaymentStatus =
  | "REQUEST_QUOTE"
  | "PAYMENT_PENDING"
  | "COMPLETED"
  | "REFUNDED"
  | "FAILED";

export type FulfillmentStatus =
  | "UNFULFILLED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED"
  | "RETURNED";

export type QuoteStatus = "OPEN" | "RESPONDED" | "ACCEPTED" | "REJECTED" | "EXPIRED";

export type ReportReason =
  | "INCORRECT_INFORMATION"
  | "COUNTERFEIT"
  | "DAMAGED"
  | "MISREPRESENTED_CONDITION"
  | "UNAUTHORIZED_LISTING"
  | "SAFETY_CONCERN"
  | "OTHER";

export interface IListingHealthSummary {
  healthScore?: number;
  healthStatus?: string;
  failureRisk?: string;
  dataCompleteness?: number;
  confidence?: number;
  assessedAt?: Date;
  isSimulated?: boolean;
}

export interface IListingRULSummary {
  estimatedRULHours?: number;
  estimatedRulYears?: number;
  estimatedRULYears?: number;
  confidence?: number;
  isSimulated?: boolean;
}

export interface IListingMaterialSummary {
  preciousMetals?: Array<{
    metal: string;
    estimatedMassGrams: number;
    presence: string;
  }>;
  totalMaterialMassGrams?: number;
  primaryRecoverableMetal?: string;
  recoveryPriority?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE" | "UNKNOWN";
}

export interface IListingRepairSummary {
  repairStatus?: string;
  repairability?: string;
  completedActionsCount?: number;
  lastAction?: string;
  functionalTestResult?: "PASS" | "FAIL" | "NOT_PERFORMED";
  completedAt?: Date;
}

export interface IListingPassportSummary {
  passportId: string;
  version: number;
  verificationStatus: string;
  contentHash?: string;
  blockchainNetwork?: string;
  qrCodeUrl?: string;
}

export interface IListingEvidenceDocument {
  documentId: string;
  title: string;
  url: string;
  hash?: string;
  type: string;
  uploadedAt: Date;
}

export interface IListingLocation {
  city: string;
  region: string;
  country: string;
  isExactHidden: boolean;
}

export interface IListingShipping {
  methods: string[];
  estimatedLeadDays: number;
  shipsInternational: boolean;
  freeShipping?: boolean;
}

export interface IListingPrice {
  amount?: number;
  currency: Currency;
  pricingType: PricingType;
  isDemo?: boolean;
}

export const CANONICAL_CATEGORIES = [
  "ICs",
  "Microcontrollers",
  "Microprocessors",
  "Memory",
  "Sensors",
  "Connectors",
  "Capacitors",
  "Resistors",
  "Diodes",
  "Transistors",
  "MOSFETs",
  "Inductors",
  "Power Components",
  "Modules",
  "PCBs",
  "Displays",
  "Motors",
  "Relays",
  "Recovered Boards",
  "Refurbished Components",
  "Material Recovery",
  "Other Electronics",
] as const;

export const PRODUCT_CATEGORIES = CANONICAL_CATEGORIES;
export type ProductCategory = (typeof CANONICAL_CATEGORIES)[number];
export type ComponentCategory = ProductCategory;

export const LISTING_CONDITIONS = [
  "NEW",
  "USED_TESTED",
  "USED_UNTESTED",
  "REFURBISHED",
  "REPAIRED",
  "FOR_REPAIR",
  "FOR_PARTS",
  "MATERIAL_RECOVERY",
  "UNKNOWN",
] as const;

export const PRICING_TYPES = ["FIXED_PRICE", "REQUEST_QUOTE"] as const;

export const CURRENCIES = ["INR", "USD", "EUR"] as const;

export type VerificationStatus = ListingVerificationStatus;

export type ListingSortOption =
  | "NEWEST"
  | "OLDEST"
  | "HEALTH_DESC"
  | "RUL_DESC"
  | "QUANTITY_DESC"
  | "PRICE_ASC"
  | "PRICE_DESC"
  | "VERIFICATION_TIER"
  | "RELEVANCE";

