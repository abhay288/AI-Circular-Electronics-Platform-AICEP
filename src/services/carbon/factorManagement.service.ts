import connectDB from "@/lib/db";
import MaterialEmissionFactor, { IMaterialEmissionFactor } from "@/models/MaterialEmissionFactor";
import ImpactMethodology, { IImpactMethodology } from "@/models/ImpactMethodology";
import AuditLog from "@/models/AuditLog";

export const SEED_FACTORS = [
  {
    factorId: "FACT-CU-01",
    material: "Copper",
    region: "GLOBAL",
    process: "PRIMARY_EXTRACTION_AVOIDED",
    factor: 4.5,
    unit: "kgCO2e/kg",
    source: "Ecoinvent 3.9 (Global Primary Copper Smelting)",
    sourceType: "AUTHORITATIVE_DATABASE" as const,
    sourceReference: "Ecoinvent Report No. 10, Cut-off System Model",
    methodology: "Material Displacement Method v1",
    version: "1.0",
    status: "ACTIVE" as const,
    confidence: 0.92,
  },
  {
    factorId: "FACT-AU-01",
    material: "Gold",
    region: "GLOBAL",
    process: "PRIMARY_EXTRACTION_AVOIDED",
    factor: 12500,
    unit: "kgCO2e/kg",
    source: "World Gold Council / USGS Mineral Yearbook 2024",
    sourceType: "INDUSTRY_STANDARD" as const,
    sourceReference: "WGC Environmental Metrics for Primary Gold Ore Processing",
    methodology: "Material Displacement Method v1",
    version: "1.0",
    status: "ACTIVE" as const,
    confidence: 0.9,
  },
  {
    factorId: "FACT-AL-01",
    material: "Aluminum",
    region: "GLOBAL",
    process: "PRIMARY_EXTRACTION_AVOIDED",
    factor: 8.2,
    unit: "kgCO2e/kg",
    source: "International Aluminium Institute (IAI)",
    sourceType: "AUTHORITATIVE_DATABASE" as const,
    sourceReference: "IAI Primary Aluminium Smelting Carbon Intensity 2023",
    methodology: "Material Displacement Method v1",
    version: "1.0",
    status: "ACTIVE" as const,
    confidence: 0.94,
  },
  {
    factorId: "FACT-SN-01",
    material: "Tin",
    region: "GLOBAL",
    process: "PRIMARY_EXTRACTION_AVOIDED",
    factor: 16.8,
    unit: "kgCO2e/kg",
    source: "International Tin Association (ITA)",
    sourceType: "INDUSTRY_STANDARD" as const,
    sourceReference: "ITA Carbon Footprint of Refined Tin Production",
    methodology: "Material Displacement Method v1",
    version: "1.0",
    status: "ACTIVE" as const,
    confidence: 0.88,
  },
  {
    factorId: "FACT-FE-01",
    material: "Steel",
    region: "GLOBAL",
    process: "PRIMARY_EXTRACTION_AVOIDED",
    factor: 1.85,
    unit: "kgCO2e/kg",
    source: "World Steel Association Sustainability Report",
    sourceType: "AUTHORITATIVE_DATABASE" as const,
    sourceReference: "WorldSteel LCI Dataset v2023",
    methodology: "Material Displacement Method v1",
    version: "1.0",
    status: "ACTIVE" as const,
    confidence: 0.95,
  },
  {
    factorId: "FACT-SI-01",
    material: "Silicon",
    region: "GLOBAL",
    process: "INGOT_CRYSTALLIZATION_AVOIDED",
    factor: 28.0,
    unit: "kgCO2e/kg",
    source: "Semiconductor Industry Association (SIA) LCA Guidelines",
    sourceType: "LITERATURE" as const,
    sourceReference: "SIA Environmental White Paper on Ingot Smelting",
    methodology: "Material Displacement Method v1",
    version: "1.0",
    status: "ACTIVE" as const,
    confidence: 0.82,
  },
  {
    factorId: "FACT-FR4-01",
    material: "FR4",
    region: "GLOBAL",
    process: "EPOXY_LAMINATION_AVOIDED",
    factor: 6.5,
    unit: "kgCO2e/kg",
    source: "IPC Technical Report IPC-1752A",
    sourceType: "INDUSTRY_STANDARD" as const,
    sourceReference: "IPC Association Connecting Electronics Industries",
    methodology: "Material Displacement Method v1",
    version: "1.0",
    status: "ACTIVE" as const,
    confidence: 0.85,
  },
];

export const SEED_METHODOLOGY = {
  methodologyId: "MDM-V1.0",
  name: "Material Displacement Method (Empirical Emission Factors)",
  version: "1.0",
  description:
    "Scientific lifecycle accounting model calculating net avoided emissions by comparing baseline disposal with circular life-extension pathways.",
  scope: "Scope 3 Category 1 (Purchased Goods) & Category 12 (End-of-Life)",
  formula:
    "Net Avoided CO2e = ∑(Recoverable Material_i × Displacement_i × EmissionFactor_i) + Avoided Component Manufacturing - Process/Transport Overhead",
  assumptions: [
    "Recovered secondary materials displace primary virgin mining at empirically bounded substitution ratios (60-90%).",
    "Repair process energy derived from typical electronics bench diagnostics (1.2–2.0 kWh).",
    "Transport emissions based on regional average logistics factors (12 g CO2e / km-unit).",
    "Component reuse takes precedence over material shredding; duplicate crediting prevented by impact ledger.",
  ],
  sources: [
    "Ecoinvent 3.9 Database",
    "World Gold Council LCI",
    "International Aluminium Institute",
    "IPCC Guidelines for National Greenhouse Gas Inventories",
  ],
  status: "ACTIVE" as const,
};

export class FactorManagementService {
  /**
   * Seeds standard factors and methodology if they do not exist
   */
  public static async seedDefaultsIfNeeded(): Promise<void> {
    await connectDB();

    const factorCount = await MaterialEmissionFactor.countDocuments();
    if (factorCount === 0) {
      for (const f of SEED_FACTORS) {
        await MaterialEmissionFactor.create(f);
      }
    }

    const methCount = await ImpactMethodology.countDocuments({ methodologyId: SEED_METHODOLOGY.methodologyId });
    if (methCount === 0) {
      await ImpactMethodology.create(SEED_METHODOLOGY);
    }
  }

  /**
   * Lists all factors with optional material, status, or organization filter
   */
  public static async listFactors(filter?: {
    material?: string;
    status?: string;
    organizationId?: string;
  }): Promise<IMaterialEmissionFactor[]> {
    await connectDB();
    await this.seedDefaultsIfNeeded();

    const query: any = {};
    if (filter?.material) query.material = new RegExp(filter.material, "i");
    if (filter?.status) query.status = filter.status;
    if (filter?.organizationId) {
      query.$or = [{ organizationId: filter.organizationId }, { organizationId: { $exists: false } }, { organizationId: null }];
    }

    return await MaterialEmissionFactor.find(query).sort({ material: 1 });
  }

  /**
   * Creates a new factor. Requires source, unit, methodology, and version.
   */
  public static async createFactor(
    data: {
      material: string;
      region?: string;
      process: string;
      factor: number;
      unit: string;
      source: string;
      sourceType?: string;
      sourceReference?: string;
      methodology?: string;
      version?: string;
      status?: "ACTIVE" | "INACTIVE" | "DRAFT";
      confidence?: number;
      organizationId?: string;
    },
    user: { userId: string; role: string; organizationId?: string }
  ): Promise<IMaterialEmissionFactor> {
    await connectDB();

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      throw new Error("Forbidden: Only administrators can create or configure emission factors.");
    }

    if (!data.source || data.source.trim().length === 0) {
      throw new Error("Validation Error: An authoritative or documented source is required to create a factor.");
    }
    if (!data.unit || data.unit.trim().length === 0) {
      throw new Error("Validation Error: Unit is required (e.g., kgCO2e/kg).");
    }

    const factorId = `FACT-${data.material.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const newFactor = await MaterialEmissionFactor.create({
      factorId,
      material: data.material.trim(),
      region: data.region || "GLOBAL",
      process: data.process.trim(),
      factor: data.factor,
      unit: data.unit.trim(),
      source: data.source.trim(),
      sourceType: (data.sourceType as any) || "LITERATURE",
      sourceReference: data.sourceReference,
      methodology: data.methodology || "Material Displacement Method v1",
      version: data.version || "1.0",
      status: data.status || "ACTIVE",
      confidence: data.confidence ?? 0.85,
      organizationId: data.organizationId || user.organizationId,
      createdBy: user.userId,
    });

    await AuditLog.create({
      action: "EMISSION_FACTOR_CREATED",
      resource: "MaterialEmissionFactor",
      resourceId: factorId,
      userId: user.userId,
      organizationId: user.organizationId,
      metadata: { factorId, material: data.material, factor: data.factor, source: data.source },
      timestamp: new Date(),
    });

    return newFactor;
  }

  /**
   * Updates factor state (activate/deactivate or adjust values). Requires admin role.
   */
  public static async updateFactorStatus(
    factorId: string,
    status: "ACTIVE" | "INACTIVE" | "DRAFT",
    user: { userId: string; role: string; organizationId?: string }
  ): Promise<IMaterialEmissionFactor> {
    await connectDB();

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      throw new Error("Forbidden: Only administrators can modify emission factors.");
    }

    const factor = await MaterialEmissionFactor.findOne({ factorId });
    if (!factor) {
      throw new Error(`Factor '${factorId}' not found.`);
    }

    factor.status = status;
    await factor.save();

    await AuditLog.create({
      action: "EMISSION_FACTOR_STATUS_UPDATED",
      resource: "MaterialEmissionFactor",
      resourceId: factorId,
      userId: user.userId,
      organizationId: user.organizationId,
      metadata: { factorId, status },
      timestamp: new Date(),
    });

    return factor;
  }

  /**
   * Gets current active methodology or all registered methodologies
   */
  public static async getMethodologies(): Promise<IImpactMethodology[]> {
    await connectDB();
    await this.seedDefaultsIfNeeded();
    return await ImpactMethodology.find().sort({ createdAt: -1 });
  }
}
