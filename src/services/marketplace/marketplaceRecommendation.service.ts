import { MarketplaceListing, IMarketplaceListing } from "@/models/MarketplaceListing";

export interface RecommendationMatch {
  listing: IMarketplaceListing;
  matchReason: "EXACT_PART_NUMBER" | "SAME_FAMILY_MANUFACTURER" | "COMPATIBLE_PACKAGE" | "SIMILAR_CATEGORY";
  similarityScore: number;
}

export class MarketplaceRecommendationService {
  /**
   * Recommends circular components based strictly on factual attributes
   * (manufacturer, part number prefix/family, package type, category).
   * Does NOT hallucinate synthetic component compatibilities.
   */
  public static async getRecommendations(
    listingId: string,
    limit = 4
  ): Promise<RecommendationMatch[]> {
    const target = await MarketplaceListing.findOne({ listingId }).lean();
    if (!target) {
      return [];
    }

    const matches: RecommendationMatch[] = [];

    // 1. Same part number from other sellers/refurbishers (Alternative sources)
    if (target.partNumber && target.partNumber !== "UNKNOWN") {
      const exactMatches = await MarketplaceListing.find({
        listingId: { $ne: listingId },
        listingStatus: "PUBLISHED",
        partNumber: new RegExp(`^${target.partNumber.trim()}$`, "i"),
        isDeleted: { $ne: true },
      })
        .limit(limit)
        .lean();

      for (const m of exactMatches) {
        matches.push({
          listing: m as unknown as IMarketplaceListing,
          matchReason: "EXACT_PART_NUMBER",
          similarityScore: 1.0,
        });
      }
    }

    // 2. Same manufacturer and category (e.g. STMicroelectronics Microcontrollers)
    if (matches.length < limit && target.manufacturer && target.manufacturer !== "UNKNOWN") {
      const existingIds = [listingId, ...matches.map((m) => m.listing.listingId)];
      const familyMatches = await MarketplaceListing.find({
        listingId: { $nin: existingIds },
        listingStatus: "PUBLISHED",
        manufacturer: new RegExp(`^${target.manufacturer.trim()}$`, "i"),
        category: target.category,
        isDeleted: { $ne: true },
      })
        .limit(limit - matches.length)
        .lean();

      for (const m of familyMatches) {
        matches.push({
          listing: m as unknown as IMarketplaceListing,
          matchReason: "SAME_FAMILY_MANUFACTURER",
          similarityScore: 0.8,
        });
      }
    }

    // 3. Same package type in the same category (e.g. LQFP-64 or 0805 SMD)
    if (matches.length < limit && target.packageType && target.packageType !== "UNKNOWN") {
      const existingIds = [listingId, ...matches.map((m) => m.listing.listingId)];
      const pkgMatches = await MarketplaceListing.find({
        listingId: { $nin: existingIds },
        listingStatus: "PUBLISHED",
        category: target.category,
        packageType: new RegExp(`^${target.packageType.trim()}$`, "i"),
        isDeleted: { $ne: true },
      })
        .limit(limit - matches.length)
        .lean();

      for (const m of pkgMatches) {
        matches.push({
          listing: m as unknown as IMarketplaceListing,
          matchReason: "COMPATIBLE_PACKAGE",
          similarityScore: 0.6,
        });
      }
    }

    return matches.slice(0, limit);
  }
}
