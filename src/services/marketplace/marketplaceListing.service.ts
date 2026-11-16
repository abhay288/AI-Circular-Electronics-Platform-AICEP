import connectDB from "@/lib/db";
import MarketplaceListing, { IMarketplaceListing } from "@/models/MarketplaceListing";
import AnalysisSession from "@/models/AnalysisSession";
import Component from "@/models/Component";
import AuditLog from "@/models/AuditLog";
import { generateListingId } from "@/lib/id-generator";
import { marketplaceVerificationService } from "./marketplaceVerification.service";
import { DigitalPassportService } from "@/services/passport.service";
import {
  ListingStatus,
  ListingCondition,
  AssetType,
  Currency,
  PricingType,
} from "@/lib/marketplace/marketplaceTaxonomy";

export interface CreateListingDTO {
  analysisId?: string;
  componentId?: string;
  passportId?: string;
  assetType?: AssetType;
  title: string;
  description?: string;
  category: string;
  subcategory?: string;
  manufacturer: string;
  partNumber: string;
  packageType?: string;
  quantity: number;
  condition: ListingCondition;
  price?: {
    amount?: number;
    currency?: Currency;
    pricingType?: PricingType;
    isDemo?: boolean;
  };
  minimumOrderQuantity?: number;
  location?: {
    city?: string;
    region?: string;
    country?: string;
    isExactHidden?: boolean;
  };
  shipping?: {
    methods?: string[];
    estimatedLeadDays?: number;
    shipsInternational?: boolean;
    freeShipping?: boolean;
  };
  images?: string[];
  documents?: any[];
  technicalSpecifications?: Record<string, string>;
}

export interface UserContext {
  userId: string;
  organizationId?: string;
  role?: string;
}

export class MarketplaceListingService {
  private passportService = new DigitalPassportService();

  /**
   * Creates a draft listing with full validation of component ownership and technical provenance
   */
  async createDraft(dto: CreateListingDTO, user: UserContext): Promise<IMarketplaceListing> {
    await connectDB();

    const sellerOrg =
      user.organizationId || (user as any).sellerOrganizationId || "DEFAULT_ORG";
    const sellerUser =
      user.userId || (user as any).sellerUserId || "system_seller";

    // 1. Verify Component Ownership if analysisId is supplied
    let assessmentDetails: any = null;
    let passportId: string | undefined = dto.passportId;

    if (dto.analysisId && dto.componentId) {
      const session = await AnalysisSession.findOne({
        $or: [{ analysisId: dto.analysisId }, { sessionId: dto.analysisId }],
      });

      if (!session) {
        throw new Error(`Analysis session '${dto.analysisId}' not found.`);
      }

      // Organization Isolation Check
      if (
        user.role !== "ADMIN" &&
        session.organizationId &&
        user.organizationId &&
        String(session.organizationId) !== String(user.organizationId)
      ) {
        throw new Error("Forbidden: You cannot list hardware from an analysis owned by another organization.");
      }

      // Verify component exists and compute technical provenance
      assessmentDetails = await marketplaceVerificationService.assessComponentForListing(
        dto.analysisId,
        dto.componentId
      );

      passportId = assessmentDetails.passportSummary?.passportId || session.passportId || dto.passportId;
    }

    const listingId = generateListingId();
    const qty = Math.max(dto.quantity || 1, 1);

    const newListing = await MarketplaceListing.create({
      listingId,
      sellerOrganizationId: sellerOrg,
      sellerUserId: sellerUser,

      assetType: dto.assetType || "COMPONENT",
      componentId: dto.componentId,
      analysisId: dto.analysisId,
      passportId,

      title: dto.title.trim(),
      description: dto.description || "",
      category: dto.category || "ICs",
      subcategory: dto.subcategory,

      manufacturer: dto.manufacturer || assessmentDetails?.component?.manufacturer || "Generic",
      partNumber: dto.partNumber || assessmentDetails?.component?.partNumber || "N/A",
      packageType: dto.packageType || assessmentDetails?.component?.package || "SMD",

      quantity: qty,
      quantityAvailable: qty,
      quantityReserved: 0,
      quantitySold: 0,

      condition: dto.condition || assessmentDetails?.recommendedCondition || "USED_TESTED",
      verificationStatus: assessmentDetails?.verificationStatus || "UNVERIFIED",

      healthSummary: assessmentDetails?.healthSummary,
      rulSummary: assessmentDetails?.rulSummary,
      materialSummary: assessmentDetails?.materialSummary,
      repairSummary: assessmentDetails?.repairSummary,
      passportSummary: assessmentDetails?.passportSummary,

      technicalSpecifications: dto.technicalSpecifications || {},
      evidence: assessmentDetails?.warnings?.map((w: string) => ({
        type: "TELEMETRY_NOTICE",
        description: w,
        source: "AI_DIAGNOSTIC_ENGINE",
      })) || [],
      images: dto.images || [],
      documents: dto.documents || [],

      price: {
        amount: dto.price?.amount ?? 50,
        currency: dto.price?.currency || "INR",
        pricingType: dto.price?.pricingType || "FIXED_PRICE",
        isDemo: dto.price?.isDemo || false,
      },
      minimumOrderQuantity: dto.minimumOrderQuantity || 1,

      location: {
        city: dto.location?.city || "Bangalore",
        region: dto.location?.region || "Karnataka",
        country: dto.location?.country || "India",
        isExactHidden: dto.location?.isExactHidden ?? true,
      },
      shipping: {
        methods: dto.shipping?.methods || ["Standard Ground Express"],
        estimatedLeadDays: dto.shipping?.estimatedLeadDays || 3,
        shipsInternational: dto.shipping?.shipsInternational ?? true,
        freeShipping: dto.shipping?.freeShipping ?? false,
      },

      listingStatus: "DRAFT",

      // Backward compatibility fields
      sellerId: user.userId,
      priceINR: dto.price?.amount ?? 50,
      priceUSD: +((dto.price?.amount ?? 50) / 86.5).toFixed(2),
      status: "PENDING",
    });

    // Mark component as listed/eligible in database
    if (dto.analysisId && dto.componentId) {
      await Component.updateOne(
        { analysisId: dto.analysisId, $or: [{ serialNumber: dto.componentId }, { name: dto.componentId }] },
        { $set: { marketplaceEligible: true } }
      );
    }

    // Audit Log
    await AuditLog.create({
      analysisId: dto.analysisId,
      organizationId: sellerOrg,
      userId: user.userId,
      action: "LISTING_CREATED",
      resource: "MarketplaceListing",
      resourceId: listingId,
      metadata: {
        listingId,
        title: newListing.title,
        status: "DRAFT",
      },
      timestamp: new Date(),
    });

    return newListing;
  }

  /**
   * Updates an existing draft listing with organization isolation check
   */
  async updateDraft(
    listingId: string,
    updates: Partial<CreateListingDTO>,
    user: UserContext
  ): Promise<IMarketplaceListing> {
    await connectDB();

    const listing = await MarketplaceListing.findOne({ listingId });
    if (!listing) {
      throw new Error(`Listing '${listingId}' not found.`);
    }

    // Organization Isolation
    const userOrg = user.organizationId || (user as any).sellerOrganizationId;
    if (
      user.role !== "ADMIN" &&
      listing.sellerOrganizationId &&
      userOrg &&
      String(listing.sellerOrganizationId) !== String(userOrg)
    ) {
      throw new Error("Forbidden: You cannot modify a listing belonging to another organization.");
    }

    if (listing.listingStatus === "SOLD" || listing.listingStatus === "ARCHIVED") {
      throw new Error(`Cannot modify a listing in status '${listing.listingStatus}'.`);
    }

    // Apply updates
    if (updates.title) listing.title = updates.title.trim();
    if (updates.description !== undefined) listing.description = updates.description;
    if (updates.category) listing.category = updates.category;
    if (updates.subcategory !== undefined) listing.subcategory = updates.subcategory;
    if (updates.manufacturer) listing.manufacturer = updates.manufacturer;
    if (updates.partNumber) listing.partNumber = updates.partNumber;
    if (updates.packageType) listing.packageType = updates.packageType;
    if (updates.condition) listing.condition = updates.condition;
    if (updates.quantity !== undefined) {
      const delta = updates.quantity - listing.quantity;
      listing.quantity = updates.quantity;
      listing.quantityAvailable = Math.max(0, listing.quantityAvailable + delta);
    }
    if (updates.price !== undefined) {
      if (typeof updates.price === "number") {
        listing.price = {
          amount: updates.price,
          currency: listing.price?.currency || "INR",
          pricingType: listing.price?.pricingType || "FIXED_PRICE",
          isDemo: listing.price?.isDemo ?? false,
        };
        listing.priceINR = updates.price;
      } else {
        listing.price = {
          amount: updates.price.amount ?? listing.price.amount,
          currency: updates.price.currency || listing.price.currency,
          pricingType: updates.price.pricingType || listing.price.pricingType,
          isDemo: updates.price.isDemo ?? listing.price.isDemo,
        };
        listing.priceINR = listing.price.amount;
      }
    }
    if (updates.minimumOrderQuantity) listing.minimumOrderQuantity = updates.minimumOrderQuantity;
    if (updates.location) {
      listing.location = {
        city: updates.location.city || listing.location.city,
        region: updates.location.region || listing.location.region,
        country: updates.location.country || listing.location.country,
        isExactHidden: updates.location.isExactHidden ?? listing.location.isExactHidden,
      };
    }
    if (updates.shipping) {
      listing.shipping = {
        methods: updates.shipping.methods || listing.shipping.methods,
        estimatedLeadDays: updates.shipping.estimatedLeadDays || listing.shipping.estimatedLeadDays,
        shipsInternational: updates.shipping.shipsInternational ?? listing.shipping.shipsInternational,
        freeShipping: updates.shipping.freeShipping ?? listing.shipping.freeShipping,
      };
    }
    if (updates.images) listing.images = updates.images;

    await listing.save();

    await AuditLog.create({
      organizationId: listing.sellerOrganizationId,
      userId: user.userId,
      action: "LISTING_UPDATED",
      resource: "MarketplaceListing",
      resourceId: listingId,
      metadata: { listingId },
      timestamp: new Date(),
    });

    return listing;
  }

  /**
   * Submits a draft listing for administrative review
   */
  async submitForReview(listingId: string, user: UserContext): Promise<IMarketplaceListing> {
    await connectDB();

    const listing = await MarketplaceListing.findOne({ listingId });
    if (!listing) {
      throw new Error(`Listing '${listingId}' not found.`);
    }

    const userOrg = user.organizationId || (user as any).sellerOrganizationId;
    const userId = user.userId || (user as any).sellerUserId || "system_seller";

    if (
      user.role !== "ADMIN" &&
      listing.sellerOrganizationId &&
      userOrg &&
      String(listing.sellerOrganizationId) !== String(userOrg)
    ) {
      throw new Error("Forbidden: You cannot submit another organization's listing.");
    }

    if (!listing.title || !listing.category || listing.quantity <= 0) {
      throw new Error("Validation failure: Title, category, and valid quantity are required before submission.");
    }

    listing.listingStatus = "PENDING_REVIEW";
    listing.status = "PENDING";
    await listing.save();

    await AuditLog.create({
      organizationId: listing.sellerOrganizationId,
      userId,
      action: "LISTING_SUBMITTED",
      resource: "MarketplaceListing",
      resourceId: listingId,
      metadata: { listingId, status: "PENDING_REVIEW" },
      timestamp: new Date(),
    });

    return listing;
  }

  /**
   * Approves a listing and publishes it to the marketplace (Admin only)
   */
  async approveListing(
    listingId: string,
    adminUser: UserContext,
    notes?: string
  ): Promise<IMarketplaceListing> {
    await connectDB();

    const listing = await MarketplaceListing.findOne({ listingId });
    if (!listing) {
      throw new Error(`Listing '${listingId}' not found.`);
    }

    const reviewerUserId = adminUser.userId || (adminUser as any).reviewerUserId || "admin_reviewer";

    listing.listingStatus = "PUBLISHED";
    listing.status = "ACTIVE";
    listing.reviewedBy = reviewerUserId;
    listing.reviewedAt = new Date();
    listing.publishedAt = new Date();
    if (notes) listing.moderationNotes = notes;

    await listing.save();

    // Digital Passport Lifecycle Event Integration (Phase 7)
    if (listing.passportId) {
      try {
        await this.passportService.addLifecycleEvent(listing.passportId, {
          eventType: "LISTED",
          description: `Asset listed on Circular Marketplace. Listing ID: ${listingId}. Available quantity: ${listing.quantityAvailable}.`,
          actor: reviewerUserId,
          organization: listing.sellerOrganizationId,
          metadata: {
            listingId,
            price: listing.price,
            condition: listing.condition,
          },
        });
      } catch (err: any) {
        console.warn(`[MarketplaceListingService] Passport LISTED notice: ${err.message}`);
      }
    }

    await AuditLog.create({
      organizationId: listing.sellerOrganizationId,
      userId: reviewerUserId,
      action: "LISTING_APPROVED",
      resource: "MarketplaceListing",
      resourceId: listingId,
      metadata: { listingId, approvedBy: reviewerUserId },
      timestamp: new Date(),
    });

    return listing;
  }

  /**
   * Rejects a listing with explanation
   */
  async rejectListing(
    listingId: string,
    reason: string,
    adminUser: UserContext
  ): Promise<IMarketplaceListing> {
    await connectDB();

    const listing = await MarketplaceListing.findOne({ listingId });
    if (!listing) {
      throw new Error(`Listing '${listingId}' not found.`);
    }

    const reviewerUserId = adminUser.userId || (adminUser as any).reviewerUserId || "admin_reviewer";

    listing.listingStatus = "REJECTED";
    listing.status = "UNLISTED";
    listing.moderationNotes = reason;
    if (!listing.adminReview) listing.adminReview = {};
    listing.adminReview.notes = reason;
    listing.adminReview.reviewedBy = reviewerUserId;
    listing.adminReview.reviewedAt = new Date();
    listing.reviewedBy = reviewerUserId;
    listing.reviewedAt = new Date();

    await listing.save();

    await AuditLog.create({
      organizationId: listing.sellerOrganizationId,
      userId: reviewerUserId,
      action: "LISTING_REJECTED",
      resource: "MarketplaceListing",
      resourceId: listingId,
      metadata: { listingId, reason },
      timestamp: new Date(),
    });

    return listing;
  }

  /**
   * Directly publishes a listing if admin review is disabled
   */
  async publishListing(listingId: string, user: UserContext): Promise<IMarketplaceListing> {
    await connectDB();

    const listing = await MarketplaceListing.findOne({ listingId });
    if (!listing) {
      throw new Error(`Listing '${listingId}' not found.`);
    }

    const userOrg = user.organizationId || (user as any).sellerOrganizationId;
    const publisherUserId = user.userId || (user as any).sellerUserId || (user as any).publisherUserId || "publisher";

    if (
      user.role !== "ADMIN" &&
      listing.sellerOrganizationId &&
      userOrg &&
      String(listing.sellerOrganizationId) !== String(userOrg)
    ) {
      throw new Error("Forbidden: You cannot publish another organization's listing.");
    }

    listing.listingStatus = "PUBLISHED";
    listing.status = "ACTIVE";
    listing.publishedAt = new Date();
    await listing.save();

    if (listing.passportId) {
      try {
        await this.passportService.addLifecycleEvent(listing.passportId, {
          eventType: "LISTED",
          description: `Listed on Circular Electronics Exchange. Listing ID: ${listingId}.`,
          actor: publisherUserId,
          organization: listing.sellerOrganizationId,
          metadata: { listingId },
        });
      } catch (err: any) {
        console.warn(`[MarketplaceListingService] Passport LISTED notice: ${err.message}`);
      }
    }

    await AuditLog.create({
      organizationId: listing.sellerOrganizationId,
      userId: publisherUserId,
      action: "LISTING_PUBLISHED",
      resource: "MarketplaceListing",
      resourceId: listingId,
      metadata: { listingId },
      timestamp: new Date(),
    });

    return listing;
  }

  /**
   * Soft deletes and archives a listing
   */
  async archiveListing(listingId: string, user: UserContext): Promise<IMarketplaceListing> {
    await connectDB();

    const listing = await MarketplaceListing.findOne({ listingId });
    if (!listing) {
      throw new Error(`Listing '${listingId}' not found.`);
    }

    const userOrg = user.organizationId || (user as any).sellerOrganizationId;
    const archiveUserId = user.userId || (user as any).sellerUserId || "system";

    if (
      user.role !== "ADMIN" &&
      listing.sellerOrganizationId &&
      userOrg &&
      String(listing.sellerOrganizationId) !== String(userOrg)
    ) {
      throw new Error("Forbidden: You cannot archive another organization's listing.");
    }

    listing.listingStatus = "ARCHIVED";
    listing.status = "UNLISTED";
    listing.isDeleted = true;
    await listing.save();

    if (listing.passportId) {
      try {
        await this.passportService.addLifecycleEvent(listing.passportId, {
          eventType: "LISTING_ARCHIVED",
          description: `Marketplace listing ${listingId} archived and withdrawn from exchange.`,
          actor: archiveUserId,
          organization: listing.sellerOrganizationId,
        });
      } catch (err: any) {
        console.warn(`[MarketplaceListingService] Passport ARCHIVE notice: ${err.message}`);
      }
    }

    await AuditLog.create({
      organizationId: listing.sellerOrganizationId,
      userId: user.userId,
      action: "LISTING_ARCHIVED",
      resource: "MarketplaceListing",
      resourceId: listingId,
      metadata: { listingId },
      timestamp: new Date(),
    });

    return listing;
  }

  /**
   * Retrieves listing details with location privacy protections
   */
  async getListingById(
    listingId: string,
    viewerUser?: UserContext
  ): Promise<IMarketplaceListing | null> {
    await connectDB();

    const listing = await MarketplaceListing.findOne({
      $or: [{ listingId }, { _id: listingId.match(/^[0-9a-fA-F]{24}$/) ? listingId : null }],
    }).lean();

    if (!listing) return null;

    // Apply location privacy if hidden
    const isOwnerOrAdmin =
      viewerUser?.role === "ADMIN" ||
      (viewerUser?.organizationId &&
        String(viewerUser.organizationId) === String(listing.sellerOrganizationId));

    if (listing.location?.isExactHidden && !isOwnerOrAdmin) {
      listing.location = {
        city: listing.location.city,
        region: listing.location.region,
        country: listing.location.country,
        isExactHidden: true,
      };
    }

    return listing as any;
  }

  /**
   * Retrieves eligible components from an existing AnalysisSession for the listing wizard
   */
  async getEligibleComponentsFromAnalysis(analysisId: string, organizationId?: string) {
    await connectDB();

    const session = await AnalysisSession.findOne({
      $or: [{ analysisId }, { sessionId: analysisId }],
    });

    if (!session) {
      throw new Error(`AnalysisSession '${analysisId}' not found.`);
    }

    const components = await Component.find({ analysisId: session.analysisId }).lean();

    // Check each component eligibility
    const assessedList = await Promise.all(
      components.map(async (comp) => {
        try {
          const assessment = await marketplaceVerificationService.assessComponentForListing(
            session.analysisId,
            comp.serialNumber || String(comp._id)
          );
          return {
            componentId: comp.serialNumber || String(comp._id),
            name: comp.name,
            type: comp.type,
            manufacturer: comp.manufacturer,
            partNumber: comp.partNumber,
            package: comp.package,
            healthScore: comp.healthScore,
            estimatedRUL: comp.estimatedRUL,
            isEligible: assessment.isEligible,
            ineligibilityReason: assessment.ineligibilityReason,
            recommendedCondition: assessment.recommendedCondition,
            verificationStatus: assessment.verificationStatus,
            warnings: assessment.warnings,
          };
        } catch (e: any) {
          return {
            componentId: comp.serialNumber || String(comp._id),
            name: comp.name,
            type: comp.type,
            manufacturer: comp.manufacturer,
            partNumber: comp.partNumber,
            package: comp.package,
            healthScore: comp.healthScore,
            isEligible: true,
            recommendedCondition: "USED_TESTED" as const,
            verificationStatus: "UNVERIFIED" as const,
            warnings: [],
          };
        }
      })
    );

    return {
      analysisId: session.analysisId,
      deviceName: session.deviceName,
      passportId: session.passportId,
      totalComponents: components.length,
      eligibleComponents: assessedList,
    };
  }

  /**
   * Request changes on a pending listing
   */
  async requestChanges(
    listingId: string,
    input: { reviewerUserId?: string; notes: string } | string
  ): Promise<IMarketplaceListing> {
    await connectDB();
    const listing = await MarketplaceListing.findOne({ listingId });
    if (!listing) {
      throw new Error(`Listing '${listingId}' not found.`);
    }

    const notes = typeof input === "string" ? input : input.notes;
    const reviewerUserId = typeof input === "string" ? "admin" : input.reviewerUserId || "admin";

    listing.listingStatus = "PENDING_REVIEW";
    listing.moderationNotes = notes;
    if (!listing.adminReview) listing.adminReview = {};
    listing.adminReview.notes = notes;
    listing.adminReview.reviewedBy = reviewerUserId;
    listing.adminReview.reviewedAt = new Date();

    await listing.save();

    await AuditLog.create({
      organizationId: listing.sellerOrganizationId,
      userId: reviewerUserId,
      action: "LISTING_CHANGES_REQUESTED",
      resource: "MarketplaceListing",
      resourceId: listingId,
      metadata: { listingId, notes },
      timestamp: new Date(),
    });

    return listing;
  }

  // --- Static Convenience Methods ---
  static createDraft(dto: any, user: any) {
    return marketplaceListingService.createDraft(dto, user);
  }
  static updateDraft(listingId: string, updates: any, user: any) {
    return marketplaceListingService.updateDraft(listingId, updates, user);
  }
  static submitForReview(listingId: string, user: any) {
    return marketplaceListingService.submitForReview(listingId, user);
  }
  static approveListing(listingId: string, adminUser: any, notes?: string) {
    return marketplaceListingService.approveListing(
      listingId,
      typeof adminUser === "string" ? { userId: adminUser } : adminUser,
      notes
    );
  }
  static rejectListing(listingId: string, optsOrReason: any, adminUser?: any) {
    if (typeof optsOrReason === "string") {
      return marketplaceListingService.rejectListing(listingId, optsOrReason, adminUser || { userId: "admin" });
    }
    return marketplaceListingService.rejectListing(
      listingId,
      optsOrReason.rejectionReason,
      { userId: optsOrReason.reviewerUserId }
    );
  }
  static requestChanges(listingId: string, input: any) {
    return marketplaceListingService.requestChanges(listingId, input);
  }
  static publishListing(listingId: string, user: any) {
    return marketplaceListingService.publishListing(listingId, user);
  }
  static archiveListing(listingId: string, user: any) {
    return marketplaceListingService.archiveListing(listingId, user);
  }
  static getListingById(listingId: string, viewer?: any) {
    return marketplaceListingService.getListingById(listingId, viewer);
  }
  static getEligibleComponentsFromAnalysis(analysisId: string, orgId?: string) {
    return marketplaceListingService.getEligibleComponentsFromAnalysis(analysisId, orgId);
  }
}

export const marketplaceListingService = new MarketplaceListingService();
export default marketplaceListingService;

