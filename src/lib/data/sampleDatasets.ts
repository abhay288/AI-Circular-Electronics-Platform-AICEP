export interface SampleDataset {
  id: string;
  name: string;
  deviceType: string;
  category: string;
  componentCount: number;
  image: string;
  description: string;
  hardwareSpecs: {
    dimensions: string;
    layers: number;
    substrate: string;
    copperWeightOz: number;
    voltageRating: string;
  };
  detection: {
    model: string;
    inferenceTimeMs: number;
    confidenceAvg: number;
    componentsCount: number;
    components: Array<{
      id: string;
      name: string;
      type: string;
      manufacturer: string;
      package: string;
      confidence: number;
      health: number;
      remainingLifeHours: number;
      remainingLifeYears: number;
      material: string;
      coordinates: { x: number; y: number; width: number; height: number };
      status: string;
      passportId: string;
      repairRecommendation: string;
    }>;
  };
  reconstruction: {
    pcbId: string;
    boardModel: string;
    layerCount: number;
    traceIntegrityPercent: number;
    severedTracesRepaired: number;
    reconstructionConfidence: number;
    schematics: {
      kicadFileUrl: string;
      gerberZipUrl: string;
      netlistRaw: string;
    };
  };
  rul: {
    overallHealthScore: number;
    predictedYears: number;
    predictedHours: number;
    failureProbability: number;
    confidence: number;
    parameters: {
      operatingTempCelsius: number;
      inputVoltageVolts: number;
      operatingCycles: number;
      ageYears: number;
    };
  };
  metals: {
    pcbWeightKg: number;
    recoveryEfficiencyPercent: number;
    totalEstimatedMarketValueUSD: number;
    yields: Array<{
      metal: string;
      symbol: string;
      yieldGrams: number;
      marketRateUSD: number;
      estimatedValueUSD: number;
      color: string;
    }>;
  };
  repair: {
    reportId: string;
    recommendedAction: "reuse" | "repair" | "refurbish" | "recover" | "recycle";
    primaryFault: string;
    estimatedRepairCostUSD: number;
    estimatedCO2SavingsKg: number;
    feasibilityIndexPercent: number;
    issues: Array<{
      component: string;
      issue: string;
      severity: "low" | "medium" | "high" | "critical";
      recommendation: string;
      action: string;
    }>;
  };
  passport: {
    passportId: string;
    tokenId: string;
    blockchainStatus: "Verified on Polygon" | "Passport Ready" | "Verification Pending";
    polygonTransactionHash?: string;
    contractAddress: string;
    originFacility: string;
    manufactureYear: number;
    reuseCycleCount: number;
    isVerified: boolean;
    qrDataUri: string;
  };
  carbon: {
    co2AvoidedKg: number;
    energySavedKWh: number;
    waterSavedLiters: number;
    eWasteDivertedKg: number;
    circularityScorePercent: number;
  };
  executiveSummary: {
    overallHealthPercent: number;
    classification: string;
    potentialValueUSD: number;
    estimatedRemainingLifeYears: number;
    componentsDetectedCount: number;
    recommendedAction: string;
  };
}

export const SAMPLE_DATASETS: Record<string, SampleDataset> = {
  "laptop-motherboard": {
    id: "laptop-motherboard",
    name: "Consumer Laptop Mainboard",
    deviceType: "Laptop Motherboard",
    category: "Computing & IT",
    componentCount: 48,
    image: "/images/samples/laptop_motherboard.jpg",
    description: "Multi-layer high-density consumer notebook mainboard with dual DDR5 slots, integrated graphics chip, VRM phases, and embedded controller.",
    hardwareSpecs: {
      dimensions: "210 x 140 mm",
      layers: 8,
      substrate: "FR-4 High-Tg (170°C)",
      copperWeightOz: 2,
      voltageRating: "19.5V DC / 65W-100W",
    },
    detection: {
      model: "YOLOv11-SpectroSpatial-v4.2 (50-Micron Laser Scan)",
      inferenceTimeMs: 64,
      confidenceAvg: 97.4,
      componentsCount: 48,
      components: [
        {
          id: "comp_core_01",
          name: "Intel Core i7-1260P BGA Processor",
          type: "CPU / SoC",
          manufacturer: "Intel Corporation",
          package: "FCBGA1744",
          confidence: 99.4,
          health: 94,
          remainingLifeHours: 58000,
          remainingLifeYears: 6.6,
          material: "Silicon, Gold Bond Wires, Copper Substrate",
          coordinates: { x: 42, y: 12, width: 16, height: 18 },
          status: "Certified Reusable",
          passportId: "PASSPORT-CORE-9821",
          repairRecommendation: "Inspect thermal TIM paste application; silicon pristine.",
        },
        {
          id: "comp_ram_01",
          name: "Samsung 16GB DDR5 SO-DIMM Module",
          type: "Memory",
          manufacturer: "Samsung Semiconductor",
          package: "262-pin SO-DIMM",
          confidence: 98.9,
          health: 96,
          remainingLifeHours: 72000,
          remainingLifeYears: 8.2,
          material: "Gold Fingers, Copper Traces, Silicon",
          coordinates: { x: 26, y: 56, width: 38, height: 16 },
          status: "Certified Reusable",
          passportId: "PASSPORT-RAM-4410",
          repairRecommendation: "Gold contact pads intact; zero oxidation detected.",
        },
        {
          id: "comp_mosfet_01",
          name: "Vishay SiRA20DP TrenchFET N-Channel MOSFET",
          type: "Power FET",
          manufacturer: "Vishay Intertechnology",
          package: "PowerPAK SO-8",
          confidence: 96.8,
          health: 79,
          remainingLifeHours: 29000,
          remainingLifeYears: 3.3,
          material: "Copper Leadframe, Tin Plating, Silicon",
          coordinates: { x: 14, y: 54, width: 6, height: 6 },
          status: "Component Swap Advised",
          passportId: "PASSPORT-FET-1092",
          repairRecommendation: "Thermal stress detected at gate terminal. Solder reflow or replacement recommended.",
        },
        {
          id: "comp_flash_01",
          name: "Winbond W25Q128JW 128Mb SPI Flash ROM",
          type: "Flash Memory",
          manufacturer: "Winbond Electronics",
          package: "WSON-8 6x5mm",
          confidence: 98.2,
          health: 91,
          remainingLifeHours: 51000,
          remainingLifeYears: 5.8,
          material: "Silicon, Copper Leads",
          coordinates: { x: 74, y: 64, width: 8, height: 8 },
          status: "Certified Reusable",
          passportId: "PASSPORT-ROM-7723",
          repairRecommendation: "Endurance cycles < 5%. Firmware checksum valid.",
        },
        {
          id: "comp_cap_vrm",
          name: "Solid Polymer Decoupling Capacitors (x8)",
          type: "Capacitor Array",
          manufacturer: "Murata Manufacturing",
          package: "SMD 0805 High-Q",
          confidence: 97.1,
          health: 93,
          remainingLifeHours: 64000,
          remainingLifeYears: 7.3,
          material: "Barium Titanate, Nickel, Tin",
          coordinates: { x: 12, y: 62, width: 9, height: 14 },
          status: "Good Operational",
          passportId: "PASSPORT-CAP-3319",
          repairRecommendation: "Zero dielectric breakdown observed across all 8 nodes.",
        },
        {
          id: "comp_io_usbc",
          name: "Amphenol USB-C PD 3.0 Receptacle",
          type: "Connector",
          manufacturer: "Amphenol Commercial",
          package: "24-Pin Mid-Mount",
          confidence: 95.7,
          health: 86,
          remainingLifeHours: 35000,
          remainingLifeYears: 4.0,
          material: "Gold Plated Copper Alloy, Stainless Shell",
          coordinates: { x: 92, y: 78, width: 6, height: 12 },
          status: "Good Operational",
          passportId: "PASSPORT-CONN-8812",
          repairRecommendation: "Cycle count approximately 3,200 insertions. Pin integrity solid.",
        },
      ],
    },
    reconstruction: {
      pcbId: "PCB-REC-LPT-8941",
      boardModel: "Dell Latitude / XPS Rev 4.2",
      layerCount: 8,
      traceIntegrityPercent: 96.8,
      severedTracesRepaired: 3,
      reconstructionConfidence: 0.985,
      schematics: {
        kicadFileUrl: "/downloads/schematics/PCB-REC-LPT-8941.kicad_pcb",
        gerberZipUrl: "/downloads/schematics/PCB-REC-LPT-8941_gerber.zip",
        netlistRaw: "NET 'VCC_CORE_1V8' COMP 'CORE_I7':A14 COMP 'VRM_PHASE1':OUT;\nNET 'DDR5_CLK_P' COMP 'CORE_I7':B22 COMP 'SODIMM_1':14;\nNET 'PCIE_TX0_P' COMP 'CORE_I7':F04 COMP 'M2_SLOT':21;\nNET 'GND' COMP 'GND_PLANE':1 COMP 'DECOUPLING_ALL':2;",
      },
    },
    rul: {
      overallHealthScore: 92,
      predictedYears: 6.4,
      predictedHours: 56000,
      failureProbability: 0.08,
      confidence: 0.94,
      parameters: {
        operatingTempCelsius: 48,
        inputVoltageVolts: 19.5,
        operatingCycles: 3400,
        ageYears: 2.1,
      },
    },
    metals: {
      pcbWeightKg: 0.28,
      recoveryEfficiencyPercent: 98.6,
      totalEstimatedMarketValueUSD: 18.70,
      yields: [
        { metal: "Gold (Au)", symbol: "Au", yieldGrams: 0.165, marketRateUSD: 78.40, estimatedValueUSD: 12.94, color: "#B88900" },
        { metal: "Silver (Ag)", symbol: "Ag", yieldGrams: 0.82, marketRateUSD: 0.95, estimatedValueUSD: 0.78, color: "#64748B" },
        { metal: "Copper (Cu)", symbol: "Cu", yieldGrams: 42.5, marketRateUSD: 0.009, estimatedValueUSD: 0.38, color: "#C2410C" },
        { metal: "Palladium (Pd)", symbol: "Pd", yieldGrams: 0.094, marketRateUSD: 49.20, estimatedValueUSD: 4.62, color: "#2563EB" },
      ],
    },
    repair: {
      reportId: "REP-2026-LPT-994",
      recommendedAction: "refurbish",
      primaryFault: "Thermal stress detected on VRM Phase 2 MOSFET",
      estimatedRepairCostUSD: 14.50,
      estimatedCO2SavingsKg: 28.4,
      feasibilityIndexPercent: 92,
      issues: [
        {
          component: "Charging / VRM MOSFET (SiRA20DP)",
          issue: "Thermal degradation detected (>85°C localized cycle trace)",
          severity: "medium",
          recommendation: "Replace with upgraded low-RDSon Vishay MOSFET",
          action: "Component Swap",
        },
        {
          component: "CPU Thermal Interface",
          issue: "Dried phase-change thermal pad",
          severity: "low",
          recommendation: "Clean with isopropyl alcohol and re-apply thermal paste",
          action: "Refurbish",
        },
      ],
    },
    passport: {
      passportId: "ECO-PASSPORT-2026-8941",
      tokenId: "78491",
      blockchainStatus: "Passport Ready",
      polygonTransactionHash: "0x3f9821aa904b77c38df48324bf8b2a19e5cd6f112288114400eefb319aa50291",
      contractAddress: "0x3B82F6e71C7656EC7ab88b098defB751B7401B5f",
      originFacility: "EcoIntel Circular Inspection Lab 01",
      manufactureYear: 2024,
      reuseCycleCount: 1,
      isVerified: true,
      qrDataUri: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23ffffff'/><rect x='10' y='10' width='30' height='30' fill='%230f172a'/><rect x='60' y='10' width='30' height='30' fill='%230f172a'/><rect x='10' y='60' width='30' height='30' fill='%230f172a'/><rect x='20' y='20' width='10' height='10' fill='%23ffffff'/><rect x='70' y='20' width='10' height='10' fill='%23ffffff'/><rect x='20' y='70' width='10' height='10' fill='%23ffffff'/><rect x='50' y='50' width='15' height='15' fill='%232563eb'/></svg>",
    },
    carbon: {
      co2AvoidedKg: 34.6,
      energySavedKWh: 82.4,
      waterSavedLiters: 320,
      eWasteDivertedKg: 0.28,
      circularityScorePercent: 94.2,
    },
    executiveSummary: {
      overallHealthPercent: 92,
      classification: "Reusable",
      potentialValueUSD: 18.70,
      estimatedRemainingLifeYears: 6.4,
      componentsDetectedCount: 48,
      recommendedAction: "Refurbish VRM and re-certify for secondary laptop assembly.",
    },
  },

  "iot-controller": {
    id: "iot-controller",
    name: "ESP32 / Sensor Controller",
    deviceType: "IoT Controller",
    category: "Embedded & Edge",
    componentCount: 26,
    image: "/images/samples/iot_controller.jpg",
    description: "Compact dual-core Wi-Fi/Bluetooth IoT sensor node featuring ESP-WROOM-32, CP2102 USB bridge, and LDO power regulation.",
    hardwareSpecs: {
      dimensions: "52 x 28 mm",
      layers: 2,
      substrate: "FR-4 Double Sided",
      copperWeightOz: 1,
      voltageRating: "3.3V / 5V USB",
    },
    detection: {
      model: "YOLOv11-SpectroSpatial-v4.2",
      inferenceTimeMs: 38,
      confidenceAvg: 98.1,
      componentsCount: 26,
      components: [
        {
          id: "comp_esp32_01",
          name: "Espressif ESP-WROOM-32U Module",
          type: "Microcontroller / RF",
          manufacturer: "Espressif Systems",
          package: "SMD-38",
          confidence: 99.1,
          health: 97,
          remainingLifeHours: 85000,
          remainingLifeYears: 9.7,
          material: "Silicon, Nickel-Silver Shield, Gold Leads",
          coordinates: { x: 50, y: 28, width: 44, height: 46 },
          status: "Certified Reusable",
          passportId: "PASSPORT-ESP-3291",
          repairRecommendation: "RF shield hermetic seal intact; flash memory zero bad sectors.",
        },
        {
          id: "comp_uart_01",
          name: "Silicon Labs CP2102 USB-to-UART Bridge",
          type: "Interface IC",
          manufacturer: "Silicon Labs",
          package: "QFN-28",
          confidence: 98.4,
          health: 95,
          remainingLifeHours: 78000,
          remainingLifeYears: 8.9,
          material: "Silicon, Copper Traces",
          coordinates: { x: 22, y: 44, width: 12, height: 14 },
          status: "Certified Reusable",
          passportId: "PASSPORT-UART-1102",
          repairRecommendation: "All UART pins passing loopback impedance tests.",
        },
        {
          id: "comp_ldo_01",
          name: "AMS1117-3.3 Linear Voltage Regulator",
          type: "Power Regulator",
          manufacturer: "Advanced Monolithic Systems",
          package: "SOT-223",
          confidence: 97.9,
          health: 93,
          remainingLifeHours: 62000,
          remainingLifeYears: 7.1,
          material: "Silicon, Copper Tab",
          coordinates: { x: 34, y: 62, width: 10, height: 12 },
          status: "Certified Reusable",
          passportId: "PASSPORT-LDO-5520",
          repairRecommendation: "Thermal junction dissipation within nominal 42°C envelope.",
        },
        {
          id: "comp_xtal_01",
          name: "40.000 MHz SMD Crystal Oscillator",
          type: "Resonator",
          manufacturer: "TXC Corporation",
          package: "HC-49SMD / 3225",
          confidence: 98.8,
          health: 98,
          remainingLifeHours: 92000,
          remainingLifeYears: 10.5,
          material: "Quartz Crystal, Gold Electrodes, Ceramic",
          coordinates: { x: 42, y: 40, width: 8, height: 18 },
          status: "Certified Reusable",
          passportId: "PASSPORT-XTAL-8891",
          repairRecommendation: "Frequency drift < 2 ppm. Fully calibrated.",
        },
      ],
    },
    reconstruction: {
      pcbId: "PCB-REC-IOT-4120",
      boardModel: "ESP32 DevKit v4 Node",
      layerCount: 2,
      traceIntegrityPercent: 99.4,
      severedTracesRepaired: 0,
      reconstructionConfidence: 0.995,
      schematics: {
        kicadFileUrl: "/downloads/schematics/PCB-REC-IOT-4120.kicad_pcb",
        gerberZipUrl: "/downloads/schematics/PCB-REC-IOT-4120_gerber.zip",
        netlistRaw: "NET '3V3' COMP 'AMS1117':2 COMP 'ESP32':2 COMP 'CP2102':6;\nNET 'GND' COMP 'ESP32':1 COMP 'USB':5 COMP 'CAP_DEC':2;",
      },
    },
    rul: {
      overallHealthScore: 96,
      predictedYears: 9.2,
      predictedHours: 81000,
      failureProbability: 0.04,
      confidence: 0.97,
      parameters: {
        operatingTempCelsius: 38,
        inputVoltageVolts: 3.3,
        operatingCycles: 1200,
        ageYears: 1.0,
      },
    },
    metals: {
      pcbWeightKg: 0.045,
      recoveryEfficiencyPercent: 99.1,
      totalEstimatedMarketValueUSD: 3.85,
      yields: [
        { metal: "Gold (Au)", symbol: "Au", yieldGrams: 0.032, marketRateUSD: 78.40, estimatedValueUSD: 2.51, color: "#B88900" },
        { metal: "Silver (Ag)", symbol: "Ag", yieldGrams: 0.18, marketRateUSD: 0.95, estimatedValueUSD: 0.17, color: "#64748B" },
        { metal: "Copper (Cu)", symbol: "Cu", yieldGrams: 12.4, marketRateUSD: 0.009, estimatedValueUSD: 0.11, color: "#C2410C" },
        { metal: "Palladium (Pd)", symbol: "Pd", yieldGrams: 0.021, marketRateUSD: 49.20, estimatedValueUSD: 1.03, color: "#2563EB" },
      ],
    },
    repair: {
      reportId: "REP-2026-IOT-412",
      recommendedAction: "reuse",
      primaryFault: "None. All subsystems operational within factory tolerance.",
      estimatedRepairCostUSD: 0.00,
      estimatedCO2SavingsKg: 6.8,
      feasibilityIndexPercent: 99,
      issues: [
        {
          component: "Micro-USB Port",
          issue: "Minor surface dust on contact spring pins",
          severity: "low",
          recommendation: "Sonic alcohol wash bath",
          action: "Clean",
        },
      ],
    },
    passport: {
      passportId: "ECO-PASSPORT-2026-4120",
      tokenId: "41208",
      blockchainStatus: "Passport Ready",
      polygonTransactionHash: "0x98124bcefa019238472390123891482934810239481203948123049182304918",
      contractAddress: "0x3B82F6e71C7656EC7ab88b098defB751B7401B5f",
      originFacility: "EcoIntel Modular Ingest Lab 02",
      manufactureYear: 2025,
      reuseCycleCount: 0,
      isVerified: true,
      qrDataUri: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23ffffff'/><rect x='10' y='10' width='30' height='30' fill='%230f172a'/><rect x='60' y='10' width='30' height='30' fill='%230f172a'/><rect x='10' y='60' width='30' height='30' fill='%230f172a'/><circle cx='50' cy='50' r='12' fill='%2316a34a'/></svg>",
    },
    carbon: {
      co2AvoidedKg: 8.4,
      energySavedKWh: 18.2,
      waterSavedLiters: 95,
      eWasteDivertedKg: 0.045,
      circularityScorePercent: 98.1,
    },
    executiveSummary: {
      overallHealthPercent: 96,
      classification: "Reusable",
      potentialValueUSD: 3.85,
      estimatedRemainingLifeYears: 9.2,
      componentsDetectedCount: 26,
      recommendedAction: "Direct reuse in educational, agricultural, or environmental IoT sensors.",
    },
  },

  "power-supply": {
    id: "power-supply",
    name: "AC/DC Power Supply PCB",
    deviceType: "Power Supply Board",
    category: "Power Electronics",
    componentCount: 34,
    image: "/images/samples/power_supply.jpg",
    description: "Industrial 24V 5A switched-mode power supply featuring high-voltage Rubycon filter capacitors, isolated transformer, and dual heatsinks.",
    hardwareSpecs: {
      dimensions: "160 x 120 mm",
      layers: 2,
      substrate: "CEM-3 / FR-4 Flame Retardant",
      copperWeightOz: 3,
      voltageRating: "100-240V AC to 24V DC / 120W",
    },
    detection: {
      model: "YOLOv11-SpectroSpatial-v4.2",
      inferenceTimeMs: 46,
      confidenceAvg: 96.9,
      componentsCount: 34,
      components: [
        {
          id: "comp_cap_bulk_01",
          name: "Rubycon 450V 120uF High-Temp Electrolytic",
          type: "Electrolytic Capacitor",
          manufacturer: "Rubycon Corporation",
          package: "Radial Can 18x35mm",
          confidence: 98.7,
          health: 84,
          remainingLifeHours: 32000,
          remainingLifeYears: 3.6,
          material: "Aluminum, Electrolyte Foil, Rubber Seal",
          coordinates: { x: 42, y: 14, width: 9, height: 22 },
          status: "Acceptable Condition",
          passportId: "PASSPORT-CAP-9912",
          repairRecommendation: "Equivalent Series Resistance (ESR) increased by 14%. Good for 3+ years.",
        },
        {
          id: "comp_xfmr_01",
          name: "SNPS High-Frequency Ferrite Transformer",
          type: "Transformer",
          manufacturer: "TDK / EPCOS",
          package: "EEL25 Core",
          confidence: 97.8,
          health: 96,
          remainingLifeHours: 85000,
          remainingLifeYears: 9.7,
          material: "Ferrite Core, Enameled Copper Wire, Kapton Tape",
          coordinates: { x: 52, y: 40, width: 18, height: 20 },
          status: "Certified Reusable",
          passportId: "PASSPORT-XFMR-0012",
          repairRecommendation: "Isolation breakdown test passed 3.75 kV dielectric strength.",
        },
        {
          id: "comp_ind_toroid",
          name: "Toroidal Common-Mode Choke Inductor",
          type: "Inductor",
          manufacturer: "Würth Elektronik",
          package: "Toroid 28mm",
          confidence: 98.1,
          health: 98,
          remainingLifeHours: 95000,
          remainingLifeYears: 10.8,
          material: "Iron Powder Core, Heavy Copper Wire",
          coordinates: { x: 48, y: 64, width: 16, height: 22 },
          status: "Certified Reusable",
          passportId: "PASSPORT-IND-7711",
          repairRecommendation: "Zero magnetic saturation damage; copper winding undamaged.",
        },
        {
          id: "comp_rect_01",
          name: "KBJ810 8A 1000V Glass Passivated Bridge Rectifier",
          type: "Diode Bridge",
          manufacturer: "Diodes Incorporated",
          package: "KBJ-4 Thru-Hole",
          confidence: 97.3,
          health: 89,
          remainingLifeHours: 46000,
          remainingLifeYears: 5.2,
          material: "Silicon, Copper Leads, Epoxy",
          coordinates: { x: 26, y: 20, width: 8, height: 12 },
          status: "Certified Reusable",
          passportId: "PASSPORT-RECT-3301",
          repairRecommendation: "Forward voltage drop 0.92V nominal. Safe for redeployment.",
        },
      ],
    },
    reconstruction: {
      pcbId: "PCB-REC-PWR-3310",
      boardModel: "SMPS 24V-5A Rev 1.4",
      layerCount: 2,
      traceIntegrityPercent: 94.2,
      severedTracesRepaired: 1,
      reconstructionConfidence: 0.978,
      schematics: {
        kicadFileUrl: "/downloads/schematics/PCB-REC-PWR-3310.kicad_pcb",
        gerberZipUrl: "/downloads/schematics/PCB-REC-PWR-3310_gerber.zip",
        netlistRaw: "NET 'AC_LINE' COMP 'FUSE_F1':1 COMP 'X2_CAP':1;\nNET 'DC_HIGH_BUS' COMP 'KBJ810':+ COMP 'RUBYCON_CAP1':+;\nNET 'SEC_24V_OUT' COMP 'SCHOTTKY_HS2':K COMP 'OUTPUT_TERM':1;",
      },
    },
    rul: {
      overallHealthScore: 88,
      predictedYears: 5.1,
      predictedHours: 44000,
      failureProbability: 0.12,
      confidence: 0.92,
      parameters: {
        operatingTempCelsius: 58,
        inputVoltageVolts: 230.0,
        operatingCycles: 4800,
        ageYears: 3.4,
      },
    },
    metals: {
      pcbWeightKg: 0.42,
      recoveryEfficiencyPercent: 97.4,
      totalEstimatedMarketValueUSD: 11.20,
      yields: [
        { metal: "Gold (Au)", symbol: "Au", yieldGrams: 0.045, marketRateUSD: 78.40, estimatedValueUSD: 3.53, color: "#B88900" },
        { metal: "Silver (Ag)", symbol: "Ag", yieldGrams: 0.65, marketRateUSD: 0.95, estimatedValueUSD: 0.62, color: "#64748B" },
        { metal: "Copper (Cu)", symbol: "Cu", yieldGrams: 168.0, marketRateUSD: 0.009, estimatedValueUSD: 1.51, color: "#C2410C" },
        { metal: "Aluminum (Al)", symbol: "Al", yieldGrams: 145.0, marketRateUSD: 0.0024, estimatedValueUSD: 0.35, color: "#94A3B8" },
        { metal: "Palladium (Pd)", symbol: "Pd", yieldGrams: 0.105, marketRateUSD: 49.20, estimatedValueUSD: 5.17, color: "#2563EB" },
      ],
    },
    repair: {
      reportId: "REP-2026-PWR-882",
      recommendedAction: "refurbish",
      primaryFault: "Capacitor ESR aging on secondary filter output stage",
      estimatedRepairCostUSD: 8.50,
      estimatedCO2SavingsKg: 22.0,
      feasibilityIndexPercent: 88,
      issues: [
        {
          component: "Secondary 24V Output Filter Caps",
          issue: "Mild ripple voltage increase (approx. 45mV higher than stock)",
          severity: "low",
          recommendation: "Recap secondary electrolytic capacitors with low-ESR Nichicon units",
          action: "Capacitor Swap",
        },
      ],
    },
    passport: {
      passportId: "ECO-PASSPORT-2026-3310",
      tokenId: "33109",
      blockchainStatus: "Passport Ready",
      polygonTransactionHash: "0x1102948239048123049812039481203948120394812039481203948120394812",
      contractAddress: "0x3B82F6e71C7656EC7ab88b098defB751B7401B5f",
      originFacility: "EcoIntel Heavy Ingest Lab 03",
      manufactureYear: 2023,
      reuseCycleCount: 1,
      isVerified: true,
      qrDataUri: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23ffffff'/><rect x='10' y='10' width='30' height='30' fill='%230f172a'/><rect x='60' y='10' width='30' height='30' fill='%230f172a'/><rect x='10' y='60' width='30' height='30' fill='%230f172a'/><path d='M40 50 L50 60 L65 40' stroke='%23d97706' stroke-width='6' fill='none'/></svg>",
    },
    carbon: {
      co2AvoidedKg: 24.8,
      energySavedKWh: 64.0,
      waterSavedLiters: 210,
      eWasteDivertedKg: 0.42,
      circularityScorePercent: 91.5,
    },
    executiveSummary: {
      overallHealthPercent: 88,
      classification: "Repairable",
      potentialValueUSD: 11.20,
      estimatedRemainingLifeYears: 5.1,
      componentsDetectedCount: 34,
      recommendedAction: "Recap secondary filter stages and redeploy into industrial cabinet lighting.",
    },
  },

  "industrial-controller": {
    id: "industrial-controller",
    name: "Industrial Control Board",
    deviceType: "Industrial Controller",
    category: "Automation & Robotics",
    componentCount: 52,
    image: "/images/samples/industrial_controller.jpg",
    description: "Ruggedized industrial PLC controller featuring optocoupled digital isolated I/O, RS-485 transceiver, and dual microcontroller supervisors.",
    hardwareSpecs: {
      dimensions: "180 x 130 mm",
      layers: 4,
      substrate: "FR-4 Industrial Grade Conformal Coated",
      copperWeightOz: 2,
      voltageRating: "24V DC Industrial Bus",
    },
    detection: {
      model: "YOLOv11-SpectroSpatial-v4.2",
      inferenceTimeMs: 58,
      confidenceAvg: 97.6,
      componentsCount: 52,
      components: [
        {
          id: "comp_stm32_01",
          name: "STMicroelectronics STM32F407VGT6 Cortex-M4",
          type: "Microcontroller",
          manufacturer: "STMicroelectronics",
          package: "LQFP-100",
          confidence: 99.2,
          health: 95,
          remainingLifeHours: 74000,
          remainingLifeYears: 8.4,
          material: "Silicon, Copper Leadframe, Gold Wire",
          coordinates: { x: 38, y: 32, width: 22, height: 22 },
          status: "Certified Reusable",
          passportId: "PASSPORT-STM-4071",
          repairRecommendation: "Zero latch-up events logged. Internal clock stability ±1 ppm.",
        },
        {
          id: "comp_opto_array",
          name: "Broadcom HCPL-0630 Dual High-Speed Optocouplers",
          type: "Optoisolator",
          manufacturer: "Broadcom Limited",
          package: "SOIC-8",
          confidence: 98.3,
          health: 92,
          remainingLifeHours: 61000,
          remainingLifeYears: 7.0,
          material: "GaAs LED, Photodiode, Silicon",
          coordinates: { x: 18, y: 44, width: 14, height: 10 },
          status: "Certified Reusable",
          passportId: "PASSPORT-OPTO-0922",
          repairRecommendation: "Current Transfer Ratio (CTR) degradation within 6% of new.",
        },
      ],
    },
    reconstruction: {
      pcbId: "PCB-REC-IND-9021",
      boardModel: "Siemens Simatic Compatible Node",
      layerCount: 4,
      traceIntegrityPercent: 98.1,
      severedTracesRepaired: 0,
      reconstructionConfidence: 0.991,
      schematics: {
        kicadFileUrl: "/downloads/schematics/PCB-REC-IND-9021.kicad_pcb",
        gerberZipUrl: "/downloads/schematics/PCB-REC-IND-9021_gerber.zip",
        netlistRaw: "NET 'ISO_VCC' COMP 'DCDC_ISOLATED':OUT COMP 'OPTO_ALL':VCC;\nNET 'CAN_H' COMP 'MCP2551':CANH COMP 'TERM_RES':1;",
      },
    },
    rul: {
      overallHealthScore: 94,
      predictedYears: 7.8,
      predictedHours: 68000,
      failureProbability: 0.06,
      confidence: 0.95,
      parameters: {
        operatingTempCelsius: 42,
        inputVoltageVolts: 24.0,
        operatingCycles: 2600,
        ageYears: 2.5,
      },
    },
    metals: {
      pcbWeightKg: 0.38,
      recoveryEfficiencyPercent: 98.2,
      totalEstimatedMarketValueUSD: 16.40,
      yields: [
        { metal: "Gold (Au)", symbol: "Au", yieldGrams: 0.145, marketRateUSD: 78.40, estimatedValueUSD: 11.37, color: "#B88900" },
        { metal: "Silver (Ag)", symbol: "Ag", yieldGrams: 0.72, marketRateUSD: 0.95, estimatedValueUSD: 0.68, color: "#64748B" },
        { metal: "Copper (Cu)", symbol: "Cu", yieldGrams: 58.0, marketRateUSD: 0.009, estimatedValueUSD: 0.52, color: "#C2410C" },
        { metal: "Palladium (Pd)", symbol: "Pd", yieldGrams: 0.078, marketRateUSD: 49.20, estimatedValueUSD: 3.84, color: "#2563EB" },
      ],
    },
    repair: {
      reportId: "REP-2026-IND-551",
      recommendedAction: "reuse",
      primaryFault: "Conformal coating discoloration near terminal rail",
      estimatedRepairCostUSD: 5.00,
      estimatedCO2SavingsKg: 31.2,
      feasibilityIndexPercent: 96,
      issues: [
        {
          component: "Screw Terminal Rail",
          issue: "Minor mechanical wear on thread clamp",
          severity: "low",
          recommendation: "Tighten contact torque to factory spec",
          action: "Inspect",
        },
      ],
    },
    passport: {
      passportId: "ECO-PASSPORT-2026-9021",
      tokenId: "90214",
      blockchainStatus: "Passport Ready",
      polygonTransactionHash: "0x7721839481023948120394812304918230491823049182304918230491823049",
      contractAddress: "0x3B82F6e71C7656EC7ab88b098defB751B7401B5f",
      originFacility: "EcoIntel Factory Grade Lab 05",
      manufactureYear: 2024,
      reuseCycleCount: 0,
      isVerified: true,
      qrDataUri: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23ffffff'/><rect x='10' y='10' width='30' height='30' fill='%230f172a'/><rect x='60' y='10' width='30' height='30' fill='%230f172a'/><rect x='10' y='60' width='30' height='30' fill='%230f172a'/><rect x='45' y='45' width='20' height='20' fill='%232563eb'/></svg>",
    },
    carbon: {
      co2AvoidedKg: 38.0,
      energySavedKWh: 94.0,
      waterSavedLiters: 380,
      eWasteDivertedKg: 0.38,
      circularityScorePercent: 96.0,
    },
    executiveSummary: {
      overallHealthPercent: 94,
      classification: "Reusable",
      potentialValueUSD: 16.40,
      estimatedRemainingLifeYears: 7.8,
      componentsDetectedCount: 52,
      recommendedAction: "Recertify conformal coating and deploy in smart grid or wastewater automation.",
    },
  },

  "smartphone-pcb": {
    id: "smartphone-pcb",
    name: "Smartphone PCB",
    deviceType: "Mobile Device Mainboard",
    category: "Mobile Hardware",
    componentCount: 64,
    image: "/images/samples/smartphone_pcb.jpg",
    description: "Ultra-dense 10-layer substrate mobile device logic board with stacked application processor, PMIC, and sub-6GHz 5G front-end modules.",
    hardwareSpecs: {
      dimensions: "98 x 38 mm",
      layers: 10,
      substrate: "Substrate-Like PCB (SLP) Any-Layer HDI",
      copperWeightOz: 0.5,
      voltageRating: "3.85V Li-Ion Battery Bus",
    },
    detection: {
      model: "YOLOv11-SpectroSpatial-v4.2 (Sub-50 Micron)",
      inferenceTimeMs: 72,
      confidenceAvg: 98.4,
      componentsCount: 64,
      components: [
        {
          id: "comp_soc_mobile",
          name: "Qualcomm Snapdragon 8-Series SoC (PoP)",
          type: "Application Processor",
          manufacturer: "Qualcomm / TSMC",
          package: "Package-on-Package BGA",
          confidence: 99.5,
          health: 93,
          remainingLifeHours: 54000,
          remainingLifeYears: 6.2,
          material: "Silicon, Gold Bumps, Copper RDL",
          coordinates: { x: 30, y: 25, width: 28, height: 26 },
          status: "Certified Reusable",
          passportId: "PASSPORT-SNAP-8812",
          repairRecommendation: "Underfill polymer intact; no micro-cracking around peripheral solder balls.",
        },
        {
          id: "comp_pmic_01",
          name: "Qualcomm PM8350 Power Management IC",
          type: "PMIC",
          manufacturer: "Qualcomm",
          package: "WLCSP-144",
          confidence: 98.6,
          health: 91,
          remainingLifeHours: 49000,
          remainingLifeYears: 5.6,
          material: "Wafer Level Chip Scale Silicon",
          coordinates: { x: 62, y: 35, width: 14, height: 16 },
          status: "Certified Reusable",
          passportId: "PASSPORT-PMIC-3312",
          repairRecommendation: "Thermal throttle cycles < 180 lifetime. All buck rails within 1.2% V-spec.",
        },
      ],
    },
    reconstruction: {
      pcbId: "PCB-REC-MOB-1104",
      boardModel: "Flagship Mobile Tier-1 Substrate",
      layerCount: 10,
      traceIntegrityPercent: 97.5,
      severedTracesRepaired: 2,
      reconstructionConfidence: 0.982,
      schematics: {
        kicadFileUrl: "/downloads/schematics/PCB-REC-MOB-1104.kicad_pcb",
        gerberZipUrl: "/downloads/schematics/PCB-REC-MOB-1104_gerber.zip",
        netlistRaw: "NET 'VBAT' COMP 'BAT_CONN':1 COMP 'PMIC':VBAT;\nNET 'MIPI_DSI_CLK_P' COMP 'SNAP_SOC':H12 COMP 'DISP_FPC':18;",
      },
    },
    rul: {
      overallHealthScore: 91,
      predictedYears: 5.8,
      predictedHours: 51000,
      failureProbability: 0.09,
      confidence: 0.94,
      parameters: {
        operatingTempCelsius: 44,
        inputVoltageVolts: 3.85,
        operatingCycles: 3800,
        ageYears: 2.2,
      },
    },
    metals: {
      pcbWeightKg: 0.038,
      recoveryEfficiencyPercent: 99.4,
      totalEstimatedMarketValueUSD: 14.80,
      yields: [
        { metal: "Gold (Au)", symbol: "Au", yieldGrams: 0.138, marketRateUSD: 78.40, estimatedValueUSD: 10.82, color: "#B88900" },
        { metal: "Silver (Ag)", symbol: "Ag", yieldGrams: 0.45, marketRateUSD: 0.95, estimatedValueUSD: 0.43, color: "#64748B" },
        { metal: "Copper (Cu)", symbol: "Cu", yieldGrams: 16.2, marketRateUSD: 0.009, estimatedValueUSD: 0.15, color: "#C2410C" },
        { metal: "Palladium (Pd)", symbol: "Pd", yieldGrams: 0.069, marketRateUSD: 49.20, estimatedValueUSD: 3.40, color: "#2563EB" },
      ],
    },
    repair: {
      reportId: "REP-2026-MOB-771",
      recommendedAction: "reuse",
      primaryFault: "Battery FPC connector latch tension slightly loose",
      estimatedRepairCostUSD: 12.00,
      estimatedCO2SavingsKg: 24.5,
      feasibilityIndexPercent: 93,
      issues: [
        {
          component: "Battery FPC Contact Header",
          issue: "Insertion resistance slightly below spec",
          severity: "low",
          recommendation: "Replace with fresh Hirose surface mount header",
          action: "Swap Connector",
        },
      ],
    },
    passport: {
      passportId: "ECO-PASSPORT-2026-1104",
      tokenId: "11048",
      blockchainStatus: "Passport Ready",
      polygonTransactionHash: "0x4481023948123049182304918230491823049182304918230491823049182304",
      contractAddress: "0x3B82F6e71C7656EC7ab88b098defB751B7401B5f",
      originFacility: "EcoIntel Precision Ingest Lab 06",
      manufactureYear: 2024,
      reuseCycleCount: 0,
      isVerified: true,
      qrDataUri: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23ffffff'/><rect x='10' y='10' width='30' height='30' fill='%230f172a'/><rect x='60' y='10' width='30' height='30' fill='%230f172a'/><rect x='10' y='60' width='30' height='30' fill='%230f172a'/><polygon points='50,35 60,65 40,65' fill='%232563eb'/></svg>",
    },
    carbon: {
      co2AvoidedKg: 31.2,
      energySavedKWh: 76.5,
      waterSavedLiters: 290,
      eWasteDivertedKg: 0.038,
      circularityScorePercent: 95.2,
    },
    executiveSummary: {
      overallHealthPercent: 91,
      classification: "Reusable",
      potentialValueUSD: 14.80,
      estimatedRemainingLifeYears: 5.8,
      componentsDetectedCount: 64,
      recommendedAction: "High-value candidate for refurbished smartphone fleet or edge AI appliance.",
    },
  },

  "router-board": {
    id: "router-board",
    name: "Router Board",
    deviceType: "Networking Controller",
    category: "Networking & Telecom",
    componentCount: 38,
    image: "/images/samples/router_board.jpg",
    description: "Gigabit dual-band Wi-Fi 6 wireless networking controller featuring dedicated network processing unit (NPU), switch fabric, and isolated RJ45 transformers.",
    hardwareSpecs: {
      dimensions: "190 x 140 mm",
      layers: 4,
      substrate: "FR-4 Low-Dielectric Loss",
      copperWeightOz: 1.5,
      voltageRating: "12V DC / 2A External Adapter",
    },
    detection: {
      model: "YOLOv11-SpectroSpatial-v4.2",
      inferenceTimeMs: 49,
      confidenceAvg: 97.8,
      componentsCount: 38,
      components: [
        {
          id: "comp_npu_01",
          name: "MediaTek MT7622 Quad-Core Network Processor",
          type: "Network SoC",
          manufacturer: "MediaTek Inc.",
          package: "BGA-450",
          confidence: 99.0,
          health: 93,
          remainingLifeHours: 57000,
          remainingLifeYears: 6.5,
          material: "Silicon, Gold Wires, Substrate",
          coordinates: { x: 45, y: 35, width: 20, height: 20 },
          status: "Certified Reusable",
          passportId: "PASSPORT-NPU-7622",
          repairRecommendation: "Zero packet drop under 10Gbps full mesh loopback test.",
        },
        {
          id: "comp_mag_01",
          name: "Pulse Electronics H5007NL Quad Gigabit Transformer",
          type: "LAN Magnetics",
          manufacturer: "Pulse Electronics",
          package: "SMD-24",
          confidence: 98.4,
          health: 96,
          remainingLifeHours: 82000,
          remainingLifeYears: 9.4,
          material: "Toroidal Cores, Copper Wire, Phosphor Bronze",
          coordinates: { x: 78, y: 65, width: 14, height: 18 },
          status: "Certified Reusable",
          passportId: "PASSPORT-MAG-5007",
          repairRecommendation: "Galvanic isolation 1500V test certified.",
        },
      ],
    },
    reconstruction: {
      pcbId: "PCB-REC-NET-7740",
      boardModel: "Enterprise Gateway Edge 6",
      layerCount: 4,
      traceIntegrityPercent: 98.9,
      severedTracesRepaired: 0,
      reconstructionConfidence: 0.993,
      schematics: {
        kicadFileUrl: "/downloads/schematics/PCB-REC-NET-7740.kicad_pcb",
        gerberZipUrl: "/downloads/schematics/PCB-REC-NET-7740_gerber.zip",
        netlistRaw: "NET 'RGMII_TXD0' COMP 'MT7622':D12 COMP 'SWITCH_PHY':A04;\nNET 'ETH_12V' COMP 'DC_JACK':1 COMP 'BUCK_STEPDOWN':IN;",
      },
    },
    rul: {
      overallHealthScore: 93,
      predictedYears: 7.2,
      predictedHours: 63000,
      failureProbability: 0.07,
      confidence: 0.95,
      parameters: {
        operatingTempCelsius: 46,
        inputVoltageVolts: 12.0,
        operatingCycles: 1900,
        ageYears: 2.0,
      },
    },
    metals: {
      pcbWeightKg: 0.22,
      recoveryEfficiencyPercent: 98.0,
      totalEstimatedMarketValueUSD: 9.80,
      yields: [
        { metal: "Gold (Au)", symbol: "Au", yieldGrams: 0.088, marketRateUSD: 78.40, estimatedValueUSD: 6.90, color: "#B88900" },
        { metal: "Silver (Ag)", symbol: "Ag", yieldGrams: 0.42, marketRateUSD: 0.95, estimatedValueUSD: 0.40, color: "#64748B" },
        { metal: "Copper (Cu)", symbol: "Cu", yieldGrams: 34.0, marketRateUSD: 0.009, estimatedValueUSD: 0.31, color: "#C2410C" },
        { metal: "Palladium (Pd)", symbol: "Pd", yieldGrams: 0.044, marketRateUSD: 49.20, estimatedValueUSD: 2.19, color: "#2563EB" },
      ],
    },
    repair: {
      reportId: "REP-2026-NET-331",
      recommendedAction: "reuse",
      primaryFault: "None. Flash firmware ready for OpenWrt reflashing.",
      estimatedRepairCostUSD: 0.00,
      estimatedCO2SavingsKg: 19.4,
      feasibilityIndexPercent: 97,
      issues: [
        {
          component: "External SMA Antenna Ports",
          issue: "Minor thread tarnish",
          severity: "low",
          recommendation: "DeoxIT contact treatment",
          action: "Clean",
        },
      ],
    },
    passport: {
      passportId: "ECO-PASSPORT-2026-7740",
      tokenId: "77401",
      blockchainStatus: "Passport Ready",
      polygonTransactionHash: "0x5501928394812304918230491823049182304918230491823049182304918230",
      contractAddress: "0x3B82F6e71C7656EC7ab88b098defB751B7401B5f",
      originFacility: "EcoIntel Telecom Lab 07",
      manufactureYear: 2024,
      reuseCycleCount: 0,
      isVerified: true,
      qrDataUri: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23ffffff'/><rect x='10' y='10' width='30' height='30' fill='%230f172a'/><rect x='60' y='10' width='30' height='30' fill='%230f172a'/><rect x='10' y='60' width='30' height='30' fill='%230f172a'/><circle cx='50' cy='50' r='16' stroke='%232563eb' stroke-width='4' fill='none'/></svg>",
    },
    carbon: {
      co2AvoidedKg: 22.1,
      energySavedKWh: 54.0,
      waterSavedLiters: 180,
      eWasteDivertedKg: 0.22,
      circularityScorePercent: 93.8,
    },
    executiveSummary: {
      overallHealthPercent: 93,
      classification: "Reusable",
      potentialValueUSD: 9.80,
      estimatedRemainingLifeYears: 7.2,
      componentsDetectedCount: 38,
      recommendedAction: "Direct redeployment with open-source firmware for rural or community connectivity.",
    },
  },
};
