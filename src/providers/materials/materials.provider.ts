/**
 * EcoIntel Material Recovery Intelligence — Provider Architecture & Implementations
 *
 * Implements:
 * 1. MaterialRecoveryProvider interface
 * 2. MockMaterialRecoveryProvider (Calibrated synthetic benchmark dataset)
 * 3. DatabaseMaterialRecoveryProvider (Evidence-based composition database mapping)
 * 4. MaterialRecoveryService (Production gateway & provider selector)
 *
 * Scientific constraint:
 * Normal RGB imagery provides component types, packages, connectors, and board geometry.
 * All material estimations explicitly state provenance (DATABASE_DERIVED, ESTIMATED, SIMULATED)
 * and provide scenario-based recovery yields.
 */

import {
  MaterialRecoveryInput,
  ModelInfo,
  IMassBasis,
  IMaterialSummaryItem,
  IPreciousMetalItem,
  IComponentMaterialContribution,
  IRecoveryScenarios,
  IMaterialSourceRecord,
  IDataCompleteness,
  IMaterialConfidence,
  EvidenceLevel,
  RecoveryPriority,
} from "@/lib/materials/materialTaxonomy";
import {
  findComponentComposition,
  estimatePCBSubstrateMetrics,
  INDICATIVE_COMMODITY_BENCHMARKS,
  PCB_SUBSTRATE_STANDARD,
} from "@/lib/materials/compositionDatabase";
import { IMaterialItem } from "@/models/MaterialRecovery";

export interface MaterialRecoveryResult {
  analysisId: string;
  status: "COMPLETED" | "INSUFFICIENT_DATA" | "FAILED";
  boardMass: IMassBasis;
  materialSummary: IMaterialSummaryItem[];
  preciousMetals: IPreciousMetalItem[];
  baseMetals: IMaterialSummaryItem[];
  criticalMaterials: IMaterialSummaryItem[];
  totalEstimatedMaterialMassGrams: number;
  totalRecoverableMaterialMassGrams: number;
  recoveryScenarios: IRecoveryScenarios;
  componentContributions: IComponentMaterialContribution[];
  confidence: IMaterialConfidence;
  dataCompleteness: IDataCompleteness;
  materialSources: IMaterialSourceRecord[];
  limitations: string[];
  provider: string;
  modelVersion: string;
  databaseVersion: string;

  // Legacy backward-compatibility fields
  pcbWeightKg: number;
  recoveryEfficiencyPercent: number;
  totalEstimatedMarketValueINR: number;
  totalEstimatedMarketValueUSD: number;
  materials: IMaterialItem[];
  method: "ESTIMATION" | "SPECTROMETRY";
  source: "DEMO" | "MEASURED" | "DATABASE_DERIVED";
}

export interface MaterialRecoveryProvider {
  estimate(input: MaterialRecoveryInput): Promise<MaterialRecoveryResult>;
  getModelInfo(): Promise<ModelInfo>;
}

// ============================================================================
// 1. MOCK / DEMO MATERIAL RECOVERY PROVIDER
// ============================================================================
export class MockMaterialRecoveryProvider implements MaterialRecoveryProvider {
  private readonly modelVersion = "1.2.0-demo";
  private readonly databaseVersion = "mat-weee-benchmark-v2";

  async getModelInfo(): Promise<ModelInfo> {
    return {
      provider: "MockMaterialRecoveryProvider",
      modelVersion: this.modelVersion,
      databaseVersion: this.databaseVersion,
      methodology: "Calibrated multi-layer networking PCB benchmark model with synthetic composition ranges",
      supportedMaterials: ["Copper", "Aluminum", "Tin", "Nickel", "Iron", "Gold", "Silver", "Palladium", "Tantalum"],
      supportedPreciousMetals: ["Gold", "Silver", "Palladium", "Platinum"],
      scientificDisclaimer:
        "Demo dataset values are illustrative approximations for user evaluation. Actual recovery requires physical laboratory assay or documented manufacturer BOM.",
    };
  }

  async estimate(input: MaterialRecoveryInput): Promise<MaterialRecoveryResult> {
    const analysisId = input.analysisId || "DEMO-ANALYSIS";
    const boardMassGrams = input.boardMassGrams || input.estimatedBoardMassGrams || 280.0;
    const boardAreaCm2 = input.boardAreaCm2 || 140.0;

    const massBasis: IMassBasis = {
      massValue: boardMassGrams,
      massUnit: "g",
      massSource: input.boardMassGrams ? "MEASURED" : "ESTIMATED",
      massConfidence: input.boardMassGrams ? 0.95 : 0.82,
      estimatedBoardMassGrams: boardMassGrams,
      boardAreaCm2,
      calculationMethod: "CALIBRATED_BENCHMARK_DEMO",
    };

    // Scaled physical masses based on board mass
    const cuMass = +(boardMassGrams * 0.172).toFixed(2); // ~48.2 g
    const alMass = +(boardMassGrams * 0.066).toFixed(2); // ~18.5 g
    const snMass = +(boardMassGrams * 0.022).toFixed(2); // ~6.2 g
    const niMass = +(boardMassGrams * 0.0135).toFixed(2); // ~3.8 g
    const feMass = +(boardMassGrams * 0.030).toFixed(2); // ~8.4 g
    const taMass = +(boardMassGrams * 0.0028).toFixed(2); // ~0.8 g

    // Precious metals in milligrams
    const auEstMg = +(boardMassGrams * 0.052).toFixed(1); // ~14.6 mg (0.0146 g)
    const agEstMg = +(boardMassGrams * 0.336).toFixed(1); // ~94.1 mg (0.0941 g)
    const pdEstMg = +(boardMassGrams * 0.029).toFixed(1); // ~8.1 mg (0.0081 g)

    // Precious Metals Detailed Model
    const preciousMetals: IPreciousMetalItem[] = [
      {
        metal: "Gold",
        symbol: "Au",
        presence: "DETECTED_ESTIMATED",
        estimatedMassMg: auEstMg,
        minMassMg: +(auEstMg * 0.75).toFixed(1),
        maxMassMg: +(auEstMg * 1.35).toFixed(1),
        recoverableMassMg: +(auEstMg * 0.85).toFixed(1),
        typicalRecoveryRate: 0.85,
        evidenceLevel: "SIMULATED",
        confidence: 0.88,
        evidence: [
          { type: "COMPONENT_TYPE", source: "Visual PCB Scan", value: "High-density gold-flashed RJ45 and pin headers detected" },
          { type: "PACKAGE", source: "IC Packaging Standard", value: "BGA/QFP thermosonic gold wire bonding estimated" },
          { type: "DATABASE", source: "UNEP E-Waste Metallurgy Reference", value: "Typical networking board gold content: 40-70 mg/kg" },
        ],
        contributingComponentCount: 7,
        indicativeMarketRateUSDPerGram: INDICATIVE_COMMODITY_BENCHMARKS.Au.priceUSDPerGram,
        indicativeEstimatedValueUSD: +((auEstMg / 1000) * INDICATIVE_COMMODITY_BENCHMARKS.Au.priceUSDPerGram).toFixed(2),
      },
      {
        metal: "Silver",
        symbol: "Ag",
        presence: "DETECTED_ESTIMATED",
        estimatedMassMg: agEstMg,
        minMassMg: +(agEstMg * 0.70).toFixed(1),
        maxMassMg: +(agEstMg * 1.40).toFixed(1),
        recoverableMassMg: +(agEstMg * 0.82).toFixed(1),
        typicalRecoveryRate: 0.82,
        evidenceLevel: "SIMULATED",
        confidence: 0.86,
        evidence: [
          { type: "COMPONENT_TYPE", source: "Visual PCB Scan", value: "SMD Ceramic MLCC bypass capacitors & IC die attach" },
          { type: "DATABASE", source: "ASM Electronic Packaging Materials", value: "Silver conductive epoxy and capacitor terminations" },
        ],
        contributingComponentCount: 18,
        indicativeMarketRateUSDPerGram: INDICATIVE_COMMODITY_BENCHMARKS.Ag.priceUSDPerGram,
        indicativeEstimatedValueUSD: +((agEstMg / 1000) * INDICATIVE_COMMODITY_BENCHMARKS.Ag.priceUSDPerGram).toFixed(2),
      },
      {
        metal: "Palladium",
        symbol: "Pd",
        presence: "DETECTED_ESTIMATED",
        estimatedMassMg: pdEstMg,
        minMassMg: +(pdEstMg * 0.65).toFixed(1),
        maxMassMg: +(pdEstMg * 1.45).toFixed(1),
        recoverableMassMg: +(pdEstMg * 0.78).toFixed(1),
        typicalRecoveryRate: 0.78,
        evidenceLevel: "SIMULATED",
        confidence: 0.82,
        evidence: [
          { type: "COMPONENT_TYPE", source: "Visual PCB Scan", value: "High-density MLCC array identified around power plane" },
          { type: "DATABASE", source: "WEEE Precious Metals Recovery Guidelines", value: "Internal electrode Pd paste in multi-layer ceramics" },
        ],
        contributingComponentCount: 12,
        indicativeMarketRateUSDPerGram: INDICATIVE_COMMODITY_BENCHMARKS.Pd.priceUSDPerGram,
        indicativeEstimatedValueUSD: +((pdEstMg / 1000) * INDICATIVE_COMMODITY_BENCHMARKS.Pd.priceUSDPerGram).toFixed(2),
      },
      {
        metal: "Platinum",
        symbol: "Pt",
        presence: "INSUFFICIENT_EVIDENCE",
        estimatedMassMg: 0,
        minMassMg: 0,
        maxMassMg: 0,
        recoverableMassMg: 0,
        typicalRecoveryRate: 0.75,
        evidenceLevel: "UNKNOWN",
        confidence: 0.20,
        evidence: [
          { type: "DATABASE", source: "Component Metallurgy Standard", value: "No platinum sensors, RTDs, or catalytic elements identified" },
        ],
        contributingComponentCount: 0,
        indicativeMarketRateUSDPerGram: INDICATIVE_COMMODITY_BENCHMARKS.Pt.priceUSDPerGram,
        indicativeEstimatedValueUSD: 0,
      },
    ];

    // Base Metals
    const baseMetals: IMaterialSummaryItem[] = [
      {
        material: "Copper",
        symbol: "Cu",
        atomicNumber: 29,
        category: "BASE_METAL",
        estimatedMassGrams: cuMass,
        minMassGrams: +(cuMass * 0.85).toFixed(2),
        maxMassGrams: +(cuMass * 1.18).toFixed(2),
        recoverableMassGrams: +(cuMass * 0.92).toFixed(2),
        evidenceLevel: "SIMULATED",
        confidence: 0.94,
        primarySources: ["FR-4 Ground & Power Planes", "IC Leadframes", "Connector Contacts", "Inductor Windings"],
        unit: "g",
      },
      {
        material: "Aluminum",
        symbol: "Al",
        atomicNumber: 13,
        category: "BASE_METAL",
        estimatedMassGrams: alMass,
        minMassGrams: +(alMass * 0.80).toFixed(2),
        maxMassGrams: +(alMass * 1.20).toFixed(2),
        recoverableMassGrams: +(alMass * 0.88).toFixed(2),
        evidenceLevel: "SIMULATED",
        confidence: 0.92,
        primarySources: ["Electrolytic Canister Capacitors", "Extruded Heat Sink"],
        unit: "g",
      },
      {
        material: "Tin",
        symbol: "Sn",
        atomicNumber: 50,
        category: "BASE_METAL",
        estimatedMassGrams: snMass,
        minMassGrams: +(snMass * 0.75).toFixed(2),
        maxMassGrams: +(snMass * 1.25).toFixed(2),
        recoverableMassGrams: +(snMass * 0.85).toFixed(2),
        evidenceLevel: "SIMULATED",
        confidence: 0.90,
        primarySources: ["SAC305 Lead-Free Solder Joints", "Component Terminations"],
        unit: "g",
      },
      {
        material: "Nickel",
        symbol: "Ni",
        atomicNumber: 28,
        category: "BASE_METAL",
        estimatedMassGrams: niMass,
        minMassGrams: +(niMass * 0.70).toFixed(2),
        maxMassGrams: +(niMass * 1.30).toFixed(2),
        recoverableMassGrams: +(niMass * 0.80).toFixed(2),
        evidenceLevel: "SIMULATED",
        confidence: 0.85,
        primarySources: ["Barrier Underplate", "MLCC Terminal Barriers"],
        unit: "g",
      },
      {
        material: "Iron",
        symbol: "Fe",
        atomicNumber: 26,
        category: "BASE_METAL",
        estimatedMassGrams: feMass,
        minMassGrams: +(feMass * 0.75).toFixed(2),
        maxMassGrams: +(feMass * 1.25).toFixed(2),
        recoverableMassGrams: +(feMass * 0.85).toFixed(2),
        evidenceLevel: "SIMULATED",
        confidence: 0.86,
        primarySources: ["Connector Shielding Cans", "Ferrite Core Inductors"],
        unit: "g",
      },
    ];

    // Critical Materials
    const criticalMaterials: IMaterialSummaryItem[] = [
      {
        material: "Tantalum",
        symbol: "Ta",
        atomicNumber: 73,
        category: "CRITICAL_MATERIAL",
        estimatedMassGrams: taMass,
        minMassGrams: +(taMass * 0.70).toFixed(2),
        maxMassGrams: +(taMass * 1.35).toFixed(2),
        recoverableMassGrams: +(taMass * 0.75).toFixed(2),
        evidenceLevel: "SIMULATED",
        confidence: 0.84,
        primarySources: ["SMD Tantalum Electrolytic Capacitors"],
        unit: "g",
        notes: "EU Critical Raw Material: High strategic recovery priority",
      },
    ];

    // Material Summary across all
    const materialSummary: IMaterialSummaryItem[] = [
      ...baseMetals,
      {
        material: "Gold",
        symbol: "Au",
        atomicNumber: 79,
        category: "PRECIOUS_METAL",
        estimatedMassGrams: +(auEstMg / 1000).toFixed(5),
        minMassGrams: +(auEstMg * 0.75 / 1000).toFixed(5),
        maxMassGrams: +(auEstMg * 1.35 / 1000).toFixed(5),
        recoverableMassGrams: +(auEstMg * 0.85 / 1000).toFixed(5),
        evidenceLevel: "SIMULATED",
        confidence: 0.88,
        primarySources: ["Gold-plated mating pins", "BGA Wire bonds"],
        unit: "mg",
      },
      {
        material: "Silver",
        symbol: "Ag",
        atomicNumber: 47,
        category: "PRECIOUS_METAL",
        estimatedMassGrams: +(agEstMg / 1000).toFixed(4),
        minMassGrams: +(agEstMg * 0.70 / 1000).toFixed(4),
        maxMassGrams: +(agEstMg * 1.40 / 1000).toFixed(4),
        recoverableMassGrams: +(agEstMg * 0.82 / 1000).toFixed(4),
        evidenceLevel: "SIMULATED",
        confidence: 0.86,
        primarySources: ["MLCC terminations", "Die-attach epoxy"],
        unit: "mg",
      },
      {
        material: "Palladium",
        symbol: "Pd",
        atomicNumber: 46,
        category: "PRECIOUS_METAL",
        estimatedMassGrams: +(pdEstMg / 1000).toFixed(5),
        minMassGrams: +(pdEstMg * 0.65 / 1000).toFixed(5),
        maxMassGrams: +(pdEstMg * 1.45 / 1000).toFixed(5),
        recoverableMassGrams: +(pdEstMg * 0.78 / 1000).toFixed(5),
        evidenceLevel: "SIMULATED",
        confidence: 0.82,
        primarySources: ["MLCC internal electrodes"],
        unit: "mg",
      },
      ...criticalMaterials,
    ];

    const totalEstimatedMaterialMassGrams = +(
      cuMass + alMass + snMass + niMass + feMass + taMass +
      (auEstMg + agEstMg + pdEstMg) / 1000
    ).toFixed(2);

    const totalRecoverableMaterialMassGrams = +(
      (cuMass * 0.92) + (alMass * 0.88) + (snMass * 0.85) +
      (niMass * 0.80) + (feMass * 0.85) + (taMass * 0.75) +
      (auEstMg * 0.85 + agEstMg * 0.82 + pdEstMg * 0.78) / 1000
    ).toFixed(2);

    // Multi-scenario Recovery Model
    const recoveryScenarios: IRecoveryScenarios = {
      conservative: {
        scenario: "conservative",
        description: "Mechanical shredding followed by standard thermal pyrometallurgical smelting.",
        assumption: "Smelting slag losses, lower fine metal capture rates, no selective component desoldering.",
        averageRecoveryEfficiency: 0.72,
        recoverableTotalMassGrams: +(totalEstimatedMaterialMassGrams * 0.72).toFixed(2),
        recoverablePreciousMetalsMg: {
          gold: +(auEstMg * 0.70).toFixed(1),
          silver: +(agEstMg * 0.68).toFixed(1),
          palladium: +(pdEstMg * 0.62).toFixed(1),
          platinum: 0,
        },
        recoverableBaseMetalsGrams: {
          copper: +(cuMass * 0.78).toFixed(2),
          aluminum: +(alMass * 0.65).toFixed(2),
          tin: +(snMass * 0.65).toFixed(2),
          nickel: +(niMass * 0.60).toFixed(2),
          iron: +(feMass * 0.75).toFixed(2),
        },
      },
      typical: {
        scenario: "typical",
        description: "Automated component desoldering disassembly followed by targeted hydrometallurgical leaching.",
        assumption: "Industrial standard state-of-the-art closed-loop leaching with 82-90% chemical recovery yields.",
        averageRecoveryEfficiency: 0.85,
        recoverableTotalMassGrams: totalRecoverableMaterialMassGrams,
        recoverablePreciousMetalsMg: {
          gold: +(auEstMg * 0.85).toFixed(1),
          silver: +(agEstMg * 0.82).toFixed(1),
          palladium: +(pdEstMg * 0.78).toFixed(1),
          platinum: 0,
        },
        recoverableBaseMetalsGrams: {
          copper: +(cuMass * 0.92).toFixed(2),
          aluminum: +(alMass * 0.88).toFixed(2),
          tin: +(snMass * 0.85).toFixed(2),
          nickel: +(niMass * 0.80).toFixed(2),
          iron: +(feMass * 0.85).toFixed(2),
        },
      },
      optimistic: {
        scenario: "optimistic",
        description: "Selective robotic desoldering, concentrated pin separation, and advanced bioleaching / electrochemical electro-winning.",
        assumption: "Best-in-class laboratory / clean-tech recovery facility with minimal tailing losses.",
        averageRecoveryEfficiency: 0.93,
        recoverableTotalMassGrams: +(totalEstimatedMaterialMassGrams * 0.93).toFixed(2),
        recoverablePreciousMetalsMg: {
          gold: +(auEstMg * 0.94).toFixed(1),
          silver: +(agEstMg * 0.92).toFixed(1),
          palladium: +(pdEstMg * 0.90).toFixed(1),
          platinum: 0,
        },
        recoverableBaseMetalsGrams: {
          copper: +(cuMass * 0.96).toFixed(2),
          aluminum: +(alMass * 0.95).toFixed(2),
          tin: +(snMass * 0.92).toFixed(2),
          nickel: +(niMass * 0.88).toFixed(2),
          iron: +(feMass * 0.92).toFixed(2),
        },
      },
    };

    // Component Prioritization: map input components if provided, else use canonical demo set
    const defaultDemoContributions: IComponentMaterialContribution[] = [
      {
        componentId: "J1",
        componentType: "RJ45 Ethernet Connector",
        packageName: "Through-Hole Jack",
        estimatedMassGrams: 4.8,
        recoveryPriority: "HIGH",
        primaryRecoverableMetal: "Gold (Flash Plating) & Copper Alloy",
        confidence: 0.92,
        materials: [
          { material: "Copper", symbol: "Cu", category: "BASE_METAL", massFractionTypical: 0.78, estimatedMassGrams: 3.74, recoverableMassGrams: 3.44, evidenceLevel: "SIMULATED", confidence: 0.94 },
          { material: "Gold", symbol: "Au", category: "PRECIOUS_METAL", massFractionTypical: 0.0006, estimatedMassGrams: 0.0029, recoverableMassGrams: 0.0025, evidenceLevel: "SIMULATED", confidence: 0.90 },
          { material: "Nickel", symbol: "Ni", category: "BASE_METAL", massFractionTypical: 0.03, estimatedMassGrams: 0.14, recoverableMassGrams: 0.11, evidenceLevel: "SIMULATED", confidence: 0.88 },
        ],
        notes: "High gold contact density. Excellent candidate for selective chemical stripping.",
      },
      {
        componentId: "U1",
        componentType: "Main SoC / Microprocessor",
        packageName: "BGA-256",
        estimatedMassGrams: 3.2,
        recoveryPriority: "HIGH",
        primaryRecoverableMetal: "Gold Wire Bonds & Silicon Die",
        confidence: 0.90,
        materials: [
          { material: "Copper", symbol: "Cu", category: "BASE_METAL", massFractionTypical: 0.38, estimatedMassGrams: 1.22, recoverableMassGrams: 1.12, evidenceLevel: "SIMULATED", confidence: 0.92 },
          { material: "Gold", symbol: "Au", category: "PRECIOUS_METAL", massFractionTypical: 0.0005, estimatedMassGrams: 0.0016, recoverableMassGrams: 0.0014, evidenceLevel: "SIMULATED", confidence: 0.88 },
          { material: "Silver", symbol: "Ag", category: "PRECIOUS_METAL", massFractionTypical: 0.0015, estimatedMassGrams: 0.0048, recoverableMassGrams: 0.0040, evidenceLevel: "SIMULATED", confidence: 0.85 },
        ],
        notes: "High value density. Bond wire gold recovery requires nitric/hydrochloric digestion.",
      },
      {
        componentId: "C1",
        componentType: "Ceramic MLCC Array",
        packageName: "0805 SMD",
        estimatedMassGrams: 0.45,
        recoveryPriority: "MEDIUM",
        primaryRecoverableMetal: "Palladium & Silver Electrodes",
        confidence: 0.85,
        materials: [
          { material: "Palladium", symbol: "Pd", category: "PRECIOUS_METAL", massFractionTypical: 0.004, estimatedMassGrams: 0.0018, recoverableMassGrams: 0.0014, evidenceLevel: "SIMULATED", confidence: 0.82 },
          { material: "Silver", symbol: "Ag", category: "PRECIOUS_METAL", massFractionTypical: 0.02, estimatedMassGrams: 0.0090, recoverableMassGrams: 0.0074, evidenceLevel: "SIMULATED", confidence: 0.84 },
        ],
        notes: "Moderate recoverable mass; requires bulk hydrometallurgical digestion.",
      },
      {
        componentId: "L1",
        componentType: "Power Inductor",
        packageName: "Toroidal Choke",
        estimatedMassGrams: 6.5,
        recoveryPriority: "HIGH",
        primaryRecoverableMetal: "High-Purity Copper Windings",
        confidence: 0.95,
        materials: [
          { material: "Copper", symbol: "Cu", category: "BASE_METAL", massFractionTypical: 0.55, estimatedMassGrams: 3.58, recoverableMassGrams: 3.40, evidenceLevel: "SIMULATED", confidence: 0.96 },
          { material: "Iron", symbol: "Fe", category: "BASE_METAL", massFractionTypical: 0.38, estimatedMassGrams: 2.47, recoverableMassGrams: 2.10, evidenceLevel: "SIMULATED", confidence: 0.92 },
        ],
        notes: "Readily accessible copper windings via mechanical desoldering.",
      },
      {
        componentId: "R1",
        componentType: "SMD Chip Resistor",
        packageName: "0603 SMD",
        estimatedMassGrams: 0.02,
        recoveryPriority: "LOW",
        primaryRecoverableMetal: "Minor Copper/Tin Terminals",
        confidence: 0.88,
        materials: [
          { material: "Copper", symbol: "Cu", category: "BASE_METAL", massFractionTypical: 0.08, estimatedMassGrams: 0.0016, recoverableMassGrams: 0.0014, evidenceLevel: "SIMULATED", confidence: 0.86 },
        ],
        notes: "Negligible individual economic value; recovery only feasible in bulk shredding.",
      },
    ];

    const componentContributions: IComponentMaterialContribution[] =
      input.components && input.components.length > 0
        ? input.components.map((c) => {
            const isConn = (c.componentType || "").toLowerCase().includes("connector");
            const isIC = (c.componentType || "").toLowerCase().includes("ic") || (c.componentType || "").toLowerCase().includes("processor");
            const isCap = (c.componentType || "").toLowerCase().includes("capacitor");
            const estMass = c.estimatedMassGrams || (isConn ? 3.5 : isIC ? 2.0 : 0.5);
            const hasGold = isConn || isIC;
            const hasPd = isCap;
            const priority: RecoveryPriority = (hasGold || hasPd) ? "HIGH" : "LOW";
            return {
              componentId: c.componentId,
              componentType: c.componentType,
              packageName: c.packageType || "SMD",
              partNumber: c.partNumber,
              estimatedMassGrams: estMass,
              recoveryPriority: priority,
              primaryRecoverableMetal: hasGold ? "Gold" : hasPd ? "Palladium" : "Copper",
              confidence: c.detectionConfidence || 0.90,
              materials: [
                {
                  material: "Copper",
                  symbol: "Cu",
                  category: "BASE_METAL" as const,
                  massFractionTypical: 0.45,
                  estimatedMassGrams: +(estMass * 0.45).toFixed(4),
                  recoverableMassGrams: +(estMass * 0.45 * 0.9).toFixed(4),
                  evidenceLevel: "SIMULATED" as const,
                  confidence: 0.92,
                },
                ...(hasGold
                  ? [
                      {
                        material: "Gold",
                        symbol: "Au",
                        category: "PRECIOUS_METAL" as const,
                        massFractionTypical: 0.0006,
                        estimatedMassGrams: +(estMass * 0.0006).toFixed(5),
                        recoverableMassGrams: +(estMass * 0.0006 * 0.85).toFixed(5),
                        evidenceLevel: "SIMULATED" as const,
                        confidence: 0.90,
                      },
                    ]
                  : []),
              ],
            };
          })
        : defaultDemoContributions;

    const materialSources: IMaterialSourceRecord[] = [
      {
        material: "Gold",
        sourceType: "LITERATURE",
        reference: "UNEP E-waste Metallurgy: Precious Metals in Printed Circuit Boards (2023)",
        qualityRating: "PEER_REVIEWED_LITERATURE",
      },
      {
        material: "Copper",
        sourceType: "AUTHORITATIVE_DATABASE",
        reference: "Copper Development Association (CDA) Alloy & PCB Cladding Benchmarks",
        qualityRating: "INDUSTRY_STANDARD",
      },
      {
        material: "Palladium",
        sourceType: "LITERATURE",
        reference: "Materials Science & Engineering: Precious Metal Extraction from Multilayer Ceramic Capacitors",
        qualityRating: "PEER_REVIEWED_LITERATURE",
      },
      {
        material: "Tantalum",
        sourceType: "AUTHORITATIVE_DATABASE",
        reference: "Critical Raw Materials Alliance (CRM) WEEE Recycling Guidelines",
        qualityRating: "INDUSTRY_STANDARD",
      },
    ];

    const limitations = [
      "DEMO DATASET: Material quantities are illustrative benchmark estimates for router-board class electronics.",
      "RGB imagery cannot directly measure chemical concentrations or alloy compositions.",
      "Gold and palladium estimates assume standard plating thicknesses (0.2 - 0.76 µm) which vary widely by OEM.",
      "Recoverable quantities are based on theoretical industrial hydrometallurgical yields, not physical assay.",
      "EcoIntel estimates are not a substitute for XRF, ICP-OES, or laboratory fire assay.",
    ];

    // Indicative values for legacy frontend compatibility
    const totalEstimatedMarketValueUSD = +(
      ((auEstMg / 1000) * INDICATIVE_COMMODITY_BENCHMARKS.Au.priceUSDPerGram) +
      ((agEstMg / 1000) * INDICATIVE_COMMODITY_BENCHMARKS.Ag.priceUSDPerGram) +
      ((pdEstMg / 1000) * INDICATIVE_COMMODITY_BENCHMARKS.Pd.priceUSDPerGram) +
      ((cuMass / 1000) * INDICATIVE_COMMODITY_BENCHMARKS.Cu.priceUSDPerKg) +
      ((alMass / 1000) * INDICATIVE_COMMODITY_BENCHMARKS.Al.priceUSDPerKg) +
      ((snMass / 1000) * INDICATIVE_COMMODITY_BENCHMARKS.Sn.priceUSDPerKg) +
      ((taMass / 1000) * INDICATIVE_COMMODITY_BENCHMARKS.Ta.priceUSDPerKg)
    ).toFixed(2);
    const totalEstimatedMarketValueINR = Math.round(totalEstimatedMarketValueUSD * 86.5);

    const legacyMaterials: IMaterialItem[] = [
      {
        material: "Gold (Au)",
        symbol: "Au",
        atomicNum: 79,
        estimatedQuantity: +(auEstMg / 1000).toFixed(4),
        unit: "g",
        marketRateINR: Math.round(INDICATIVE_COMMODITY_BENCHMARKS.Au.priceUSDPerGram * 86.5),
        marketRateUnit: "₹/g",
        estimatedValueINR: Math.round((auEstMg / 1000) * INDICATIVE_COMMODITY_BENCHMARKS.Au.priceUSDPerGram * 86.5),
        confidence: 0.88,
        method: "ESTIMATION",
        source: "DEMO",
      },
      {
        material: "Silver (Ag)",
        symbol: "Ag",
        atomicNum: 47,
        estimatedQuantity: +(agEstMg / 1000).toFixed(4),
        unit: "g",
        marketRateINR: Math.round(INDICATIVE_COMMODITY_BENCHMARKS.Ag.priceUSDPerGram * 86.5),
        marketRateUnit: "₹/g",
        estimatedValueINR: Math.round((agEstMg / 1000) * INDICATIVE_COMMODITY_BENCHMARKS.Ag.priceUSDPerGram * 86.5),
        confidence: 0.86,
        method: "ESTIMATION",
        source: "DEMO",
      },
      {
        material: "Copper (Cu)",
        symbol: "Cu",
        atomicNum: 29,
        estimatedQuantity: cuMass,
        unit: "g",
        marketRateINR: Math.round((INDICATIVE_COMMODITY_BENCHMARKS.Cu.priceUSDPerKg / 1000) * 86.5),
        marketRateUnit: "₹/g",
        estimatedValueINR: Math.round((cuMass / 1000) * INDICATIVE_COMMODITY_BENCHMARKS.Cu.priceUSDPerKg * 86.5),
        confidence: 0.94,
        method: "ESTIMATION",
        source: "DEMO",
      },
      {
        material: "Palladium (Pd)",
        symbol: "Pd",
        atomicNum: 46,
        estimatedQuantity: +(pdEstMg / 1000).toFixed(4),
        unit: "g",
        marketRateINR: Math.round(INDICATIVE_COMMODITY_BENCHMARKS.Pd.priceUSDPerGram * 86.5),
        marketRateUnit: "₹/g",
        estimatedValueINR: Math.round((pdEstMg / 1000) * INDICATIVE_COMMODITY_BENCHMARKS.Pd.priceUSDPerGram * 86.5),
        confidence: 0.82,
        method: "ESTIMATION",
        source: "DEMO",
      },
      {
        material: "Tin (Sn)",
        symbol: "Sn",
        atomicNum: 50,
        estimatedQuantity: snMass,
        unit: "g",
        marketRateINR: Math.round((INDICATIVE_COMMODITY_BENCHMARKS.Sn.priceUSDPerKg / 1000) * 86.5),
        marketRateUnit: "₹/g",
        estimatedValueINR: Math.round((snMass / 1000) * INDICATIVE_COMMODITY_BENCHMARKS.Sn.priceUSDPerKg * 86.5),
        confidence: 0.90,
        method: "ESTIMATION",
        source: "DEMO",
      },
      {
        material: "Aluminum (Al)",
        symbol: "Al",
        atomicNum: 13,
        estimatedQuantity: alMass,
        unit: "g",
        marketRateINR: Math.round((INDICATIVE_COMMODITY_BENCHMARKS.Al.priceUSDPerKg / 1000) * 86.5),
        marketRateUnit: "₹/g",
        estimatedValueINR: Math.round((alMass / 1000) * INDICATIVE_COMMODITY_BENCHMARKS.Al.priceUSDPerKg * 86.5),
        confidence: 0.92,
        method: "ESTIMATION",
        source: "DEMO",
      },
    ];

    return {
      analysisId,
      status: "COMPLETED",
      boardMass: massBasis,
      materialSummary,
      preciousMetals,
      baseMetals,
      criticalMaterials,
      totalEstimatedMaterialMassGrams,
      totalRecoverableMaterialMassGrams,
      recoveryScenarios,
      componentContributions,
      confidence: {
        score: 0.86,
        level: "MEDIUM",
        factors: {
          componentDetectionConfidence: 0.91,
          compositionSourceQuality: 0.88,
          massConfidence: 0.82,
          metadataCompleteness: 0.70,
        },
      },
      dataCompleteness: {
        score: 72,
        percentage: 72,
        availableInputs: ["Visual Component Scans", "Substrate Geometry", "Packaging Dimensions"],
        missingInputs: ["Laboratory XRF Assay", "Manufacturer Certified BOM", "Measured Chemical Purity"],
      },
      materialSources,
      limitations,
      provider: "mock",
      modelVersion: this.modelVersion,
      databaseVersion: this.databaseVersion,
      pcbWeightKg: +(boardMassGrams / 1000).toFixed(3),
      recoveryEfficiencyPercent: 85.0,
      totalEstimatedMarketValueINR,
      totalEstimatedMarketValueUSD,
      materials: legacyMaterials,
      method: "ESTIMATION",
      source: "DEMO",
    };
  }
}

// ============================================================================
// 2. DATABASE MATERIAL RECOVERY PROVIDER (Evidence-Based Physical Estimation)
// ============================================================================
export class DatabaseMaterialRecoveryProvider implements MaterialRecoveryProvider {
  private readonly modelVersion = "2.0.0-database";
  private readonly databaseVersion = "mat-comp-v1.0";

  async getModelInfo(): Promise<ModelInfo> {
    return {
      provider: "DatabaseMaterialRecoveryProvider",
      modelVersion: this.modelVersion,
      databaseVersion: this.databaseVersion,
      methodology: "Component-level literature composition mapping aggregated with physical PCB substrate geometry",
      supportedMaterials: [
        "Copper", "Aluminum", "Tin", "Nickel", "Iron", "Gold", "Silver", "Palladium", "Platinum", "Tantalum"
      ],
      supportedPreciousMetals: ["Gold", "Silver", "Palladium", "Platinum"],
      scientificDisclaimer:
        "Estimates are derived by combining computer vision component detection with published electronics packaging composition databases. They represent statistical ranges and do not constitute physical chemical assays.",
    };
  }

  async estimate(input: MaterialRecoveryInput): Promise<MaterialRecoveryResult> {
    const analysisId = input.analysisId || "LIVE-ANALYSIS";
    const components = input.components || [];
    const pcbInput = input.pcbAnalysis || {};

    // 1. INSUFFICIENT DATA CHECK: If no components and no PCB geometry
    const hasComponents = components.length > 0;
    const hasPcbGeometry = (pcbInput.boardAreaCm2 && pcbInput.boardAreaCm2 > 0) || (input.boardAreaCm2 && input.boardAreaCm2 > 0);

    if (!hasComponents && !hasPcbGeometry && !input.boardMassGrams) {
      return this.buildInsufficientDataResult(analysisId);
    }

    // 2. MASS BASIS ESTIMATION: MEASURED -> KNOWN -> DATASHEET -> DATABASE -> ESTIMATED
    let massValue = 0;
    let massSource: IMassBasis["massSource"] = "ESTIMATED";
    let massConfidence = 0.65;
    let boardAreaCm2 = input.boardAreaCm2 || pcbInput.boardAreaCm2 || 0;

    if (input.boardMassGrams && input.boardMassGrams > 0) {
      massValue = input.boardMassGrams;
      massSource = "MEASURED";
      massConfidence = 0.98;
    } else if (input.estimatedBoardMassGrams && input.estimatedBoardMassGrams > 0) {
      massValue = input.estimatedBoardMassGrams;
      massSource = "KNOWN";
      massConfidence = 0.90;
    } else if (boardAreaCm2 > 0) {
      // Calculate substrate mass from physical dimensions
      const substrateMetrics = estimatePCBSubstrateMetrics(
        boardAreaCm2,
        pcbInput.layerCount || 2,
        pcbInput.surfaceFinish || "ENIG"
      );
      // Estimate component mass from detected components
      let sumComponentMass = 0;
      for (const comp of components) {
        const rule = findComponentComposition(comp.componentType, comp.packageType);
        sumComponentMass += comp.estimatedMassGrams || (rule ? rule.typicalMassGrams : 0.2);
      }
      massValue = +(substrateMetrics.estimatedTotalMassGrams + sumComponentMass).toFixed(2);
      massSource = "DATABASE";
      massConfidence = 0.82;
    } else {
      // Fallback: estimate from component count and standard density
      const compCount = components.length || input.componentCount || 10;
      massValue = Math.max(25, compCount * 3.5);
      boardAreaCm2 = Math.max(30, compCount * 4.2);
      massSource = "ESTIMATED";
      massConfidence = 0.60;
    }

    const massBasis: IMassBasis = {
      massValue,
      massUnit: "g",
      massSource,
      massConfidence,
      estimatedBoardMassGrams: massValue,
      boardAreaCm2,
      calculationMethod:
        massSource === "MEASURED"
          ? "ACTUAL_SCALED_MEASUREMENT"
          : "SUBSTRATE_COMPONENT_AGGREGATION",
    };

    // 3. COMPONENT LEVEL COMPOSITION & PRIORITIZATION
    const componentContributions: IComponentMaterialContribution[] = [];
    const materialAggregator: Record<
      string,
      {
        symbol: string;
        atomicNumber: number;
        category: IMaterialSummaryItem["category"];
        minGrams: number;
        maxGrams: number;
        typicalGrams: number;
        sources: Set<string>;
        confidenceSum: number;
        count: number;
      }
    > = {};

    let preciousMetalsContributingCount: Record<string, number> = {
      Gold: 0,
      Silver: 0,
      Palladium: 0,
      Platinum: 0,
    };

    // Substrate contribution
    if (boardAreaCm2 > 0) {
      const substrateMetrics = estimatePCBSubstrateMetrics(
        boardAreaCm2,
        pcbInput.layerCount || 2,
        pcbInput.surfaceFinish || "ENIG"
      );

      // Add copper from PCB substrate traces & planes
      materialAggregator["Copper"] = {
        symbol: "Cu",
        atomicNumber: 29,
        category: "BASE_METAL",
        minGrams: +(substrateMetrics.totalCopperGrams * 0.8).toFixed(3),
        maxGrams: +(substrateMetrics.totalCopperGrams * 1.2).toFixed(3),
        typicalGrams: substrateMetrics.totalCopperGrams,
        sources: new Set(["PCB FR-4 Substrate Traces & Planes"]),
        confidenceSum: 0.92,
        count: 1,
      };

      // Add ENIG Gold flash if present
      if (substrateMetrics.goldMg > 0) {
        const goldGrams = substrateMetrics.goldMg / 1000;
        materialAggregator["Gold"] = {
          symbol: "Au",
          atomicNumber: 79,
          category: "PRECIOUS_METAL",
          minGrams: +(goldGrams * 0.6).toFixed(5),
          maxGrams: +(goldGrams * 1.4).toFixed(5),
          typicalGrams: goldGrams,
          sources: new Set(["PCB ENIG Surface Finish"]),
          confidenceSum: 0.85,
          count: 1,
        };
        preciousMetalsContributingCount["Gold"] += 1;
      }

      // Add solder from HASL/assembly
      if (substrateMetrics.solderGrams > 0) {
        materialAggregator["Tin"] = {
          symbol: "Sn",
          atomicNumber: 50,
          category: "BASE_METAL",
          minGrams: +(substrateMetrics.solderGrams * 0.7).toFixed(3),
          maxGrams: +(substrateMetrics.solderGrams * 1.3).toFixed(3),
          typicalGrams: substrateMetrics.solderGrams,
          sources: new Set(["PCB Surface Solder Finish"]),
          confidenceSum: 0.88,
          count: 1,
        };
      }
    }

    // Process components
    let detectedComponentsConfidenceSum = 0;

    for (const comp of components) {
      detectedComponentsConfidenceSum += comp.detectionConfidence || 0.85;
      const rule = findComponentComposition(comp.componentType, comp.packageType);
      const compMassGrams = comp.estimatedMassGrams || (rule ? rule.typicalMassGrams : 0.5);

      if (!rule) {
        // Unknown component in composition DB - transparently record without fabricating
        componentContributions.push({
          componentId: comp.componentId,
          componentType: comp.componentType,
          packageName: comp.packageType,
          partNumber: comp.partNumber,
          estimatedMassGrams: compMassGrams,
          recoveryPriority: "UNKNOWN",
          materials: [],
          confidence: 0.35,
          notes: "No authoritative composition rule found in database for this component type.",
        });
        continue;
      }

      let hasGold = false;
      let hasPalladium = false;
      let hasSilver = false;
      let copperMass = 0;

      const compMaterials: IComponentMaterialContribution["materials"] = [];

      for (const mat of rule.materials) {
        const estGrams = +(compMassGrams * mat.typicalFraction).toFixed(5);
        const minG = +(compMassGrams * mat.minFraction).toFixed(5);
        const maxG = +(compMassGrams * mat.maxFraction).toFixed(5);
        const recGrams = +(estGrams * (mat.category === "PRECIOUS_METAL" ? 0.85 : 0.90)).toFixed(5);

        compMaterials.push({
          material: mat.material,
          symbol: mat.symbol,
          category: mat.category,
          massFractionTypical: mat.typicalFraction,
          estimatedMassGrams: estGrams,
          recoverableMassGrams: recGrams,
          evidenceLevel: "DATABASE_DERIVED",
          confidence: mat.confidence,
        });

        if (mat.material === "Gold" && estGrams > 0.00005) {
          hasGold = true;
          preciousMetalsContributingCount["Gold"] += 1;
        }
        if (mat.material === "Palladium" && estGrams > 0.0001) {
          hasPalladium = true;
          preciousMetalsContributingCount["Palladium"] += 1;
        }
        if (mat.material === "Silver" && estGrams > 0.001) {
          hasSilver = true;
          preciousMetalsContributingCount["Silver"] += 1;
        }
        if (mat.material === "Copper") {
          copperMass += estGrams;
        }

        // Aggregate across board
        if (!materialAggregator[mat.material]) {
          materialAggregator[mat.material] = {
            symbol: mat.symbol,
            atomicNumber: mat.atomicNumber,
            category: mat.category,
            minGrams: minG,
            maxGrams: maxG,
            typicalGrams: estGrams,
            sources: new Set([mat.sourceReference]),
            confidenceSum: mat.confidence,
            count: 1,
          };
        } else {
          const entry = materialAggregator[mat.material];
          entry.minGrams += minG;
          entry.maxGrams += maxG;
          entry.typicalGrams += estGrams;
          entry.sources.add(mat.sourceReference);
          entry.confidenceSum += mat.confidence;
          entry.count += 1;
        }
      }

      // Determine Recovery Priority
      let priority: RecoveryPriority = "LOW";
      if (hasGold || hasPalladium) {
        priority = "HIGH";
      } else if (hasSilver || copperMass > 1.5 || comp.componentType.toLowerCase().includes("tantalum")) {
        priority = "MEDIUM";
      }

      componentContributions.push({
        componentId: comp.componentId,
        componentType: comp.componentType,
        packageName: comp.packageType,
        partNumber: comp.partNumber,
        estimatedMassGrams: compMassGrams,
        recoveryPriority: priority,
        materials: compMaterials,
        primaryRecoverableMetal: hasGold ? "Gold" : hasPalladium ? "Palladium" : hasSilver ? "Silver" : "Copper",
        confidence: rule.materials[0]?.confidence || 0.85,
        notes: `Database mapped: ${rule.materials.length} material fractions identified.`,
      });
    }

    // 4. BUILD MATERIAL SUMMARY, BASE METALS, PRECIOUS METALS, CRITICAL MATERIALS
    const materialSummary: IMaterialSummaryItem[] = [];
    const baseMetals: IMaterialSummaryItem[] = [];
    const criticalMaterials: IMaterialSummaryItem[] = [];

    let totalEstMaterialMass = 0;
    let totalRecMaterialMass = 0;

    for (const [matName, data] of Object.entries(materialAggregator)) {
      const avgConfidence = +(data.confidenceSum / data.count).toFixed(2);
      const typicalGrams = +data.typicalGrams.toFixed(matName === "Gold" || matName === "Palladium" ? 5 : 3);
      const minGrams = +data.minGrams.toFixed(matName === "Gold" || matName === "Palladium" ? 5 : 3);
      const maxGrams = +data.maxGrams.toFixed(matName === "Gold" || matName === "Palladium" ? 5 : 3);
      const recGrams = +(typicalGrams * (data.category === "PRECIOUS_METAL" ? 0.85 : 0.90)).toFixed(
        matName === "Gold" || matName === "Palladium" ? 5 : 3
      );

      totalEstMaterialMass += typicalGrams;
      totalRecMaterialMass += recGrams;

      const summaryItem: IMaterialSummaryItem = {
        material: matName,
        symbol: data.symbol,
        atomicNumber: data.atomicNumber,
        category: data.category,
        estimatedMassGrams: typicalGrams,
        minMassGrams: minGrams,
        maxMassGrams: maxGrams,
        recoverableMassGrams: recGrams,
        evidenceLevel: "DATABASE_DERIVED",
        confidence: avgConfidence,
        primarySources: Array.from(data.sources).slice(0, 3),
        unit: data.category === "PRECIOUS_METAL" ? "mg" : "g",
      };

      materialSummary.push(summaryItem);

      if (data.category === "BASE_METAL") {
        baseMetals.push(summaryItem);
      } else if (data.category === "CRITICAL_MATERIAL") {
        criticalMaterials.push(summaryItem);
      }
    }

    // 5. PRECIOUS METALS DEDICATED SECTION
    const auEntry = materialAggregator["Gold"];
    const agEntry = materialAggregator["Silver"];
    const pdEntry = materialAggregator["Palladium"];
    const ptEntry = materialAggregator["Platinum"];

    const preciousMetals: IPreciousMetalItem[] = [
      {
        metal: "Gold",
        symbol: "Au",
        presence: auEntry && auEntry.typicalGrams > 0 ? "DETECTED_ESTIMATED" : "INSUFFICIENT_EVIDENCE",
        estimatedMassMg: auEntry ? +(auEntry.typicalGrams * 1000).toFixed(2) : 0,
        minMassMg: auEntry ? +(auEntry.minGrams * 1000).toFixed(2) : 0,
        maxMassMg: auEntry ? +(auEntry.maxGrams * 1000).toFixed(2) : 0,
        recoverableMassMg: auEntry ? +(auEntry.typicalGrams * 1000 * 0.85).toFixed(2) : 0,
        typicalRecoveryRate: 0.85,
        evidenceLevel: auEntry ? "DATABASE_DERIVED" : "UNKNOWN",
        confidence: auEntry ? +(auEntry.confidenceSum / auEntry.count).toFixed(2) : 0.30,
        evidence: auEntry
          ? [
              { type: "DATABASE", source: "Component Composition Database v1.0", value: `${preciousMetalsContributingCount["Gold"]} contributing connectors/ICs` },
              { type: "COMPONENT_TYPE", source: "Vision Scan", value: "Gold-plated contacts / bond wire packaging observed" },
            ]
          : [{ type: "DATABASE", source: "Database", value: "No gold-bearing components detected in catalog" }],
        contributingComponentCount: preciousMetalsContributingCount["Gold"],
        indicativeMarketRateUSDPerGram: INDICATIVE_COMMODITY_BENCHMARKS.Au.priceUSDPerGram,
        indicativeEstimatedValueUSD: auEntry ? +(auEntry.typicalGrams * INDICATIVE_COMMODITY_BENCHMARKS.Au.priceUSDPerGram).toFixed(2) : 0,
      },
      {
        metal: "Silver",
        symbol: "Ag",
        presence: agEntry && agEntry.typicalGrams > 0 ? "DETECTED_ESTIMATED" : "INSUFFICIENT_EVIDENCE",
        estimatedMassMg: agEntry ? +(agEntry.typicalGrams * 1000).toFixed(2) : 0,
        minMassMg: agEntry ? +(agEntry.minGrams * 1000).toFixed(2) : 0,
        maxMassMg: agEntry ? +(agEntry.maxGrams * 1000).toFixed(2) : 0,
        recoverableMassMg: agEntry ? +(agEntry.typicalGrams * 1000 * 0.82).toFixed(2) : 0,
        typicalRecoveryRate: 0.82,
        evidenceLevel: agEntry ? "DATABASE_DERIVED" : "UNKNOWN",
        confidence: agEntry ? +(agEntry.confidenceSum / agEntry.count).toFixed(2) : 0.30,
        evidence: agEntry
          ? [
              { type: "DATABASE", source: "Component Composition Database v1.0", value: `${preciousMetalsContributingCount["Silver"]} contributing MLCC/IC terminations` },
            ]
          : [{ type: "DATABASE", source: "Database", value: "No silver-bearing terminations detected in catalog" }],
        contributingComponentCount: preciousMetalsContributingCount["Silver"],
        indicativeMarketRateUSDPerGram: INDICATIVE_COMMODITY_BENCHMARKS.Ag.priceUSDPerGram,
        indicativeEstimatedValueUSD: agEntry ? +(agEntry.typicalGrams * INDICATIVE_COMMODITY_BENCHMARKS.Ag.priceUSDPerGram).toFixed(2) : 0,
      },
      {
        metal: "Palladium",
        symbol: "Pd",
        presence: pdEntry && pdEntry.typicalGrams > 0 ? "DETECTED_ESTIMATED" : "INSUFFICIENT_EVIDENCE",
        estimatedMassMg: pdEntry ? +(pdEntry.typicalGrams * 1000).toFixed(2) : 0,
        minMassMg: pdEntry ? +(pdEntry.minGrams * 1000).toFixed(2) : 0,
        maxMassMg: pdEntry ? +(pdEntry.maxGrams * 1000).toFixed(2) : 0,
        recoverableMassMg: pdEntry ? +(pdEntry.typicalGrams * 1000 * 0.78).toFixed(2) : 0,
        typicalRecoveryRate: 0.78,
        evidenceLevel: pdEntry ? "DATABASE_DERIVED" : "UNKNOWN",
        confidence: pdEntry ? +(pdEntry.confidenceSum / pdEntry.count).toFixed(2) : 0.25,
        evidence: pdEntry
          ? [
              { type: "DATABASE", source: "Component Composition Database v1.0", value: `${preciousMetalsContributingCount["Palladium"]} ceramic MLCC components` },
            ]
          : [{ type: "DATABASE", source: "Database", value: "No ceramic MLCC array detected in catalog" }],
        contributingComponentCount: preciousMetalsContributingCount["Palladium"],
        indicativeMarketRateUSDPerGram: INDICATIVE_COMMODITY_BENCHMARKS.Pd.priceUSDPerGram,
        indicativeEstimatedValueUSD: pdEntry ? +(pdEntry.typicalGrams * INDICATIVE_COMMODITY_BENCHMARKS.Pd.priceUSDPerGram).toFixed(2) : 0,
      },
      {
        metal: "Platinum",
        symbol: "Pt",
        presence: ptEntry && ptEntry.typicalGrams > 0 ? "DETECTED_ESTIMATED" : "INSUFFICIENT_EVIDENCE",
        estimatedMassMg: ptEntry ? +(ptEntry.typicalGrams * 1000).toFixed(2) : 0,
        minMassMg: ptEntry ? +(ptEntry.minGrams * 1000).toFixed(2) : 0,
        maxMassMg: ptEntry ? +(ptEntry.maxGrams * 1000).toFixed(2) : 0,
        recoverableMassMg: ptEntry ? +(ptEntry.typicalGrams * 1000 * 0.75).toFixed(2) : 0,
        typicalRecoveryRate: 0.75,
        evidenceLevel: ptEntry ? "DATABASE_DERIVED" : "UNKNOWN",
        confidence: ptEntry ? 0.80 : 0.20,
        evidence: ptEntry
          ? [{ type: "DATABASE", source: "Database", value: "Platinum detected in specialty components" }]
          : [{ type: "DATABASE", source: "Database", value: "No platinum sensors or catalytic elements detected on board" }],
        contributingComponentCount: preciousMetalsContributingCount["Platinum"],
        indicativeMarketRateUSDPerGram: INDICATIVE_COMMODITY_BENCHMARKS.Pt.priceUSDPerGram,
        indicativeEstimatedValueUSD: ptEntry ? +(ptEntry.typicalGrams * INDICATIVE_COMMODITY_BENCHMARKS.Pt.priceUSDPerGram).toFixed(2) : 0,
      },
    ];

    // 6. MULTI-SCENARIO RECOVERY YIELDS
    const auEstMg = auEntry ? +(auEntry.typicalGrams * 1000).toFixed(2) : 0;
    const agEstMg = agEntry ? +(agEntry.typicalGrams * 1000).toFixed(2) : 0;
    const pdEstMg = pdEntry ? +(pdEntry.typicalGrams * 1000).toFixed(2) : 0;
    const ptEstMg = ptEntry ? +(ptEntry.typicalGrams * 1000).toFixed(2) : 0;

    const cuMass = materialAggregator["Copper"] ? materialAggregator["Copper"].typicalGrams : 0;
    const alMass = materialAggregator["Aluminum"] ? materialAggregator["Aluminum"].typicalGrams : 0;
    const snMass = materialAggregator["Tin"] ? materialAggregator["Tin"].typicalGrams : 0;
    const niMass = materialAggregator["Nickel"] ? materialAggregator["Nickel"].typicalGrams : 0;
    const feMass = materialAggregator["Iron"] ? materialAggregator["Iron"].typicalGrams : 0;

    const recoveryScenarios: IRecoveryScenarios = {
      conservative: {
        scenario: "conservative",
        description: "Mechanical shredding followed by bulk pyrometallurgical smelting.",
        assumption: "Coarse recovery, slag retention, and oxidation losses.",
        averageRecoveryEfficiency: 0.70,
        recoverableTotalMassGrams: +(totalEstMaterialMass * 0.70).toFixed(2),
        recoverablePreciousMetalsMg: {
          gold: +(auEstMg * 0.70).toFixed(2),
          silver: +(agEstMg * 0.65).toFixed(2),
          palladium: +(pdEstMg * 0.60).toFixed(2),
          platinum: +(ptEstMg * 0.60).toFixed(2),
        },
        recoverableBaseMetalsGrams: {
          copper: +(cuMass * 0.75).toFixed(2),
          aluminum: +(alMass * 0.60).toFixed(2),
          tin: +(snMass * 0.65).toFixed(2),
          nickel: +(niMass * 0.58).toFixed(2),
          iron: +(feMass * 0.70).toFixed(2),
        },
      },
      typical: {
        scenario: "typical",
        description: "Automated component desoldering and selective hydrometallurgical leaching.",
        assumption: "Industrial standard state-of-the-art chemical recovery yields.",
        averageRecoveryEfficiency: 0.85,
        recoverableTotalMassGrams: +(totalRecMaterialMass).toFixed(2),
        recoverablePreciousMetalsMg: {
          gold: +(auEstMg * 0.85).toFixed(2),
          silver: +(agEstMg * 0.82).toFixed(2),
          palladium: +(pdEstMg * 0.78).toFixed(2),
          platinum: +(ptEstMg * 0.75).toFixed(2),
        },
        recoverableBaseMetalsGrams: {
          copper: +(cuMass * 0.90).toFixed(2),
          aluminum: +(alMass * 0.85).toFixed(2),
          tin: +(snMass * 0.85).toFixed(2),
          nickel: +(niMass * 0.78).toFixed(2),
          iron: +(feMass * 0.82).toFixed(2),
        },
      },
      optimistic: {
        scenario: "optimistic",
        description: "Selective robotic desoldering, concentrated pin separation, and closed-loop bioleaching/electro-winning.",
        assumption: "Zero-loss pilot processing under controlled research laboratory parameters.",
        averageRecoveryEfficiency: 0.94,
        recoverableTotalMassGrams: +(totalEstMaterialMass * 0.94).toFixed(2),
        recoverablePreciousMetalsMg: {
          gold: +(auEstMg * 0.94).toFixed(2),
          silver: +(agEstMg * 0.92).toFixed(2),
          palladium: +(pdEstMg * 0.90).toFixed(2),
          platinum: +(ptEstMg * 0.90).toFixed(2),
        },
        recoverableBaseMetalsGrams: {
          copper: +(cuMass * 0.96).toFixed(2),
          aluminum: +(alMass * 0.94).toFixed(2),
          tin: +(snMass * 0.92).toFixed(2),
          nickel: +(niMass * 0.88).toFixed(2),
          iron: +(feMass * 0.92).toFixed(2),
        },
      },
    };

    // 7. DATA COMPLETENESS & CONFIDENCE CALCULATION
    const availableInputs: string[] = [];
    const missingInputs: string[] = [];

    if (input.boardMassGrams) availableInputs.push("Measured Board Mass");
    else missingInputs.push("Measured Board Mass (estimated from substrate/components)");

    if (components.length > 0) availableInputs.push(`${components.length} Detected Components`);
    else missingInputs.push("No component identifications");

    if (pcbInput.boardAreaCm2) availableInputs.push("PCB Physical Geometry & Area");
    else missingInputs.push("Physical PCB Board Dimensions");

    if (pcbInput.layerCount) availableInputs.push(`${pcbInput.layerCount}-Layer Stackup Geometry`);
    else missingInputs.push("Internal Layer Count (assumed standard 2-layer)");

    if (input.bom?.bomAvailable) availableInputs.push("Manufacturer Certified BOM");
    else missingInputs.push("Manufacturer BOM");

    missingInputs.push("Laboratory XRF / ICP-OES Chemical Assay");

    let completenessScore = 30;
    if (input.boardMassGrams) completenessScore += 25;
    if (components.length > 0) completenessScore += 25;
    if (pcbInput.boardAreaCm2) completenessScore += 15;
    if (input.bom?.bomAvailable) completenessScore += 15;
    completenessScore = Math.min(100, completenessScore);

    const avgDetectConf = components.length > 0 ? +(detectedComponentsConfidenceSum / components.length).toFixed(2) : 0.8;
    const overallConfidenceScore = +(
      (avgDetectConf * 0.35) +
      (massConfidence * 0.35) +
      ((completenessScore / 100) * 0.30)
    ).toFixed(2);

    const confidenceLevel =
      overallConfidenceScore >= 0.85
        ? "HIGH"
        : overallConfidenceScore >= 0.65
        ? "MEDIUM"
        : "LOW";

    const materialSources: IMaterialSourceRecord[] = [
      {
        material: "Copper",
        sourceType: "AUTHORITATIVE_DATABASE",
        reference: PCB_SUBSTRATE_STANDARD.sourceReference,
        qualityRating: "INDUSTRY_STANDARD",
      },
      {
        material: "Gold",
        sourceType: "LITERATURE",
        reference: "UNEP E-Waste Metallurgy Analysis / MIL-G-45204 Gold Plating Standard",
        qualityRating: "PEER_REVIEWED_LITERATURE",
      },
      {
        material: "Silver",
        sourceType: "LITERATURE",
        reference: "Materials Science & Engineering: MLCC Precious Metal Content",
        qualityRating: "PEER_REVIEWED_LITERATURE",
      },
      {
        material: "Palladium",
        sourceType: "LITERATURE",
        reference: "European Journal of Mineral Processing: Precious Metal Recovery from MLCCs",
        qualityRating: "PEER_REVIEWED_LITERATURE",
      },
    ];

    const limitations = [
      "Physical material quantities are derived from computer vision component counts cross-referenced with packaging databases.",
      "RGB photography cannot directly measure chemical concentrations, internal bond wire metals, or plating thicknesses.",
      "Material recovery efficiencies represent empirical scenarios (Conservative, Typical, Optimistic) and depend on specific industrial hydrometallurgical operations.",
      "No laboratory assay (XRF, ICP-OES, or fire assay) was performed on this specific physical board.",
    ];

    // Indicative values for legacy frontend compatibility
    let totalEstimatedMarketValueUSD = 0;
    for (const item of materialSummary) {
      const benchmark = INDICATIVE_COMMODITY_BENCHMARKS[item.symbol as keyof typeof INDICATIVE_COMMODITY_BENCHMARKS];
      if (benchmark) {
        if ("priceUSDPerGram" in benchmark) {
          totalEstimatedMarketValueUSD += item.estimatedMassGrams * benchmark.priceUSDPerGram;
        } else if ("priceUSDPerKg" in benchmark) {
          totalEstimatedMarketValueUSD += (item.estimatedMassGrams / 1000) * benchmark.priceUSDPerKg;
        }
      }
    }
    totalEstimatedMarketValueUSD = +totalEstimatedMarketValueUSD.toFixed(2);
    const totalEstimatedMarketValueINR = Math.round(totalEstimatedMarketValueUSD * 86.5);

    const legacyMaterials: IMaterialItem[] = materialSummary.map((m) => {
      const benchmark = INDICATIVE_COMMODITY_BENCHMARKS[m.symbol as keyof typeof INDICATIVE_COMMODITY_BENCHMARKS];
      const rateUSD = benchmark ? ("priceUSDPerGram" in benchmark ? benchmark.priceUSDPerGram : benchmark.priceUSDPerKg / 1000) : 1;
      const rateINR = Math.round(rateUSD * 86.5);
      return {
        material: m.material,
        symbol: m.symbol,
        atomicNum: m.atomicNumber,
        estimatedQuantity: m.estimatedMassGrams,
        unit: m.unit,
        marketRateINR: rateINR,
        marketRateUnit: "₹/" + m.unit,
        estimatedValueINR: Math.round(m.estimatedMassGrams * rateINR),
        confidence: m.confidence,
        method: "ESTIMATION",
        source: "DATABASE_DERIVED",
      };
    });

    return {
      analysisId,
      status: "COMPLETED",
      boardMass: massBasis,
      materialSummary,
      preciousMetals,
      baseMetals,
      criticalMaterials,
      totalEstimatedMaterialMassGrams: +totalEstMaterialMass.toFixed(2),
      totalRecoverableMaterialMassGrams: +totalRecMaterialMass.toFixed(2),
      recoveryScenarios,
      componentContributions,
      confidence: {
        score: overallConfidenceScore,
        level: confidenceLevel,
        factors: {
          componentDetectionConfidence: avgDetectConf,
          compositionSourceQuality: 0.88,
          massConfidence,
          metadataCompleteness: +(completenessScore / 100).toFixed(2),
        },
      },
      dataCompleteness: {
        score: completenessScore,
        percentage: completenessScore,
        availableInputs,
        missingInputs,
      },
      materialSources,
      limitations,
      provider: "database",
      modelVersion: this.modelVersion,
      databaseVersion: this.databaseVersion,
      pcbWeightKg: +(massValue / 1000).toFixed(3),
      recoveryEfficiencyPercent: 85.0,
      totalEstimatedMarketValueINR,
      totalEstimatedMarketValueUSD,
      materials: legacyMaterials,
      method: "ESTIMATION",
      source: "DATABASE_DERIVED",
    };
  }

  private buildInsufficientDataResult(analysisId: string): MaterialRecoveryResult {
    return {
      analysisId,
      status: "INSUFFICIENT_DATA",
      boardMass: {
        massValue: 0,
        massUnit: "g",
        massSource: "ESTIMATED",
        massConfidence: 0.1,
        estimatedBoardMassGrams: 0,
        calculationMethod: "INSUFFICIENT_DATA",
      },
      materialSummary: [],
      preciousMetals: [
        {
          metal: "Gold",
          symbol: "Au",
          presence: "INSUFFICIENT_EVIDENCE",
          estimatedMassMg: 0,
          minMassMg: 0,
          maxMassMg: 0,
          recoverableMassMg: 0,
          typicalRecoveryRate: 0.85,
          evidenceLevel: "UNKNOWN",
          confidence: 0.1,
          evidence: [{ type: "DATABASE", source: "Vision Pipeline", value: "No components detected and no board dimensions provided." }],
          contributingComponentCount: 0,
        },
        {
          metal: "Silver",
          symbol: "Ag",
          presence: "INSUFFICIENT_EVIDENCE",
          estimatedMassMg: 0,
          minMassMg: 0,
          maxMassMg: 0,
          recoverableMassMg: 0,
          typicalRecoveryRate: 0.82,
          evidenceLevel: "UNKNOWN",
          confidence: 0.1,
          evidence: [{ type: "DATABASE", source: "Vision Pipeline", value: "No components detected." }],
          contributingComponentCount: 0,
        },
        {
          metal: "Palladium",
          symbol: "Pd",
          presence: "INSUFFICIENT_EVIDENCE",
          estimatedMassMg: 0,
          minMassMg: 0,
          maxMassMg: 0,
          recoverableMassMg: 0,
          typicalRecoveryRate: 0.78,
          evidenceLevel: "UNKNOWN",
          confidence: 0.1,
          evidence: [{ type: "DATABASE", source: "Vision Pipeline", value: "No MLCC components detected." }],
          contributingComponentCount: 0,
        },
        {
          metal: "Platinum",
          symbol: "Pt",
          presence: "INSUFFICIENT_EVIDENCE",
          estimatedMassMg: 0,
          minMassMg: 0,
          maxMassMg: 0,
          recoverableMassMg: 0,
          typicalRecoveryRate: 0.75,
          evidenceLevel: "UNKNOWN",
          confidence: 0.1,
          evidence: [{ type: "DATABASE", source: "Vision Pipeline", value: "No platinum sensors detected." }],
          contributingComponentCount: 0,
        },
      ],
      baseMetals: [],
      criticalMaterials: [],
      totalEstimatedMaterialMassGrams: 0,
      totalRecoverableMaterialMassGrams: 0,
      recoveryScenarios: {
        conservative: {
          scenario: "conservative",
          description: "Insufficient data to compute conservative scenario.",
          assumption: "None",
          averageRecoveryEfficiency: 0,
          recoverableTotalMassGrams: 0,
          recoverablePreciousMetalsMg: { gold: 0, silver: 0, palladium: 0, platinum: 0 },
          recoverableBaseMetalsGrams: { copper: 0, aluminum: 0, tin: 0, nickel: 0, iron: 0 },
        },
        typical: {
          scenario: "typical",
          description: "Insufficient data to compute typical scenario.",
          assumption: "None",
          averageRecoveryEfficiency: 0,
          recoverableTotalMassGrams: 0,
          recoverablePreciousMetalsMg: { gold: 0, silver: 0, palladium: 0, platinum: 0 },
          recoverableBaseMetalsGrams: { copper: 0, aluminum: 0, tin: 0, nickel: 0, iron: 0 },
        },
        optimistic: {
          scenario: "optimistic",
          description: "Insufficient data to compute optimistic scenario.",
          assumption: "None",
          averageRecoveryEfficiency: 0,
          recoverableTotalMassGrams: 0,
          recoverablePreciousMetalsMg: { gold: 0, silver: 0, palladium: 0, platinum: 0 },
          recoverableBaseMetalsGrams: { copper: 0, aluminum: 0, tin: 0, nickel: 0, iron: 0 },
        },
      },
      componentContributions: [],
      confidence: {
        score: 0.1,
        level: "UNKNOWN",
        factors: {
          componentDetectionConfidence: 0,
          compositionSourceQuality: 0,
          massConfidence: 0,
          metadataCompleteness: 0,
        },
      },
      dataCompleteness: {
        score: 5,
        percentage: 5,
        availableInputs: [],
        missingInputs: ["Components", "Board Geometry", "Mass", "BOM", "Assay"],
      },
      materialSources: [],
      limitations: [
        "Material composition cannot be estimated reliably from the available evidence.",
        "Zero components and zero physical board dimensions were detected.",
        "Please provide a clearer scan, upload a board image, or submit manufacturer BOM metadata.",
      ],
      provider: "database",
      modelVersion: this.modelVersion,
      databaseVersion: this.databaseVersion,
      pcbWeightKg: 0,
      recoveryEfficiencyPercent: 0,
      totalEstimatedMarketValueINR: 0,
      totalEstimatedMarketValueUSD: 0,
      materials: [],
      method: "ESTIMATION",
      source: "DATABASE_DERIVED",
    };
  }
}

// ============================================================================
// 3. MATERIAL RECOVERY SERVICE (Unified Gateway)
// ============================================================================
export class MaterialRecoveryService {
  private mockProvider = new MockMaterialRecoveryProvider();
  private databaseProvider = new DatabaseMaterialRecoveryProvider();

  public getProvider(): MaterialRecoveryProvider {
    const configured = (process.env.MATERIAL_PROVIDER || "mock").toLowerCase().trim();

    if (configured === "database") {
      return this.databaseProvider;
    }

    if (configured === "mock") {
      return this.mockProvider;
    }

    throw new Error(
      `Unsupported MATERIAL_PROVIDER: "${configured}". Supported values are "mock" and "database".`
    );
  }

  async estimate(input: MaterialRecoveryInput): Promise<MaterialRecoveryResult> {
    const provider = this.getProvider();
    return provider.estimate(input);
  }

  async getModelInfo(): Promise<ModelInfo> {
    const provider = this.getProvider();
    return provider.getModelInfo();
  }
}

export const materialRecoveryService = new MaterialRecoveryService();
export default materialRecoveryService;

// Backward compatibility aliases
export { MockMaterialRecoveryProvider as DemoMaterialProvider };
export type { MaterialRecoveryProvider as MaterialProvider };

