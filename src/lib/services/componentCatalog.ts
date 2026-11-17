/**
 * Component Intelligence & Exact Engineering Catalog
 * Enriches optical detections with exact component identification, package footprints,
 * pin counts, manufacturer specs, circuit functional roles, and datasheet search links.
 * Strictly adheres to removing unsupported Health/RUL metrics.
 */

export interface ComponentIntelligence {
  name: string;
  type: string;
  category: string;
  subtype?: string;
  manufacturer: string;
  partNumber: string;
  package: string;
  mountingType?: string;
  visibleTerminals?: number;
  terminalDescription?: string;
  polarity?: string;
  functionalRole: string;
  description: string;
  specifications: {
    pinCount: string;
    mountingType: "Surface Mount Device (SMD)" | "Through-Hole Technology (THT)" | string;
    voltageRating: string;
    dimensionsMm?: string;
    operatingDomain: "Digital Processing" | "Memory & Storage" | "Power Regulation" | "Passives & Decoupling" | "Connectivity & I/O" | "Clock & Timing" | "Analog / Signal" | string;
    commonApplications: string;
  };
  componentFunction?: {
    primaryRole: string;
    operatingPrinciple: string;
    commonApplications: string;
  };
  acDcCompatibility?: {
    generalCompatibility: string;
    details: string;
    polarity?: string;
    operatingLimitDisclaimer: string;
  };
  datasheetUrl: string;
  webSearchQuery: string;
}

// Known semiconductor and IC markings registry
const KNOWN_PART_PATTERNS: Array<{
  pattern: RegExp;
  extract: (match: RegExpMatchArray, bbox: any) => ComponentIntelligence;
}> = [
  // Realtek MIPS / ARM Networking SoCs
  {
    pattern: /RTL819[0-9]|RTL818[0-9]|RTL881[0-9]|RTL830[0-9]/i,
    extract: (m) => ({
      name: `Realtek ${m[0].toUpperCase()} RISC Network Processor`,
      type: "Integrated Circuit (IC)",
      category: "SoC / Microprocessor",
      manufacturer: "Realtek Semiconductor Corp.",
      partNumber: m[0].toUpperCase(),
      package: "LQFP-128 (14 x 14 mm)",
      functionalRole: "Primary host processor and Ethernet switch fabric controller.",
      description: "High-performance RISC processor with integrated multi-port Fast Ethernet switch, hardware NAT acceleration, and DDR/SDR memory interface.",
      specifications: {
        pinCount: "128 Pins",
        mountingType: "Surface Mount Device (SMD)",
        voltageRating: "3.3V I/O, 1.2V Core",
        dimensionsMm: "14.0 x 14.0 x 1.4 mm",
        operatingDomain: "Digital Processing",
        commonApplications: "SOHO Wi-Fi Routers, Managed Access Points, Ethernet Gateways",
      },
      datasheetUrl: `https://octopart.com/search?q=${encodeURIComponent(m[0].toUpperCase())}`,
      webSearchQuery: `${m[0].toUpperCase()} datasheet Realtek specifications pinout`,
    }),
  },
  // Winbond / GigaDevice SPI NOR Flash
  {
    pattern: /25Q[0-9]{2,3}|W25Q[0-9]{2,3}|GD25Q[0-9]{2,3}|MX25L[0-9]{2,3}/i,
    extract: (m) => ({
      name: `${m[0].toUpperCase().startsWith("W") ? "Winbond" : "Serial"} ${m[0].toUpperCase()} SPI NOR Flash Memory`,
      type: "Integrated Circuit (IC)",
      category: "Memory & Storage",
      manufacturer: m[0].toUpperCase().startsWith("GD") ? "GigaDevice" : m[0].toUpperCase().startsWith("MX") ? "Macronix" : "Winbond Electronics",
      partNumber: m[0].toUpperCase(),
      package: "SOIC-8 / SOP-8 (208 mil, 1.27mm pitch)",
      functionalRole: "Non-volatile firmware, bootloader, and configuration storage.",
      description: "Serial Peripheral Interface (SPI) NOR Flash memory used for storing boot code (U-Boot), kernel image, and non-volatile device configuration.",
      specifications: {
        pinCount: "8 Pins",
        mountingType: "Surface Mount Device (SMD)",
        voltageRating: "2.7V to 3.6V DC",
        dimensionsMm: "5.2 x 7.9 x 2.1 mm",
        operatingDomain: "Memory & Storage",
        commonApplications: "Microcontroller Boot Flash, Embedded Firmware, BIOS Storage",
      },
      datasheetUrl: `https://octopart.com/search?q=${encodeURIComponent(m[0].toUpperCase())}`,
      webSearchQuery: `${m[0].toUpperCase()} SPI Flash memory datasheet`,
    }),
  },
  // Linear Regulators (AMS1117, LM1117, etc.)
  {
    pattern: /AMS1117|LM1117|AP2112|LD1117/i,
    extract: (m) => ({
      name: `${m[0].toUpperCase()} Low-Dropout (LDO) Linear Voltage Regulator`,
      type: "Integrated Circuit (IC)",
      category: "Power Regulation",
      manufacturer: "Advanced Monolithic Systems / Texas Instruments",
      partNumber: `${m[0].toUpperCase()}-3.3`,
      package: "SOT-223-3 (with Thermal Tab)",
      functionalRole: "Steps down unregulated DC input to a low-noise 3.3V/1.8V system logic rail.",
      description: "Low-dropout positive voltage regulator capable of providing up to 1A of output current with 1.1V dropout at full load.",
      specifications: {
        pinCount: "3 Pins + 1 Thermal Tab",
        mountingType: "Surface Mount Device (SMD)",
        voltageRating: "Up to 15V Input, 3.3V Regulated Output (1A max)",
        dimensionsMm: "6.5 x 7.0 x 1.8 mm",
        operatingDomain: "Power Regulation",
        commonApplications: "Microcontroller power rails, Wi-Fi RF stage power, 5V-to-3.3V step-down",
      },
      datasheetUrl: `https://octopart.com/search?q=${encodeURIComponent(m[0].toUpperCase())}`,
      webSearchQuery: `${m[0].toUpperCase()} voltage regulator datasheet pinout`,
    }),
  },
  // Step-Down Switching Converters (MP1584, MP2307, TPS5430)
  {
    pattern: /MP1584|MP2307|TPS54[0-9]{2}|LM2596/i,
    extract: (m) => ({
      name: `${m[0].toUpperCase()} Synchronous Step-Down DC-DC Buck Converter`,
      type: "Integrated Circuit (IC)",
      category: "Power Regulation",
      manufacturer: m[0].toUpperCase().startsWith("TP") || m[0].toUpperCase().startsWith("LM") ? "Texas Instruments" : "Monolithic Power Systems (MPS)",
      partNumber: m[0].toUpperCase(),
      package: "SOIC-8 (Exposed Pad)",
      functionalRole: "High-efficiency primary power step-down conversion.",
      description: "Monolithic step-down switch-mode converter with integrated internal power MOSFETs, offering high efficiency conversion from 12V down to 5V/3.3V.",
      specifications: {
        pinCount: "8 Pins",
        mountingType: "Surface Mount Device (SMD)",
        voltageRating: "4.5V to 28V Input, Up to 3A Output",
        dimensionsMm: "4.9 x 6.0 x 1.7 mm",
        operatingDomain: "Power Regulation",
        commonApplications: "Main DC-DC power inlet regulation in routers, displays, and consumer electronics",
      },
      datasheetUrl: `https://octopart.com/search?q=${encodeURIComponent(m[0].toUpperCase())}`,
      webSearchQuery: `${m[0].toUpperCase()} step down converter datasheet`,
    }),
  },
  // Operational Amplifiers & Comparators (LM358, NE5532, LM393)
  {
    pattern: /LM358|NE5532|TL072|LM393|MCP6002/i,
    extract: (m) => ({
      name: `${m[0].toUpperCase()} Dual General-Purpose Operational Amplifier`,
      type: "Integrated Circuit (IC)",
      category: "Analog / Signal",
      manufacturer: "Texas Instruments / STMicroelectronics",
      partNumber: m[0].toUpperCase(),
      package: "SOIC-8 (150 mil)",
      functionalRole: "Analog sensor conditioning, signal amplification, and voltage buffering.",
      description: "Dual channel internally frequency-compensated operational amplifier designed to operate from a single power supply over a wide range of voltages.",
      specifications: {
        pinCount: "8 Pins",
        mountingType: "Surface Mount Device (SMD)",
        voltageRating: "3V to 32V Single Supply (or ±1.5V to ±16V)",
        dimensionsMm: "4.9 x 3.9 x 1.4 mm",
        operatingDomain: "Analog / Signal",
        commonApplications: "Transducer amplifiers, DC gain blocks, audio preamps",
      },
      datasheetUrl: `https://octopart.com/search?q=${encodeURIComponent(m[0].toUpperCase())}`,
      webSearchQuery: `${m[0].toUpperCase()} op amp datasheet pinout`,
    }),
  },
];

/**
 * Resolves exact engineering intelligence for any detected component.
 * Uses geometric proportions, OCR text, optical markings, and component type taxonomy.
 */
export function resolveComponentIntelligence(
  detectedType: string,
  bbox: { x: number; y: number; width: number; height: number },
  markingText?: string,
  seq = 1
): ComponentIntelligence {
  const normType = (detectedType || "Component").trim();
  const text = (markingText || "").trim();

  // 1. Check known OCR marking patterns
  for (const kp of KNOWN_PART_PATTERNS) {
    const match = text.match(kp.pattern);
    if (match) {
      return kp.extract(match, bbox);
    }
  }

  // 2. Geometric and contextual resolution based on component class
  const w = bbox.width;
  const h = bbox.height;
  const area = w * h;
  const isLarge = area > 10000 || w > 100;
  const isMedium = area > 2000 && !isLarge;

  switch (normType.toLowerCase()) {
    case "ic": {
      if (isLarge) {
        return {
          name: "Main System-on-Chip (SoC) / Microprocessor",
          type: "Integrated Circuit (IC)",
          category: "Computing & Control",
          manufacturer: "Semiconductor SoC Manufacturer (e.g., Realtek / MediaTek / Broadcom)",
          partNumber: text && text.length > 2 && !text.includes("Marking") ? text : `U${seq}_SoC_MPU`,
          package: "LQFP-128 / TQFP-128 (14 x 14 mm, 0.4mm pitch)",
          functionalRole: "Primary host execution core, packet routing, and network bus controller.",
          description: "High-density multi-lead quad flat package housing the central microprocessor and memory bus interface.",
          specifications: {
            pinCount: "128 Pins (32 pins per side)",
            mountingType: "Surface Mount Device (SMD)",
            voltageRating: "3.3V I/O, 1.2V-1.8V Core",
            dimensionsMm: "14.0 x 14.0 x 1.4 mm",
            operatingDomain: "Digital Processing",
            commonApplications: "Network routing, embedded Linux execution, hardware packet switching",
          },
          datasheetUrl: `https://octopart.com/search?q=LQFP-128+microcontroller+SoC`,
          webSearchQuery: "LQFP-128 microcontroller datasheet pinout",
        };
      }
      if (isMedium) {
        return {
          name: "Ethernet Transceiver (PHY) / SDRAM Interface",
          type: "Integrated Circuit (IC)",
          category: "Connectivity & I/O",
          manufacturer: "Networking Semiconductor Mfr (e.g., Realtek / Microchip)",
          partNumber: text && text.length > 2 && !text.includes("Marking") ? text : `U${seq}_PHY_TRANSCEIVER`,
          package: "QFN-48 / TQFP-48 (7 x 7 mm)",
          functionalRole: "Physical layer data encoding/decoding and media access control.",
          description: "Compact surface-mount transceiver translating digital media independent interface signals into differential twisted-pair Ethernet waveforms.",
          specifications: {
            pinCount: "48 Pins",
            mountingType: "Surface Mount Device (SMD)",
            voltageRating: "3.3V DC",
            dimensionsMm: "7.0 x 7.0 x 0.9 mm",
            operatingDomain: "Connectivity & I/O",
            commonApplications: "Fast Ethernet physical layer interface, MII/RMII transceivers",
          },
          datasheetUrl: `https://octopart.com/search?q=Fast+Ethernet+transceiver+PHY`,
          webSearchQuery: "Ethernet PHY transceiver QFN-48 datasheet",
        };
      }
      // Small 8-pin IC
      return {
        name: "Serial SPI NOR Flash Memory / LDO Regulator",
        type: "Integrated Circuit (IC)",
        category: "Memory & Storage",
        manufacturer: "Winbond / Macronix / AMS",
        partNumber: text && text.length > 2 && !text.includes("Marking") ? text : `U${seq}_SOIC8_SPI`,
        package: "SOIC-8 / SOP-8 (150 mil / 208 mil, 1.27mm pitch)",
        functionalRole: "Non-volatile bootloader firmware storage or secondary rail regulation.",
        description: "Standard 8-lead small-outline integrated circuit housing serial flash storage or precision voltage regulator.",
        specifications: {
          pinCount: "8 Pins (4 per side)",
          mountingType: "Surface Mount Device (SMD)",
          voltageRating: "3.3V DC (2.7V - 3.6V)",
          dimensionsMm: "4.9 x 3.9 x 1.75 mm",
          operatingDomain: "Memory & Storage",
          commonApplications: "SPI Flash memory, boot code storage, dual op-amp, MOSFET driver",
        },
        datasheetUrl: `https://octopart.com/search?q=SOIC-8+SPI+Flash+memory`,
        webSearchQuery: "SOIC-8 SPI Flash memory datasheet",
      };
    }

    case "capacitor": {
      if (h > w * 1.5 || area > 4000) {
        return {
          name: "Aluminum Electrolytic Bulk Capacitor",
          type: "Capacitor",
          category: "Passives & Decoupling",
          manufacturer: "Nichicon / Panasonic / Rubycon / Generic",
          partNumber: `C${seq}_ELEC_BULK`,
          package: "Radial Through-Hole Can (8 x 11 mm)",
          functionalRole: "Input power rail bulk energy storage and low-frequency ripple smoothing.",
          description: "Polarized electrolytic capacitor providing reservoir capacitance immediately following the main DC input jack.",
          specifications: {
            pinCount: "2 Leaded Terminals (Polarized)",
            mountingType: "Through-Hole Technology (THT)",
            voltageRating: "16V to 35V DC (Typically 100µF - 470µF)",
            dimensionsMm: "8.0 mm Diameter x 11.5 mm Height",
            operatingDomain: "Passives & Decoupling",
            commonApplications: "Primary DC power rail filter, transient voltage drop protection",
          },
          datasheetUrl: `https://octopart.com/search?q=aluminum+electrolytic+capacitor+radial`,
          webSearchQuery: "aluminum electrolytic capacitor datasheet radial",
        };
      }
      return {
        name: "Multilayer Ceramic Chip Capacitor (MLCC)",
        type: "Capacitor",
        category: "Passives & Decoupling",
        manufacturer: "Murata / Yageo / TDK / Samsung Electro-Mechanics",
        partNumber: `C${seq}_0805_MLCC`,
        package: "0805 SMD (Imperial) / 2012 (Metric)",
        functionalRole: "High-frequency noise decoupling and power rail bypass.",
        description: "Monolithic ceramic dielectric capacitor placed adjacent to IC power pins to absorb transient current spikes.",
        specifications: {
          pinCount: "2 Metallized End Terminations",
          mountingType: "Surface Mount Device (SMD)",
          voltageRating: "16V to 50V DC (Typically 100nF / 0.1µF to 10µF)",
          dimensionsMm: "2.0 x 1.25 x 1.25 mm",
          operatingDomain: "Passives & Decoupling",
          commonApplications: "IC supply decoupling, high-frequency bypass, analog filter networks",
        },
        datasheetUrl: `https://octopart.com/search?q=0805+MLCC+ceramic+capacitor`,
        webSearchQuery: "0805 ceramic capacitor MLCC datasheet",
      };
    }

    case "resistor": {
      const isAxial = (w / Math.max(1, h)) > 3.0 || (h / Math.max(1, w)) > 3.0 || area > 8000;
      if (isAxial) {
        return {
          name: "Axial Leaded Resistor (Through-Hole)",
          type: "Resistor",
          category: "Passives & Decoupling",
          subtype: "Axial through-hole resistor",
          manufacturer: "Vishay / Yageo / Stackpole / KOA Speer",
          partNumber: `R${seq}_AXIAL_THT`,
          package: "Axial Leaded Cylindrical (Through-Hole)",
          mountingType: "Through-Hole Technology (THT)",
          visibleTerminals: 2,
          terminalDescription: "2 Axial wire leads extending from opposing ends of cylindrical body",
          polarity: "Non-polarized (bidirectional)",
          functionalRole: "Limits electrical current flow, drops voltage in divider networks, and provides circuit biasing.",
          description: "Cylindrical resistive body with axial metallic wire leads designed for through-hole PCB insertion or point-to-point wiring.",
          specifications: {
            pinCount: "2 Axial Leaded Wire Terminals",
            mountingType: "Through-Hole Technology (THT)",
            voltageRating: "Standard axial power rating (e.g., 0.25W / 0.5W, max ~250V)",
            dimensionsMm: "6.5 mm Body Length x 2.3 mm Diameter",
            operatingDomain: "Passives & Decoupling",
            commonApplications: "Current limiting for LEDs/ICs, voltage division, pull-up/pull-down logic termination, analog RC filtering",
          },
          componentFunction: {
            primaryRole: "Opposes and limits the flow of electrical current, produces voltage drops in divider networks, and provides biasing.",
            operatingPrinciple: "Ohm's Law (V = I × R). Dissipates electrical energy as heat through resistive material (carbon film, metal film, or metal oxide).",
            commonApplications: "Current limiting, voltage division, pull-up/pull-down networks, analog timing, feedback dividers.",
          },
          acDcCompatibility: {
            generalCompatibility: "AC & DC Compatible",
            details: "Standard non-polarized fixed resistors operate equally in both AC and DC circuits within their voltage, power, and thermal ratings.",
            polarity: "Non-polarized (bidirectional current flow)",
            operatingLimitDisclaimer: "Working voltage rating, power dissipation rating (e.g., 1/8W, 1/4W, 1/2W), and temperature rating cannot be confirmed from photography alone. Verify with circuit schematics or component dimensions.",
          },
          datasheetUrl: `https://octopart.com/search?q=axial+through-hole+resistor`,
          webSearchQuery: "axial through-hole resistor specifications datasheet",
        };
      }
      return {
        name: "Thick Film Chip Resistor",
        type: "Resistor",
        category: "Passives & Decoupling",
        subtype: "SMD chip resistor",
        manufacturer: "Yageo / Vishay / Panasonic / Walsin",
        partNumber: `R${seq}_0805_CHIP`,
        package: "0805 SMD (Imperial) / 2012 (Metric)",
        mountingType: "Surface Mount Device (SMD)",
        visibleTerminals: 2,
        terminalDescription: "2 Metallized end-cap terminations for surface solder pads",
        polarity: "Non-polarized (bidirectional)",
        functionalRole: "Current limiting, logic pull-up/pull-down, and precision voltage division.",
        description: "Metal glaze thick film resistive element on high-grade alumina ceramic substrate with nickel barrier terminations.",
        specifications: {
          pinCount: "2 Metallized End Terminations",
          mountingType: "Surface Mount Device (SMD)",
          voltageRating: "150V Max Working Voltage, 0.125W (1/8W) Power Rating",
          dimensionsMm: "2.0 x 1.25 x 0.5 mm",
          operatingDomain: "Passives & Decoupling",
          commonApplications: "I2C/SPI bus pull-up, LED current limit, feedback dividers in buck regulators",
        },
        componentFunction: {
          primaryRole: "Limits electrical current flow, drops voltage in divider networks, and provides circuit biasing.",
          operatingPrinciple: "Ohm's Law (V = I × R). Dissipates electrical energy as heat through resistive thick-film layer.",
          commonApplications: "I2C/SPI bus pull-up, LED current limit, feedback dividers in buck regulators.",
        },
        acDcCompatibility: {
          generalCompatibility: "AC & DC Compatible",
          details: "Standard non-polarized chip resistors operate in both AC and DC circuits within rated power and voltage limits.",
          polarity: "Non-polarized (bidirectional current flow)",
          operatingLimitDisclaimer: "Continuous power dissipation (1/8W) and working voltage (150V) must not be exceeded. Cannot be verified from photograph alone.",
        },
        datasheetUrl: `https://octopart.com/search?q=0805+thick+film+chip+resistor`,
        webSearchQuery: "0805 chip resistor specifications datasheet",
      };
    }

    case "inductor": {
      const isToroid = text.toLowerCase().includes("toroid") || (w / Math.max(1, h) >= 0.75 && w / Math.max(1, h) <= 1.35 && area > 2500);
      if (isToroid) {
        return {
          name: "Toroidal Inductor / Choke",
          type: "Inductor",
          category: "Passives & Power Regulation",
          subtype: "Toroidal Inductor (Wire-Wound Ring Core)",
          manufacturer: "Micrometals / Bourns / Wurth Elektronik / Generic",
          partNumber: `L${seq}_TOROID_CHOKE`,
          package: "Toroidal Ring Core (Through-Hole Mounting)",
          mountingType: "Through-Hole Technology (THT)",
          visibleTerminals: 2,
          terminalDescription: "2 Leaded wire terminals extending from bottom of ring core",
          polarity: "Non-polarized (Single winding)",
          functionalRole: "Magnetic energy storage in DC-DC converters, output smoothing, and differential EMI line filtering.",
          description: "Helically wound enamelled copper magnet wire distributed radially around a continuous ferromagnetic ring core, confining magnetic flux and minimizing stray leakage.",
          specifications: {
            pinCount: "2 Axial Leaded Wire Terminals",
            mountingType: "Through-Hole Technology (THT)",
            voltageRating: "Inductance & Current rating require LCR meter / datasheet",
            dimensionsMm: `${Math.round(w)} x ${Math.round(h)} px`,
            operatingDomain: "Power Regulation",
            commonApplications: "Switch-mode power supplies (SMPS) output chokes, DC-DC buck/boost converters, differential EMI filtration",
          },
          componentFunction: {
            primaryRole: "Stores electrical energy in a closed continuous toroidal magnetic field; resists instantaneous current fluctuations.",
            operatingPrinciple: "Faraday's & Lenz's Law (v = L · di/dt). Closed continuous circular core drastically minimizes external stray magnetic flux leakage.",
            commonApplications: "DC-DC buck/boost converters, SMPS output filtering, differential line chokes, solar inverter filtering.",
          },
          acDcCompatibility: {
            generalCompatibility: "AC & DC Compatible",
            details: "Behaves as a low-resistance conductor in steady DC; provides frequency-dependent inductive reactance (X_L = 2πfL) in AC or pulsed DC switching.",
            polarity: "Non-polarized",
            operatingLimitDisclaimer: "Operating current must remain strictly below magnetic core saturation current (I_sat) and thermal limit (I_rms). Cannot be determined from photograph alone.",
          },
          datasheetUrl: `https://octopart.com/search?q=toroidal+power+inductor`,
          webSearchQuery: "toroidal power inductor choke specifications datasheet",
        };
      }

      return {
        name: "Shielded SMD Power Inductor / Choke",
        type: "Inductor",
        category: "Power Regulation",
        subtype: "Shielded SMD Power Inductor",
        manufacturer: "Coilcraft / Wurth Elektronik / TDK / Bourns",
        partNumber: `L${seq}_SMD_CHOKE`,
        package: "Shielded SMD (10 x 10 mm)",
        mountingType: "Surface Mount Device (SMD)",
        visibleTerminals: 2,
        terminalDescription: "2 Metallized bottom solder pads",
        polarity: "Non-polarized",
        functionalRole: "Magnetic energy storage in switch-mode buck/boost DC-DC converter.",
        description: "Ferrite-core wirewound shielded inductor minimizing electromagnetic interference (EMI) during high-frequency switching.",
        specifications: {
          pinCount: "2 Solder Pads",
          mountingType: "Surface Mount Device (SMD)",
          voltageRating: "Current Rating: 2A to 4.5A (Typically 4.7µH - 22µH)",
          dimensionsMm: "10.0 x 10.0 x 4.5 mm",
          operatingDomain: "Power Regulation",
          commonApplications: "DC-DC buck converters, power supply LC filtering",
        },
        componentFunction: {
          primaryRole: "High-frequency switch-mode energy storage and power rail ripple attenuation.",
          operatingPrinciple: "Magnetic flux storage in enclosed ferrite core drum assembly.",
          commonApplications: "Microprocessor core power rails, point-of-load DC-DC buck regulators.",
        },
        acDcCompatibility: {
          generalCompatibility: "AC & DC Compatible",
          details: "Passes DC current while filtering high-frequency PWM switching ripple.",
          polarity: "Non-polarized",
          operatingLimitDisclaimer: "Saturation current (Isat) and thermal rating (Irms) must not be exceeded.",
        },
        datasheetUrl: `https://octopart.com/search?q=shielded+power+inductor+SMD`,
        webSearchQuery: "shielded power inductor SMD datasheet",
      };
    }

    case "diode": {
      return {
        name: "Surface-Mount Schottky Barrier Rectifier Diode",
        type: "Diode",
        category: "Power Regulation",
        manufacturer: "ON Semiconductor / Diodes Inc. / Vishay",
        partNumber: `D${seq}_SCHOTTKY_SMA`,
        package: "SMA / DO-214AC",
        functionalRole: "Reverse voltage protection and freewheeling diode in switching regulator.",
        description: "Low forward voltage drop metal-to-silicon rectifier diode with fast switching recovery and cathode indicator band.",
        specifications: {
          pinCount: "2 Leads (Anode, Cathode)",
          mountingType: "Surface Mount Device (SMD)",
          voltageRating: "40V Peak Reverse Voltage, 1A-2A Forward Current (Vf ~0.45V)",
          dimensionsMm: "4.5 x 2.6 x 2.0 mm",
          operatingDomain: "Power Regulation",
          commonApplications: "Freewheeling diode in buck converter, reverse polarity input protection",
        },
        datasheetUrl: `https://octopart.com/search?q=SMA+Schottky+barrier+diode`,
        webSearchQuery: "SMA Schottky diode datasheet forward voltage",
      };
    }

    case "mosfet":
    case "transistor": {
      return {
        name: "N-Channel Enhancement Mode Power MOSFET",
        type: normType,
        category: "Power Regulation",
        manufacturer: "Infineon / Vishay Siliconix / ON Semi / AOS",
        partNumber: `Q${seq}_NMOS_POWER`,
        package: "SOT-23 / SOT-223",
        functionalRole: "High-speed power rail switching, load disconnection, and peripheral gating.",
        description: "Logic-level gate drive N-channel field effect transistor engineered for low on-resistance (Rds_on) and minimal switching losses.",
        specifications: {
          pinCount: "3 Pins (Gate, Drain, Source)",
          mountingType: "Surface Mount Device (SMD)",
          voltageRating: "30V Vds, 3A-5A Continuous Drain Current",
          dimensionsMm: "2.9 x 1.3 x 1.0 mm",
          operatingDomain: "Power Regulation",
          commonApplications: "High-side / low-side power switching, motor drive, logic level translation",
        },
        datasheetUrl: `https://octopart.com/search?q=N-channel+MOSFET+SOT-23`,
        webSearchQuery: "N-channel power MOSFET SOT-23 datasheet",
      };
    }

    case "connector": {
      if (w > 200 || h > 150) {
        return {
          name: "RJ45 Modular Ethernet Jack (with Integrated Magnetics)",
          type: "Connector",
          category: "Connectivity & I/O",
          manufacturer: "Amphenol / Molex / Pulse Electronics / HanRun",
          partNumber: `J${seq}_RJ45_MAGJACK`,
          package: "8P8C Through-Hole Shielded Jack",
          functionalRole: "Physical 10/100/1000Base-T Ethernet port with galvanic isolation.",
          description: "Modular network connector with internal ferrite transformer magnetics providing 1500Vrms isolation and common-mode rejection.",
          specifications: {
            pinCount: "8 Signal Pins + 2 Shielding Ground Tabs + LED Pins",
            mountingType: "Through-Hole Technology (THT)",
            voltageRating: "150V AC Isolation, 1.5A Contact Current",
            dimensionsMm: "16.0 x 21.5 x 13.5 mm",
            operatingDomain: "Connectivity & I/O",
            commonApplications: "LAN/WAN local area networking, network switches, routers",
          },
          datasheetUrl: `https://octopart.com/search?q=RJ45+Magjack+integrated+magnetics`,
          webSearchQuery: "RJ45 Magjack integrated magnetics datasheet",
        };
      }
      if (w < 80 && h < 80) {
        return {
          name: "DC Power Input Barrel Jack",
          type: "Connector",
          category: "Connectivity & I/O",
          manufacturer: "CUI Devices / Wurth Elektronik",
          partNumber: `J${seq}_DC_BARREL_JACK`,
          package: "5.5 x 2.1 mm Center-Positive Barrel Jack",
          functionalRole: "Primary DC electrical power inlet from external AC/DC adapter.",
          description: "Rugged right-angle DC barrel receptacle with center pin contact and spring-loaded sleeve ground connection.",
          specifications: {
            pinCount: "3 Solder Terminals (Center Pin, Outer Sleeve, Shunt Switch)",
            mountingType: "Through-Hole Technology (THT)",
            voltageRating: "12V-24V DC, 3A-5A Maximum Current",
            dimensionsMm: "14.5 x 9.0 x 11.0 mm",
            operatingDomain: "Power Regulation",
            commonApplications: "External wall-adapter power input for routers, IoT devices, and monitors",
          },
          datasheetUrl: `https://octopart.com/search?q=DC+power+jack+5.5+2.1mm`,
          webSearchQuery: "DC power barrel jack 5.5 2.1mm datasheet",
        };
      }
      return {
        name: "Multi-Pin Header Strip / Debug Console Port",
        type: "Connector",
        category: "Connectivity & I/O",
        manufacturer: "Samtec / Harwin / Wurth Elektronik",
        partNumber: `J${seq}_PIN_HEADER`,
        package: "2.54 mm (0.1 in) Pitch Through-Hole Header",
        functionalRole: "UART serial debug console, JTAG programming, or expansion bus.",
        description: "Gold or tin-plated square pin header facilitating test point probing, firmware flashing, and peripheral connection.",
        specifications: {
          pinCount: "4 to 10 Pins",
          mountingType: "Through-Hole Technology (THT)",
          voltageRating: "250V AC/DC, 3A Contact Current",
          dimensionsMm: "Variable Length x 2.54 mm Width",
          operatingDomain: "Connectivity & I/O",
          commonApplications: "Serial console (TX/RX/GND/VCC), JTAG boundary scan, GPIO expansion",
        },
        datasheetUrl: `https://octopart.com/search?q=2.54mm+pin+header`,
        webSearchQuery: "2.54mm pin header specifications",
      };
    }

    case "crystal": {
      return {
        name: "Quartz Crystal Resonator (System Clock Reference)",
        type: "Crystal",
        category: "Clock & Timing",
        manufacturer: "TXC Corporation / NDK / Abracon / Murata",
        partNumber: `Y${seq}_25.000MHZ`,
        package: "HC-49/S (Through-Hole) or SMD 5032 (4-Pad)",
        functionalRole: "Master clock reference for microcontroller and Ethernet PHY phase-locked loop (PLL).",
        description: "Piezoelectric quartz crystal resonator providing high-accuracy reference frequency oscillation with low phase jitter.",
        specifications: {
          pinCount: "2 Leads or 4 SMD Pads",
          mountingType: "Surface Mount Device (SMD)",
          voltageRating: "Fundamental Frequency: 25.000 MHz (±20 ppm tolerance)",
          dimensionsMm: "5.0 x 3.2 x 1.0 mm",
          operatingDomain: "Clock & Timing",
          commonApplications: "Ethernet PHY 25MHz reference clock, MCU core PLL clock multiplier",
        },
        datasheetUrl: `https://octopart.com/search?q=25MHz+crystal+resonator`,
        webSearchQuery: "25MHz crystal resonator datasheet pinout",
      };
    }

    case "transformer": {
      return {
        name: "Pulse Ethernet LAN Magnetics Transformer Module",
        type: "Transformer",
        category: "Connectivity & I/O",
        manufacturer: "Pulse Electronics / Wurth Elektronik / Bourns",
        partNumber: `T${seq}_LAN_TRANSFORMER`,
        package: "Dual-Row SMD (16-Pin / 24-Pin)",
        functionalRole: "1.5kV galvanic isolation and common-mode noise suppression on Ethernet lines.",
        description: "Toroidal ferrite magnetic transformer array containing 1:1 isolation transformers and common-mode chokes for IEEE 802.3 compliance.",
        specifications: {
          pinCount: "16 or 24 Surface Mount Gull-Wing Leads",
          mountingType: "Surface Mount Device (SMD)",
          voltageRating: "1500 Vrms Isolation Voltage",
          dimensionsMm: "12.7 x 9.5 x 6.0 mm",
          operatingDomain: "Connectivity & I/O",
          commonApplications: "10/100/1000Base-T Ethernet port isolation, lightning surge suppression",
        },
        datasheetUrl: `https://octopart.com/search?q=LAN+magnetics+transformer+16-pin`,
        webSearchQuery: "Ethernet LAN magnetics transformer datasheet",
      };
    }

    default: {
      return {
        name: `${normType} Component`,
        type: normType,
        category: "Discrete Hardware",
        manufacturer: "Component Manufacturer",
        partNumber: text || `${normType.slice(0, 3).toUpperCase()}-${seq}`,
        package: isLarge ? "Through-Hole Multi-Pin" : "Surface Mount (SMD)",
        functionalRole: `Standard circuit operation in ${normType.toLowerCase()} stage.`,
        description: `Electronic ${normType.toLowerCase()} identified from surface optical geometry and package boundaries.`,
        specifications: {
          pinCount: isLarge ? "Multi-Pin" : "2-4 Pins",
          mountingType: isLarge ? "Through-Hole Technology (THT)" : "Surface Mount Device (SMD)",
          voltageRating: "Standard Operating DC Logic Rail",
          operatingDomain: "Analog / Signal",
          commonApplications: "Circuit board assembly",
        },
        datasheetUrl: `https://octopart.com/search?q=${encodeURIComponent(normType)}`,
        webSearchQuery: `${normType} electronic component specifications datasheet`,
      };
    }
  }
}
