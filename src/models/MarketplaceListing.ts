import mongoose, { Schema, Document, Model } from "mongoose";
import {
  ListingCondition,
  ListingVerificationStatus,
  ListingStatus,
  PricingType,
  Currency,
  AssetType,
  IListingHealthSummary,
  IListingRULSummary,
  IListingMaterialSummary,
  IListingRepairSummary,
  IListingPassportSummary,
  IListingEvidenceDocument,
  IListingLocation,
  IListingShipping,
  IListingPrice,
} from "@/lib/marketplace/marketplaceTaxonomy";

export interface IMarketplaceListing extends Document {
  listingId: string;
  sellerOrganizationId: string;
  sellerUserId: string;

  assetType: AssetType;
  componentId?: string;
  analysisId?: string;
  passportId?: string;

  title: string;
  description: string;
  category: string;
  subcategory?: string;

  manufacturer: string;
  partNumber: string;
  packageType: string;

  quantity: number;
  quantityAvailable: number;
  quantityReserved: number;
  quantitySold: number;

  condition: ListingCondition;
  verificationStatus: ListingVerificationStatus;

  healthSummary?: IListingHealthSummary;
  rulSummary?: IListingRULSummary;
  materialSummary?: IListingMaterialSummary;
  repairSummary?: IListingRepairSummary;
  passportSummary?: IListingPassportSummary;

  technicalSpecifications: Record<string, string>;
  evidence: Array<{
    type: string;
    description: string;
    source: string;
    confidence?: number;
    hash?: string;
  }>;
  images: string[];
  documents: IListingEvidenceDocument[];

  price: any;
  currency?: string;
  pricingType?: string;
  isDeleted?: boolean;
  adminReview?: {
    notes?: string;
    reviewedBy?: string;
    reviewedAt?: Date;
  };
  minimumOrderQuantity: number;

  location: IListingLocation;
  shipping: IListingShipping;

  listingStatus: ListingStatus;
  moderationNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  publishedAt?: Date;

  // Backward compatibility fields
  sellerId?: string;
  priceINR?: number;
  priceUSD?: number;
  status?: string;

  createdAt: Date;
  updatedAt: Date;
}

const MarketplaceListingSchema = new Schema<IMarketplaceListing>(
  {
    listingId: { type: String, required: true, unique: true, index: true },
    sellerOrganizationId: { type: String, required: true, index: true },
    sellerUserId: { type: String, required: true, index: true },

    assetType: {
      type: String,
      enum: ["COMPONENT", "PCB", "MODULE", "RAW_MATERIAL"],
      default: "COMPONENT",
      index: true,
    },
    componentId: { type: String, index: true },
    analysisId: { type: String, index: true },
    passportId: { type: String, index: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, required: true, index: true },
    subcategory: { type: String },

    manufacturer: { type: String, required: true, index: true },
    partNumber: { type: String, required: true, index: true },
    packageType: { type: String, default: "SMD" },

    quantity: { type: Number, required: true, min: 1 },
    quantityAvailable: { type: Number, required: true, min: 0 },
    quantityReserved: { type: Number, default: 0, min: 0 },
    quantitySold: { type: Number, default: 0, min: 0 },

    condition: {
      type: String,
      enum: [
        "NEW",
        "USED_TESTED",
        "USED_UNTESTED",
        "REFURBISHED",
        "REPAIRED",
        "FOR_REPAIR",
        "FOR_PARTS",
        "MATERIAL_RECOVERY",
        "UNKNOWN",
      ],
      default: "USED_TESTED",
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: [
        "PASSPORT_VERIFIED",
        "PASSPORT_AVAILABLE",
        "TECHNICALLY_ASSESSED",
        "SELLER_DECLARED",
        "UNVERIFIED",
        "DEMO",
      ],
      default: "UNVERIFIED",
      index: true,
    },

    healthSummary: {
      healthScore: { type: Number },
      healthStatus: { type: String },
      failureRisk: { type: String },
      dataCompleteness: { type: Number },
      confidence: { type: Number },
      assessedAt: { type: Date },
      isSimulated: { type: Boolean, default: false },
    },
    rulSummary: {
      estimatedRULHours: { type: Number },
      estimatedRULYears: { type: Number },
      confidence: { type: Number },
      isSimulated: { type: Boolean, default: false },
    },
    materialSummary: {
      preciousMetals: [
        {
          metal: { type: String },
          estimatedMassGrams: { type: Number },
          presence: { type: String },
        },
      ],
      totalMaterialMassGrams: { type: Number },
      primaryRecoverableMetal: { type: String },
      recoveryPriority: { type: String },
    },
    repairSummary: {
      repairStatus: { type: String },
      repairability: { type: String },
      completedActionsCount: { type: Number },
      lastAction: { type: String },
      functionalTestResult: { type: String },
      completedAt: { type: Date },
    },
    passportSummary: {
      passportId: { type: String },
      version: { type: Number },
      verificationStatus: { type: String },
      contentHash: { type: String },
      blockchainNetwork: { type: String },
      qrCodeUrl: { type: String },
    },

    technicalSpecifications: { type: Map, of: String, default: {} },
    evidence: [
      {
        type: { type: String },
        description: { type: String },
        source: { type: String },
        confidence: { type: Number },
        hash: { type: String },
      },
    ],
    images: { type: [String], default: [] },
    documents: [
      {
        documentId: { type: String },
        title: { type: String },
        url: { type: String },
        hash: { type: String },
        type: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    price: {
      amount: { type: Number },
      currency: { type: String, enum: ["INR", "USD", "EUR"], default: "INR" },
      pricingType: {
        type: String,
        enum: ["FIXED_PRICE", "REQUEST_QUOTE"],
        default: "FIXED_PRICE",
      },
      isDemo: { type: Boolean, default: false },
    },
    minimumOrderQuantity: { type: Number, default: 1 },

    location: {
      city: { type: String, default: "Bangalore" },
      region: { type: String, default: "Karnataka" },
      country: { type: String, default: "India" },
      isExactHidden: { type: Boolean, default: true },
    },
    shipping: {
      methods: { type: [String], default: ["Standard Ground Express"] },
      estimatedLeadDays: { type: Number, default: 3 },
      shipsInternational: { type: Boolean, default: true },
      freeShipping: { type: Boolean, default: false },
    },

    listingStatus: {
      type: String,
      enum: [
        "DRAFT",
        "PENDING_REVIEW",
        "PUBLISHED",
        "RESERVED",
        "SOLD",
        "UNAVAILABLE",
        "EXPIRED",
        "REJECTED",
        "ARCHIVED",
      ],
      default: "DRAFT",
      index: true,
    },
    moderationNotes: { type: String },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    publishedAt: { type: Date },
    currency: { type: String, default: "INR" },
    pricingType: { type: String, default: "FIXED_PRICE" },
    isDeleted: { type: Boolean, default: false, index: true },
    adminReview: {
      notes: { type: String },
      reviewedBy: { type: String },
      reviewedAt: { type: Date },
    },

    // Backward compatibility
    sellerId: { type: String },
    priceINR: { type: Number },
    priceUSD: { type: Number },
    status: { type: String },
  },
  { timestamps: true }
);

// Search Indexes
MarketplaceListingSchema.index({
  title: "text",
  description: "text",
  partNumber: "text",
  manufacturer: "text",
  category: "text",
});
MarketplaceListingSchema.index({ listingStatus: 1, category: 1 });
MarketplaceListingSchema.index({ listingStatus: 1, manufacturer: 1 });
MarketplaceListingSchema.index({ listingStatus: 1, condition: 1 });
MarketplaceListingSchema.index({ listingStatus: 1, verificationStatus: 1 });
MarketplaceListingSchema.index({ listingStatus: 1, "price.amount": 1 });
MarketplaceListingSchema.index({ sellerOrganizationId: 1, listingStatus: 1 });

export const MarketplaceListing: Model<IMarketplaceListing> =
  mongoose.models.MarketplaceListing ||
  mongoose.model<IMarketplaceListing>("MarketplaceListing", MarketplaceListingSchema);

export default MarketplaceListing;
