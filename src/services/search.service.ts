import { connectDB } from "@/lib/db";
import { AnalysisSession } from "@/models/AnalysisSession";
import { Component } from "@/models/Component";
import { DigitalPassport } from "@/models/DigitalPassport";
import { MarketplaceListing } from "@/models/MarketplaceListing";
import { Report } from "@/models/Report";

export interface GlobalSearchResultItem {
  entityType: "ASSET" | "ANALYSIS" | "PASSPORT" | "COMPONENT" | "LISTING" | "REPORT";
  id: string;
  name: string;
  status: string;
  organization: string;
  lastUpdated: Date;
  url: string;
}

export class GlobalSearchService {
  /**
   * Searches across assets, analyses, passports, components, listings, and reports.
   */
  public static async search(
    query: string,
    organizationId?: string,
    limit: number = 20
  ): Promise<GlobalSearchResultItem[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    await connectDB();
    const cleanQ = query.trim();
    const regex = new RegExp(cleanQ, "i");
    const results: GlobalSearchResultItem[] = [];

    const orgFilter = organizationId && organizationId !== "all" ? { organizationId } : {};

    // 1. Search AnalysisSession & Assets
    const sessions = await AnalysisSession.find({
      ...orgFilter,
      $or: [
        { analysisId: regex },
        { deviceName: regex },
        { deviceType: regex },
        { "metadata.manufacturer": regex },
        { "metadata.assetId": regex },
      ],
    })
      .limit(limit)
      .lean();

    for (const s of sessions) {
      const assetIdentifier = (s.metadata as any)?.assetId || s.analysisId;
      results.push({
        entityType: "ANALYSIS",
        id: s.analysisId,
        name: s.deviceName || assetIdentifier,
        status: s.status,
        organization: String(s.organizationId || "org-default"),
        lastUpdated: (s as any).updatedAt || (s as any).createdAt || new Date(),
        url: `/console/results?analysisId=${s.analysisId}`,
      });
    }

    // 2. Search Passports
    const passports = await DigitalPassport.find({
      ...orgFilter,
      $or: [
        { passportId: regex },
        { assetId: regex },
        { "identity.model": regex },
        { "identity.serialNumber": regex },
        { "identity.assetName": regex },
      ],
    })
      .limit(limit)
      .lean();

    for (const p of passports) {
      results.push({
        entityType: "PASSPORT",
        id: p.passportId,
        name: p.identity?.assetName || p.identity?.model || p.passportId,
        status: p.status,
        organization: p.organizationId || "org-default",
        lastUpdated: (p as any).updatedAt || (p as any).createdAt || new Date(),
        url: `/passport/${p.passportId}`,
      });
    }

    // 3. Search Components
    const components = await Component.find({
      $or: [
        { name: regex },
        { type: regex },
        { partNumber: regex },
        { manufacturer: regex },
      ],
    })
      .limit(limit)
      .lean();

    for (const c of components) {
      const compId = (c as any)._id?.toString() || c.name;
      results.push({
        entityType: "COMPONENT",
        id: compId,
        name: `${c.type} (${c.partNumber || c.name || "Unknown P/N"})`,
        status: c.condition || "DETECTED",
        organization: "org-default",
        lastUpdated: (c as any).updatedAt || (c as any).createdAt || new Date(),
        url: `/console/results?analysisId=${c.analysisId}`,
      });
    }

    // 4. Search Marketplace Listings
    const listings = await MarketplaceListing.find({
      ...(organizationId && organizationId !== "all" ? { sellerOrganizationId: organizationId } : {}),
      $or: [
        { listingId: regex },
        { title: regex },
        { category: regex },
        { partNumber: regex },
      ],
    })
      .limit(limit)
      .lean();

    for (const l of listings) {
      results.push({
        entityType: "LISTING",
        id: l.listingId,
        name: l.title,
        status: String(l.status || "ACTIVE"),
        organization: l.sellerOrganizationId || "org-default",
        lastUpdated: (l as any).updatedAt || (l as any).createdAt || new Date(),
        url: `/marketplace/${l.listingId}`,
      });
    }

    // 5. Search Reports
    const reports = await Report.find({
      ...orgFilter,
      $or: [
        { reportId: regex },
        { title: regex },
        { analysisId: regex },
      ],
    })
      .limit(limit)
      .lean();

    for (const r of reports) {
      results.push({
        entityType: "REPORT",
        id: r.reportId,
        name: r.title,
        status: r.status,
        organization: r.organizationId || "org-default",
        lastUpdated: (r as any).updatedAt || (r as any).generatedAt || new Date(),
        url: `/reports?reportId=${r.reportId}`,
      });
    }

    return results.slice(0, limit);
  }
}
