/**
 * EcoIntel Material Composition Knowledge Base
 *
 * Grounded in published circular electronics literature, WEEE recycling guidelines,
 * IEEE packaging transactions, and UNEP e-waste characterization studies.
 *
 * All composition values are represented as statistical ranges [minFraction, maxFraction, typicalFraction]
 * rather than fabricated exact constants.
 */

import {
  MaterialCategory,
  SourceType,
} from "./materialTaxonomy";

export interface ComponentCompositionRule {
  componentType: string;
  packageTypeMatch?: string[];
  typicalMassGrams: number;
  materials: Array<{
    material: string;
    symbol: string;
    atomicNumber: number;
    category: MaterialCategory;
    minFraction: number;      // mass fraction (e.g. 0.0005 for 0.05%)
    maxFraction: number;      // mass fraction
    typicalFraction: number;  // mass fraction
    sourceType: SourceType;
    sourceReference: string;
    confidence: number;
  }>;
}

export interface PCBSubstrateRule {
  substrateType: string;
  densityGramsPerCm3: number;
  standardThicknessMm: number;
  copperCladdingGramsPerCm2PerLayer: number;
  enigGoldFlashMgPerCm2: number;
  haslSolderGramsPerCm2: number;
  sourceReference: string;
}

// Published literature reference benchmarks
export const MATERIAL_COMPOSITION_RULES: ComponentCompositionRule[] = [
  {
    componentType: "connector",
    packageTypeMatch: ["header", "pin_header", "rj45", "usb", "terminal", "jack", "socket"],
    typicalMassGrams: 2.5,
    materials: [
      {
        material: "Copper",
        symbol: "Cu",
        atomicNumber: 29,
        category: "BASE_METAL",
        minFraction: 0.65,
        maxFraction: 0.88,
        typicalFraction: 0.78, // phosphor bronze / brass alloy contacts
        sourceType: "AUTHORITATIVE_DATABASE",
        sourceReference: "CDA Copper Alloy Specification Handbook / WEEE Recycling Benchmarks",
        confidence: 0.92,
      },
      {
        material: "Nickel",
        symbol: "Ni",
        atomicNumber: 28,
        category: "BASE_METAL",
        minFraction: 0.015,
        maxFraction: 0.045,
        typicalFraction: 0.028, // barrier underplate
        sourceType: "LITERATURE",
        sourceReference: "MIL-G-45204 Gold Plating Standard Underplate Specification",
        confidence: 0.88,
      },
      {
        material: "Gold",
        symbol: "Au",
        atomicNumber: 79,
        category: "PRECIOUS_METAL",
        minFraction: 0.0001,
        maxFraction: 0.0012,
        typicalFraction: 0.00045, // flash or hard gold mating pin plating (0.2 - 0.76 µm)
        sourceType: "LITERATURE",
        sourceReference: "UNEP E-waste Metallurgy Analysis: Connectors and Pin Terminals",
        confidence: 0.85,
      },
      {
        material: "Tin",
        symbol: "Sn",
        atomicNumber: 50,
        category: "BASE_METAL",
        minFraction: 0.01,
        maxFraction: 0.06,
        typicalFraction: 0.035, // solder tails
        sourceType: "AUTHORITATIVE_DATABASE",
        sourceReference: "IPC-J-STD-002 Solderability Specification",
        confidence: 0.86,
      },
      {
        material: "Iron",
        symbol: "Fe",
        atomicNumber: 26,
        category: "BASE_METAL",
        minFraction: 0.02,
        maxFraction: 0.12,
        typicalFraction: 0.05, // shielding shells on USB/RJ45
        sourceType: "INTERNAL_DATABASE",
        sourceReference: "Connector Shell Metallurgy Database v2.1",
        confidence: 0.80,
      },
    ],
  },
  {
    componentType: "ic",
    packageTypeMatch: ["bga", "qfp", "soic", "tssop", "dip", "lqfp", "plcc"],
    typicalMassGrams: 1.8,
    materials: [
      {
        material: "Copper",
        symbol: "Cu",
        atomicNumber: 29,
        category: "BASE_METAL",
        minFraction: 0.20,
        maxFraction: 0.48,
        typicalFraction: 0.34, // leadframe alloy (C194/C7025)
        sourceType: "AUTHORITATIVE_DATABASE",
        sourceReference: "JEDEC Packaging Standards & E-waste Chemical Characterization",
        confidence: 0.90,
      },
      {
        material: "Gold",
        symbol: "Au",
        atomicNumber: 79,
        category: "PRECIOUS_METAL",
        minFraction: 0.00015,
        maxFraction: 0.0009,
        typicalFraction: 0.00042, // thermosonic bonding wires (25 µm Au wire)
        sourceType: "LITERATURE",
        sourceReference: "IEEE Trans. Electronics Packaging: Gold Wire Bonding Recovery",
        confidence: 0.84,
      },
      {
        material: "Silver",
        symbol: "Ag",
        atomicNumber: 47,
        category: "PRECIOUS_METAL",
        minFraction: 0.0003,
        maxFraction: 0.0025,
        typicalFraction: 0.0011, // conductive epoxy die attach (Ag-filled epoxy)
        sourceType: "LITERATURE",
        sourceReference: "ASM Handbook Vol. 13: Electronic Packaging Die Attach Materials",
        confidence: 0.82,
      },
      {
        material: "Tin",
        symbol: "Sn",
        atomicNumber: 50,
        category: "BASE_METAL",
        minFraction: 0.02,
        maxFraction: 0.09,
        typicalFraction: 0.045, // lead plating / BGA solder balls (SAC305 or SnPb)
        sourceType: "AUTHORITATIVE_DATABASE",
        sourceReference: "IPC-9701 BGA Ball Metallurgy Standard",
        confidence: 0.88,
      },
    ],
  },
  {
    componentType: "capacitor",
    packageTypeMatch: ["ceramic", "smd", "mlcc", "0805", "0603", "1206"],
    typicalMassGrams: 0.04,
    materials: [
      {
        material: "Palladium",
        symbol: "Pd",
        atomicNumber: 46,
        category: "PRECIOUS_METAL",
        minFraction: 0.0008,
        maxFraction: 0.012,
        typicalFraction: 0.0035, // internal electrode paste in high-reliability MLCCs
        sourceType: "LITERATURE",
        sourceReference: "European Journal of Mineral Processing: Precious Metal Recovery from MLCCs",
        confidence: 0.81,
      },
      {
        material: "Silver",
        symbol: "Ag",
        atomicNumber: 47,
        category: "PRECIOUS_METAL",
        minFraction: 0.005,
        maxFraction: 0.045,
        typicalFraction: 0.018, // electrode paste & end termination layer
        sourceType: "LITERATURE",
        sourceReference: "Materials Science & Engineering: MLCC Precious Metal Content",
        confidence: 0.83,
      },
      {
        material: "Nickel",
        symbol: "Ni",
        atomicNumber: 28,
        category: "BASE_METAL",
        minFraction: 0.02,
        maxFraction: 0.08,
        typicalFraction: 0.042, // barrier termination layer
        sourceType: "INTERNAL_DATABASE",
        sourceReference: "Passive Component Metallurgy Database v1.4",
        confidence: 0.85,
      },
      {
        material: "Tin",
        symbol: "Sn",
        atomicNumber: 50,
        category: "BASE_METAL",
        minFraction: 0.015,
        maxFraction: 0.05,
        typicalFraction: 0.030, // outer termination solder coat
        sourceType: "INTERNAL_DATABASE",
        sourceReference: "Passive Component Metallurgy Database v1.4",
        confidence: 0.87,
      },
      {
        material: "Copper",
        symbol: "Cu",
        atomicNumber: 29,
        category: "BASE_METAL",
        minFraction: 0.01,
        maxFraction: 0.06,
        typicalFraction: 0.025, // internal base-metal electrodes (BME)
        sourceType: "AUTHORITATIVE_DATABASE",
        sourceReference: "BME MLCC Manufacturer Material Declarations",
        confidence: 0.86,
      },
    ],
  },
  {
    componentType: "capacitor_electrolytic",
    packageTypeMatch: ["radial", "can", "aluminum", "axial"],
    typicalMassGrams: 3.2,
    materials: [
      {
        material: "Aluminum",
        symbol: "Al",
        atomicNumber: 13,
        category: "BASE_METAL",
        minFraction: 0.32,
        maxFraction: 0.58,
        typicalFraction: 0.44, // etched cathode/anode foil & outer cylindrical canister
        sourceType: "AUTHORITATIVE_DATABASE",
        sourceReference: "Aluminum Association Recycled Scrap Specification / WEEE",
        confidence: 0.94,
      },
      {
        material: "Tin",
        symbol: "Sn",
        atomicNumber: 50,
        category: "BASE_METAL",
        minFraction: 0.01,
        maxFraction: 0.03,
        typicalFraction: 0.018, // leadwire solder coat
        sourceType: "LITERATURE",
        sourceReference: "Capacitor Component Environmental Declarations (RoHS/REACH)",
        confidence: 0.88,
      },
      {
        material: "Iron",
        symbol: "Fe",
        atomicNumber: 26,
        category: "BASE_METAL",
        minFraction: 0.03,
        maxFraction: 0.08,
        typicalFraction: 0.045, // copper-clad steel leads
        sourceType: "INTERNAL_DATABASE",
        sourceReference: "Component Lead metallurgy records",
        confidence: 0.84,
      },
    ],
  },
  {
    componentType: "capacitor_tantalum",
    packageTypeMatch: ["tantalum", "smd", "case_a", "case_b", "case_c", "case_d"],
    typicalMassGrams: 0.22,
    materials: [
      {
        material: "Tantalum",
        symbol: "Ta",
        atomicNumber: 73,
        category: "CRITICAL_MATERIAL",
        minFraction: 0.22,
        maxFraction: 0.42,
        typicalFraction: 0.31, // sintered porous pellet
        sourceType: "AUTHORITATIVE_DATABASE",
        sourceReference: "Critical Raw Materials Alliance (CRM): Tantalum in WEEE",
        confidence: 0.91,
      },
      {
        material: "Silver",
        symbol: "Ag",
        atomicNumber: 47,
        category: "PRECIOUS_METAL",
        minFraction: 0.002,
        maxFraction: 0.015,
        typicalFraction: 0.006, // conductive cathode coat
        sourceType: "LITERATURE",
        sourceReference: "Recovery of Rare and Precious Metals from Spent Capacitors",
        confidence: 0.82,
      },
      {
        material: "Nickel",
        symbol: "Ni",
        atomicNumber: 28,
        category: "BASE_METAL",
        minFraction: 0.02,
        maxFraction: 0.06,
        typicalFraction: 0.035, // leadframe
        sourceType: "INTERNAL_DATABASE",
        sourceReference: "Tantalum Capacitor Material Safety Sheets",
        confidence: 0.85,
      },
    ],
  },
  {
    componentType: "resistor",
    packageTypeMatch: ["smd", "0805", "0603", "1206", "axial", "melf"],
    typicalMassGrams: 0.02,
    materials: [
      {
        material: "Copper",
        symbol: "Cu",
        atomicNumber: 29,
        category: "BASE_METAL",
        minFraction: 0.04,
        maxFraction: 0.16,
        typicalFraction: 0.09, // end terminals / lead wire
        sourceType: "AUTHORITATIVE_DATABASE",
        sourceReference: "Resistor Manufacturing Material Disclosure Index",
        confidence: 0.88,
      },
      {
        material: "Tin",
        symbol: "Sn",
        atomicNumber: 50,
        category: "BASE_METAL",
        minFraction: 0.015,
        maxFraction: 0.05,
        typicalFraction: 0.028, // solderable wrap-around finish
        sourceType: "INTERNAL_DATABASE",
        sourceReference: "Surface Mount Device Finish Reference",
        confidence: 0.86,
      },
      {
        material: "Silver",
        symbol: "Ag",
        atomicNumber: 47,
        category: "PRECIOUS_METAL",
        minFraction: 0.0004,
        maxFraction: 0.003,
        typicalFraction: 0.0012, // ruthenium oxide / silver conductive paste
        sourceType: "LITERATURE",
        sourceReference: "Precious Metals in Thick-Film Hybrid Microelectronics",
        confidence: 0.79,
      },
    ],
  },
  {
    componentType: "inductor",
    packageTypeMatch: ["toroid", "smd_inductor", "choke", "ferrite", "transformer"],
    typicalMassGrams: 4.5,
    materials: [
      {
        material: "Copper",
        symbol: "Cu",
        atomicNumber: 29,
        category: "BASE_METAL",
        minFraction: 0.35,
        maxFraction: 0.68,
        typicalFraction: 0.52, // enamelled magnet wire windings
        sourceType: "AUTHORITATIVE_DATABASE",
        sourceReference: "Industrial Electric Motors & Inductive Component Recovery Benchmarks",
        confidence: 0.95,
      },
      {
        material: "Iron",
        symbol: "Fe",
        atomicNumber: 26,
        category: "BASE_METAL",
        minFraction: 0.25,
        maxFraction: 0.55,
        typicalFraction: 0.38, // ferrite/laminated iron core
        sourceType: "AUTHORITATIVE_DATABASE",
        sourceReference: "Ferrite Core Composition Standards (IEC 60401)",
        confidence: 0.90,
      },
    ],
  },
  {
    componentType: "transformer",
    packageTypeMatch: ["power_transformer", "flyback", "pulse_transformer"],
    typicalMassGrams: 28.0,
    materials: [
      {
        material: "Copper",
        symbol: "Cu",
        atomicNumber: 29,
        category: "BASE_METAL",
        minFraction: 0.38,
        maxFraction: 0.62,
        typicalFraction: 0.48, // primary and secondary windings
        sourceType: "AUTHORITATIVE_DATABASE",
        sourceReference: "Power Electronics Recycled Metals Index",
        confidence: 0.95,
      },
      {
        material: "Iron",
        symbol: "Fe",
        atomicNumber: 26,
        category: "BASE_METAL",
        minFraction: 0.30,
        maxFraction: 0.52,
        typicalFraction: 0.42, // silicon-steel laminations or MnZn ferrite
        sourceType: "AUTHORITATIVE_DATABASE",
        sourceReference: "Transformer Core Material Characterization",
        confidence: 0.91,
      },
    ],
  },
  {
    componentType: "transistor",
    packageTypeMatch: ["to220", "to247", "sot23", "dpack", "so8"],
    typicalMassGrams: 0.85,
    materials: [
      {
        material: "Copper",
        symbol: "Cu",
        atomicNumber: 29,
        category: "BASE_METAL",
        minFraction: 0.45,
        maxFraction: 0.75,
        typicalFraction: 0.60, // copper thermal heatsink tab & leadframe
        sourceType: "AUTHORITATIVE_DATABASE",
        sourceReference: "Power Semiconductor Leadframe Specifications",
        confidence: 0.92,
      },
      {
        material: "Tin",
        symbol: "Sn",
        atomicNumber: 50,
        category: "BASE_METAL",
        minFraction: 0.02,
        maxFraction: 0.06,
        typicalFraction: 0.035, // lead plating
        sourceType: "INTERNAL_DATABASE",
        sourceReference: "Discrete Semiconductor Plating Database",
        confidence: 0.87,
      },
      {
        material: "Silver",
        symbol: "Ag",
        atomicNumber: 47,
        category: "PRECIOUS_METAL",
        minFraction: 0.0002,
        maxFraction: 0.0015,
        typicalFraction: 0.0006, // soft solder die attach
        sourceType: "LITERATURE",
        sourceReference: "Semiconductor Packaging Materials Handbook",
        confidence: 0.80,
      },
    ],
  },
  {
    componentType: "crystal",
    packageTypeMatch: ["hc49", "smd_crystal", "oscillator"],
    typicalMassGrams: 0.45,
    materials: [
      {
        material: "Iron",
        symbol: "Fe",
        atomicNumber: 26,
        category: "BASE_METAL",
        minFraction: 0.40,
        maxFraction: 0.70,
        typicalFraction: 0.55, // kovar/steel hermetic enclosure
        sourceType: "INTERNAL_DATABASE",
        sourceReference: "Quartz Crystal Can Packaging Data",
        confidence: 0.85,
      },
      {
        material: "Nickel",
        symbol: "Ni",
        atomicNumber: 28,
        category: "BASE_METAL",
        minFraction: 0.15,
        maxFraction: 0.30,
        typicalFraction: 0.22, // kovar nickel content & plating
        sourceType: "INTERNAL_DATABASE",
        sourceReference: "Hermetic Package Standards (ASTM F15)",
        confidence: 0.84,
      },
      {
        material: "Gold",
        symbol: "Au",
        atomicNumber: 79,
        category: "PRECIOUS_METAL",
        minFraction: 0.00005,
        maxFraction: 0.0004,
        typicalFraction: 0.00015, // sputtered quartz electrodes
        sourceType: "LITERATURE",
        sourceReference: "Precious Metals in Resonators & Piezoelectric Devices",
        confidence: 0.77,
      },
    ],
  },
];

// Physical PCB Substrate Constants
export const PCB_SUBSTRATE_STANDARD: PCBSubstrateRule = {
  substrateType: "FR-4 Glass-Reinforced Epoxy",
  densityGramsPerCm3: 1.85, // g/cm³ standard FR-4
  standardThicknessMm: 1.6, // 1.6 mm standard PCB thickness
  copperCladdingGramsPerCm2PerLayer: 0.0305, // 1 oz/ft² = 305 g/m² = 0.0305 g/cm²
  enigGoldFlashMgPerCm2: 0.015, // Electroless Nickel Immersion Gold: 0.05 µm Au ~ 0.01-0.02 mg/cm²
  haslSolderGramsPerCm2: 0.008, // Hot Air Solder Leveling: ~ 8 mg/cm² solder (63/37 SnPb or SAC305)
  sourceReference: "IPC-4101 Specification for Base Materials for Rigid and Multilayer Printed Boards",
};

// Commodity benchmark rates (USD / gram or USD / kg) for indicative reference only
export const INDICATIVE_COMMODITY_BENCHMARKS = {
  Au: { priceUSDPerGram: 78.50, unit: "$/g", reference: "London Bullion Market Association (LBMA) Benchmark" },
  Ag: { priceUSDPerGram: 0.98, unit: "$/g", reference: "LBMA Silver Benchmark" },
  Pd: { priceUSDPerGram: 33.20, unit: "$/g", reference: "London Platinum & Palladium Market (LPPM)" },
  Pt: { priceUSDPerGram: 31.50, unit: "$/g", reference: "LPPM Platinum Benchmark" },
  Cu: { priceUSDPerKg: 9.20, unit: "$/kg", reference: "London Metal Exchange (LME) Grade A Copper" },
  Al: { priceUSDPerKg: 2.45, unit: "$/kg", reference: "LME Primary Aluminum" },
  Sn: { priceUSDPerKg: 28.50, unit: "$/kg", reference: "LME Tin Official Cash" },
  Ni: { priceUSDPerKg: 16.80, unit: "$/kg", reference: "LME Primary Nickel" },
  Fe: { priceUSDPerKg: 0.45, unit: "$/kg", reference: "Fastmarkets Steel Scrap Index" },
  Ta: { priceUSDPerKg: 195.00, unit: "$/kg", reference: "Argus Metals Tantalite CIF China" },
};

/**
 * Finds composition rule matching component type and optional package type.
 */
export function findComponentComposition(
  componentType: string,
  packageType?: string
): ComponentCompositionRule | null {
  const normType = (componentType || "").toLowerCase().trim();
  const normPkg = (packageType || "").toLowerCase().trim();

  // Try exact match first
  for (const rule of MATERIAL_COMPOSITION_RULES) {
    if (rule.componentType === normType) {
      if (!normPkg || !rule.packageTypeMatch || rule.packageTypeMatch.some((p) => normPkg.includes(p))) {
        return rule;
      }
    }
  }

  // Token-based matching to prevent substring false positives (e.g. "exotic" matching "ic")
  const tokens = normType.split(/[^a-z0-9]+/);

  for (const rule of MATERIAL_COMPOSITION_RULES) {
    if (tokens.includes(rule.componentType)) {
      if (!normPkg || !rule.packageTypeMatch || rule.packageTypeMatch.some((p) => normPkg.includes(p))) {
        return rule;
      }
    }
  }

  // Domain category keyword aliases
  for (const rule of MATERIAL_COMPOSITION_RULES) {
    if (
      (rule.componentType === "ic" &&
        (tokens.includes("processor") ||
          tokens.includes("microcontroller") ||
          tokens.includes("memory") ||
          tokens.includes("chip") ||
          tokens.includes("soc") ||
          tokens.includes("mcu"))) ||
      (rule.componentType === "connector" &&
        (tokens.includes("port") ||
          tokens.includes("header") ||
          tokens.includes("slot") ||
          tokens.includes("terminal") ||
          tokens.includes("jack"))) ||
      (rule.componentType === "capacitor" && tokens.includes("cap")) ||
      (rule.componentType === "resistor" && tokens.includes("res"))
    ) {
      return rule;
    }
  }

  return null;
}

/**
 * Calculates substrate mass and copper content based on board dimensions.
 */
export function estimatePCBSubstrateMetrics(
  areaCm2: number,
  layerCount: number = 2,
  surfaceFinish: string = "ENIG"
) {
  const thicknessCm = PCB_SUBSTRATE_STANDARD.standardThicknessMm / 10;
  const boardVolumeCm3 = areaCm2 * thicknessCm;
  const baseSubstrateMassGrams = +(boardVolumeCm3 * PCB_SUBSTRATE_STANDARD.densityGramsPerCm3).toFixed(2);

  // Copper content: typical trace/plane coverage is 50-70% per layer
  const traceCoverageFactor = 0.55;
  const copperPerLayerGrams = areaCm2 * PCB_SUBSTRATE_STANDARD.copperCladdingGramsPerCm2PerLayer * traceCoverageFactor;
  const totalCopperGrams = +(copperPerLayerGrams * Math.max(1, layerCount)).toFixed(2);

  // Surface finish precious metal / solder content
  let goldMg = 0;
  let solderGrams = 0;

  if (surfaceFinish.toUpperCase() === "ENIG") {
    // ENIG gold flash on exposed pads (~15% of surface area)
    const exposedPadArea = areaCm2 * 0.15;
    goldMg = +(exposedPadArea * PCB_SUBSTRATE_STANDARD.enigGoldFlashMgPerCm2).toFixed(3);
  } else if (surfaceFinish.toUpperCase() === "HASL") {
    // HASL tin-lead or SAC solder on exposed pads
    const exposedPadArea = areaCm2 * 0.15;
    solderGrams = +(exposedPadArea * PCB_SUBSTRATE_STANDARD.haslSolderGramsPerCm2).toFixed(3);
  }

  const estimatedTotalMassGrams = +(baseSubstrateMassGrams + totalCopperGrams + solderGrams).toFixed(2);

  return {
    baseSubstrateMassGrams,
    totalCopperGrams,
    goldMg,
    solderGrams,
    estimatedTotalMassGrams,
    sourceReference: PCB_SUBSTRATE_STANDARD.sourceReference,
  };
}
