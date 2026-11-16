import { MarketplaceListing, IMarketplaceListing } from "@/models/MarketplaceListing";
import {
  ListingCondition,
  VerificationStatus,
  ProductCategory,
  ListingSortOption,
} from "@/lib/marketplace/marketplaceTaxonomy";

export interface MarketplaceSearchParams {
  q?: string;
  category?: ProductCategory | string;
  condition?: ListingCondition | string;
  verificationStatus?: VerificationStatus | string;
  manufacturer?: string;
  packageType?: string;
  minHealthScore?: number;
  minRulYears?: number;
  maxPrice?: number;
  minPrice?: number;
  pricingType?: "FIXED_PRICE" | "REQUEST_QUOTE";
  currency?: string;
  materialCandidate?: string;
  country?: string;
  city?: string;
  inStockOnly?: boolean;
  hasPassport?: boolean;
  sortBy?: ListingSortOption;
  page?: number;
  limit?: number;
  // Role context
  organizationId?: string;
  isAdmin?: boolean;
}

export interface SearchFacets {
  categories: Array<{ _id: string; count: number }>;
  conditions: Array<{ _id: string; count: number }>;
  verificationStatuses: Array<{ _id: string; count: number }>;
  manufacturers: Array<{ _id: string; count: number }>;
}

export interface MarketplaceSearchResult {
  listings: Array<Partial<IMarketplaceListing>>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets: SearchFacets;
}

export class MarketplaceSearchService {
  /**
   * Search marketplace listings with rich circular electronics filtering and sorting.
   */
  public static async search(params: MarketplaceSearchParams): Promise<MarketplaceSearchResult> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 12));
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {
      isDeleted: { $ne: true },
    };

    // Public search only returns PUBLISHED (unless admin/owner query)
    if (!params.isAdmin) {
      query.listingStatus = "PUBLISHED";
    }

    // Keyword search across title, partNumber, manufacturer, description
    if (params.q && params.q.trim()) {
      const escaped = params.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      query.$or = [
        { title: regex },
        { partNumber: regex },
        { manufacturer: regex },
        { description: regex },
        { subcategory: regex },
      ];
    }

    if (params.category && params.category !== "ALL") {
      query.category = params.category;
    }

    if (params.condition && params.condition !== "ALL") {
      query.condition = params.condition;
    }

    if (params.verificationStatus && params.verificationStatus !== "ALL") {
      query.verificationStatus = params.verificationStatus;
    }

    if (params.manufacturer) {
      query.manufacturer = new RegExp(params.manufacturer.trim(), "i");
    }

    if (params.packageType) {
      query.packageType = new RegExp(params.packageType.trim(), "i");
    }

    if (params.pricingType) {
      query.pricingType = params.pricingType;
    }

    if (params.currency) {
      query.currency = params.currency;
    }

    if (params.inStockOnly) {
      query.quantityAvailable = { $gt: 0 };
    }

    if (params.hasPassport) {
      query.passportId = { $exists: true, $ne: "" };
    }

    if (params.country) {
      query["location.country"] = new RegExp(params.country.trim(), "i");
    }

    if (params.city) {
      query["location.city"] = new RegExp(params.city.trim(), "i");
    }

    // Health score filter (from Phase 4 assessment)
    if (typeof params.minHealthScore === "number" && !isNaN(params.minHealthScore)) {
      query["healthSummary.healthScore"] = { $gte: params.minHealthScore };
    }

    // RUL filter (from Phase 4 assessment)
    if (typeof params.minRulYears === "number" && !isNaN(params.minRulYears)) {
      query["rulSummary.estimatedRulYears"] = { $gte: params.minRulYears };
    }

    // Price range filters
    if (typeof params.minPrice === "number" || typeof params.maxPrice === "number") {
      query.price = {};
      if (typeof params.minPrice === "number" && !isNaN(params.minPrice)) {
        query.price.$gte = params.minPrice;
      }
      if (typeof params.maxPrice === "number" && !isNaN(params.maxPrice)) {
        query.price.$lte = params.maxPrice;
      }
    }

    // Material candidate filter (from Phase 5 recovery)
    if (params.materialCandidate) {
      query["materialSummary.preciousMetals.metal"] = new RegExp(params.materialCandidate.trim(), "i");
    }

    // Determine Sort options
    const sort: Record<string, 1 | -1> = {};
    switch (params.sortBy) {
      case "NEWEST":
        sort.createdAt = -1;
        break;
      case "OLDEST":
        sort.createdAt = 1;
        break;
      case "HEALTH_DESC":
        sort["healthSummary.healthScore"] = -1;
        break;
      case "RUL_DESC":
        sort["rulSummary.estimatedRulYears"] = -1;
        break;
      case "QUANTITY_DESC":
        sort.quantityAvailable = -1;
        break;
      case "PRICE_ASC":
        sort.price = 1;
        break;
      case "PRICE_DESC":
        sort.price = -1;
        break;
      case "VERIFICATION_TIER":
        sort.verificationStatus = 1;
        break;
      case "RELEVANCE":
      default:
        sort.createdAt = -1;
        break;
    }

    const [items, total, categoryFacets, conditionFacets, verificationFacets, manufacturerFacets] =
      await Promise.all([
        MarketplaceListing.find(query).sort(sort).skip(skip).limit(limit).lean(),
        MarketplaceListing.countDocuments(query),
        MarketplaceListing.aggregate([
          { $match: { listingStatus: "PUBLISHED", isDeleted: { $ne: true } } },
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 15 },
        ]),
        MarketplaceListing.aggregate([
          { $match: { listingStatus: "PUBLISHED", isDeleted: { $ne: true } } },
          { $group: { _id: "$condition", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        MarketplaceListing.aggregate([
          { $match: { listingStatus: "PUBLISHED", isDeleted: { $ne: true } } },
          { $group: { _id: "$verificationStatus", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        MarketplaceListing.aggregate([
          { $match: { listingStatus: "PUBLISHED", isDeleted: { $ne: true } } },
          { $group: { _id: "$manufacturer", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
      ]);

    // Apply location privacy to public results
    const sanitizedListings = items.map((doc: any) => {
      if (doc.location && doc.location.isExactHidden) {
        doc.location.streetAddress = undefined;
        doc.location.postalCode = undefined;
      }
      return doc;
    });

    return {
      listings: sanitizedListings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      facets: {
        categories: categoryFacets,
        conditions: conditionFacets,
        verificationStatuses: verificationFacets,
        manufacturers: manufacturerFacets,
      },
    };
  }

  /**
   * Aggregate high-level platform marketplace statistics.
   */
  public static async getMarketplaceStats(): Promise<{
    activeListings: number;
    componentsListed: number;
    componentsReused: number;
    verifiedPassports: number;
    refurbishedCount: number;
    materialRecoveryCount: number;
    totalOrganizations: number;
  }> {
    const [
      activeListings,
      inventorySums,
      verifiedPassports,
      refurbishedCount,
      materialRecoveryCount,
      orgs,
    ] = await Promise.all([
      MarketplaceListing.countDocuments({ listingStatus: "PUBLISHED", isDeleted: { $ne: true } }),
      MarketplaceListing.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        {
          $group: {
            _id: null,
            totalAvailable: { $sum: "$quantityAvailable" },
            totalSold: { $sum: "$quantitySold" },
          },
        },
      ]),
      MarketplaceListing.countDocuments({
        verificationStatus: "PASSPORT_VERIFIED",
        listingStatus: "PUBLISHED",
      }),
      MarketplaceListing.countDocuments({
        condition: { $in: ["REFURBISHED", "REPAIRED"] },
        listingStatus: "PUBLISHED",
      }),
      MarketplaceListing.countDocuments({
        condition: "MATERIAL_RECOVERY",
        listingStatus: "PUBLISHED",
      }),
      MarketplaceListing.distinct("sellerOrganizationId"),
    ]);

    const inventory = inventorySums[0] || { totalAvailable: 0, totalSold: 0 };

    return {
      activeListings,
      componentsListed: (inventory.totalAvailable || 0) + (inventory.totalSold || 0),
      componentsReused: inventory.totalSold || 0,
      verifiedPassports,
      refurbishedCount,
      materialRecoveryCount,
      totalOrganizations: orgs.length,
    };
  }
}
