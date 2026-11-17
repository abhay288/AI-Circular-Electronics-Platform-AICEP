#!/usr/bin/env python3
"""
EcoIntel Component Knowledge Database & Hierarchical Taxonomy Engine
====================================================================
Comprehensive electronics engineering knowledge database providing structured,
multi-level component taxonomy, physical characteristics, working principles,
AC/DC compatibility, and verified reference standards.

Adheres strictly to the EcoIntel Image-Only Evidence Policy:
- Clear separation between generic component knowledge and image-specific observations.
- Unsupported electrical parameters (e.g., breakdown voltage, microhenries, picofarads)
  are labeled NOT_AVAILABLE or requiring datasheet/multimeter verification.
"""

from typing import Dict, Any, List, Optional

# SMD Resistor EIA-96 Multiplier and Code Lookup Table
EIA96_CODES = {
    "01": 100, "02": 102, "03": 105, "04": 107, "05": 110, "06": 113, "07": 115, "08": 118,
    "09": 121, "10": 124, "11": 127, "12": 130, "13": 133, "14": 137, "15": 140, "16": 143,
    "17": 147, "18": 150, "19": 154, "20": 158, "21": 162, "22": 165, "23": 169, "24": 174,
    "25": 178, "26": 182, "27": 187, "28": 191, "29": 196, "30": 200, "31": 205, "32": 210,
    "33": 215, "34": 221, "35": 226, "36": 232, "37": 237, "38": 243, "39": 249, "40": 255,
    "41": 261, "42": 267, "43": 274, "44": 280, "45": 287, "46": 294, "47": 301, "48": 309,
    "49": 316, "50": 324, "51": 332, "52": 340, "53": 348, "54": 357, "55": 365, "56": 374,
    "57": 383, "58": 392, "59": 402, "60": 412, "61": 422, "62": 432, "63": 442, "64": 453,
    "65": 464, "66": 475, "67": 487, "68": 499, "69": 511, "70": 523, "71": 536, "72": 549,
    "73": 562, "74": 576, "75": 590, "76": 604, "77": 619, "78": 634, "79": 649, "80": 665,
    "81": 681, "82": 698, "83": 715, "84": 732, "85": 750, "86": 768, "87": 787, "88": 806,
    "89": 825, "90": 845, "91": 866, "92": 887, "93": 909, "94": 931, "95": 953, "96": 976,
}
EIA96_MULTIPLIERS = {
    "Z": 0.001, "Y": 0.01, "R": 0.01, "X": 0.1, "S": 0.1, "A": 1.0, "B": 10.0,
    "H": 10.0, "C": 100.0, "D": 1000.0, "E": 10000.0, "F": 100000.0,
}

def decode_smd_resistor_code(code: str) -> Optional[Dict[str, Any]]:
    """
    Decodes standard SMD resistor printed markings:
    - 3-digit EIA (5% tolerance)
    - 4-digit EIA (1% tolerance)
    - EIA-96 1% code (e.g., '01C' = 100 * 100 = 10 kΩ)
    """
    clean = code.strip().upper()
    if not clean or len(clean) < 2 or len(clean) > 5:
        return None

    # Handle 'R' as decimal point (e.g., '4R7' = 4.7 Ω, 'R22' = 0.22 Ω)
    if "R" in clean:
        try:
            val_str = clean.replace("R", ".")
            val = float(val_str)
            return {
                "system": "Direct Resistance with R-Decimal Point",
                "code": clean,
                "resistanceValue": val,
                "formattedResistance": f"{val:g} Ω",
                "tolerance": "±1% to ±5%",
                "provenance": "OCR_EXTRACTED",
            }
        except ValueError:
            pass

    # 3-digit EIA standard (e.g., '103' = 10 * 10^3 = 10 kΩ)
    if len(clean) == 3 and clean.isdigit():
        sig = int(clean[:2])
        mult = 10 ** int(clean[2])
        val = sig * mult
        formatted = f"{val/1e6:g} MΩ" if val >= 1e6 else f"{val/1e3:g} kΩ" if val >= 1e3 else f"{val:g} Ω"
        return {
            "system": "Standard 3-Digit EIA (E-24 Series)",
            "code": clean,
            "significantDigits": sig,
            "multiplier": f"10^{clean[2]} (×{mult:,})",
            "resistanceValue": val,
            "formattedResistance": formatted,
            "tolerance": "±5%",
            "provenance": "OCR_EXTRACTED",
        }

    # 4-digit EIA precision (e.g., '4702' = 470 * 10^2 = 47 kΩ)
    if len(clean) == 4 and clean.isdigit():
        sig = int(clean[:3])
        mult = 10 ** int(clean[3])
        val = sig * mult
        formatted = f"{val/1e6:g} MΩ" if val >= 1e6 else f"{val/1e3:g} kΩ" if val >= 1e3 else f"{val:g} Ω"
        return {
            "system": "Precision 4-Digit EIA (E-96 Series)",
            "code": clean,
            "significantDigits": sig,
            "multiplier": f"10^{clean[3]} (×{mult:,})",
            "resistanceValue": val,
            "formattedResistance": formatted,
            "tolerance": "±1%",
            "provenance": "OCR_EXTRACTED",
        }

    # EIA-96 code (2 digits followed by 1 letter, e.g., '01C')
    if len(clean) == 3 and clean[:2].isdigit() and clean[2].isalpha():
        digits = clean[:2]
        letter = clean[2]
        if digits in EIA96_CODES and letter in EIA96_MULTIPLIERS:
            base_val = EIA96_CODES[digits]
            mult = EIA96_MULTIPLIERS[letter]
            val = base_val * mult
            formatted = f"{val/1e6:g} MΩ" if val >= 1e6 else f"{val/1e3:g} kΩ" if val >= 1e3 else f"{val:g} Ω"
            return {
                "system": "EIA-96 Precision 1% SMD Code",
                "code": clean,
                "baseValue": base_val,
                "multiplierLetter": letter,
                "multiplier": f"×{mult}",
                "resistanceValue": val,
                "formattedResistance": formatted,
                "tolerance": "±1%",
                "provenance": "OCR_EXTRACTED",
            }

    return None

# Comprehensive Structured Component Knowledge Database
COMPONENT_FAMILY_KNOWLEDGE: Dict[str, Dict[str, Any]] = {
    "Inductor": {
        "family": "Inductor",
        "category": "Passive Component",
        "taxonomyTree": [
            "Electronic Component",
            "Passive Component",
            "Inductor",
            "Fixed / Variable Inductor",
            "Wire-Wound / Multilayer / Toroidal",
        ],
        "primaryFunctions": [
            "Magnetic energy storage in switch-mode DC-DC converters.",
            "High-frequency noise and AC ripple suppression on power rails.",
            "Differential and common-mode electromagnetic interference (EMI) filtering.",
            "Resonant frequency determination in LC tuned RF oscillator tanks.",
        ],
        "workingPrinciple": {
            "governingLaw": "Faraday's Law of Induction & Lenz's Law: v(t) = L · (di/dt); Energy: E = ½ · L · I²",
            "summary": "Stores electrical energy in an induced magnetic field; resists instantaneous changes in current.",
            "detailedPhysics": (
                "An electric current passing through the winding induces a magnetic flux (B) proportional to current and turns. "
                "Any time-varying change in current induces a counter-electromotive force (back-EMF) opposing the change. "
                "In high-frequency AC circuits, inductive reactance (X_L = 2πfL) attenuates high frequencies while passing DC."
            ),
        },
        "acDcCompatibility": {
            "rating": "AC & DC Compatible (Behavior Differs)",
            "dcBehavior": "Acts as low-resistance conductor once current is steady; only Ohmic wire resistance (DCR) remains.",
            "acBehavior": "Presents frequency-proportional impedance (X_L = 2πfL); blocks high-frequency ripple.",
            "frequencyAndLimitNotes": "Core saturation current (I_sat) and thermal rated current (I_rms) must not be exceeded.",
            "opticalBoundaryDisclaimer": "Operating inductance, rated current, and saturation limits require datasheet or LCR meter.",
        },
        "typicalSpecifications": [
            {"parameter": "Inductance (L)", "typicalRange": "100 nH – 100 mH", "standardUnit": "Henry (H)", "provenance": "NOT_AVAILABLE", "notes": "Requires LCR meter"},
            {"parameter": "DC Resistance (DCR)", "typicalRange": "1 mΩ – 50 Ω", "standardUnit": "Ohm (Ω)", "provenance": "NOT_AVAILABLE", "notes": "Requires 4-wire milliohmmeter"},
            {"parameter": "Saturation Current (I_sat)", "typicalRange": "0.1 A – 50 A", "standardUnit": "Ampere (A)", "provenance": "NOT_AVAILABLE", "notes": "Requires flux density test"},
            {"parameter": "Rated RMS Current", "typicalRange": "0.1 A – 40 A", "standardUnit": "Ampere (A)", "provenance": "NOT_AVAILABLE", "notes": "Thermal limit (ΔT = 40°C)"},
            {"parameter": "Core Material", "typicalRange": "Ferrite / Iron Powder / Sendust", "standardUnit": "Magnetic alloy", "provenance": "VISUAL_INFERENCE", "notes": "Visual geometry & coating"},
        ],
        "limitations": [
            "Inductance (µH/mH) cannot be calculated accurately from exterior photograph.",
            "Core material grade cannot be verified without manufacturer part number.",
            "Saturation current limit cannot be verified visually.",
        ],
        "references": [
            {"standardOrDoc": "IEC 62024-2: High-frequency inductive components test methods", "organization": "IEC"},
            {"standardOrDoc": "IEEE Std 389: Testing Transformers and Inductors", "organization": "IEEE"},
        ],
    },

    "Resistor": {
        "family": "Resistor",
        "category": "Passive Component",
        "taxonomyTree": [
            "Electronic Component",
            "Passive Component",
            "Resistor",
            "Fixed Resistor",
            "Axial Leaded / Surface Mount Chip",
        ],
        "primaryFunctions": [
            "Limits electrical current flow to safe operating levels for semiconductors.",
            "Creates precise voltage drops in resistive voltage divider networks.",
            "Provides pull-up and pull-down logic line termination on digital buses.",
            "Acts as current-sensing shunt resistor for power monitors.",
        ],
        "workingPrinciple": {
            "governingLaw": "Ohm's Law: V = I · R; Joule's Heating Law: P = I² · R = V² / R",
            "summary": "Dissipates electrical energy as thermal energy through microscopic electron collisions in a resistive medium.",
            "detailedPhysics": (
                "Charge carriers (electrons) moving under an electric field experience scattering against the crystal lattice "
                "of the resistive material (carbon film, metal thin film, or metal oxide), converting kinetic energy into heat. "
                "Resistance depends directly on length, cross-sectional area, and material resistivity: R = ρ · (l / A)."
            ),
        },
        "acDcCompatibility": {
            "rating": "AC & DC Compatible",
            "dcBehavior": "Produces static voltage drop and limits current identically in either current direction.",
            "acBehavior": "Maintains resistive impedance across low to medium AC frequencies; parasitic lead inductance applies at RF.",
            "frequencyAndLimitNotes": "Power dissipation must remain strictly below rated wattage (e.g., 0.125W, 0.25W, 0.5W, 1W).",
            "opticalBoundaryDisclaimer": "Working voltage and thermal dissipation rating cannot be determined without physical dimensions or schematic.",
        },
        "typicalSpecifications": [
            {"parameter": "Resistance (R)", "typicalRange": "0.1 Ω – 100 MΩ", "standardUnit": "Ohm (Ω)", "provenance": "IMAGE_OBSERVED", "notes": "Decoded via colour bands or SMD markings"},
            {"parameter": "Tolerance", "typicalRange": "±0.1% – ±20%", "standardUnit": "Percent (%)", "provenance": "IMAGE_OBSERVED", "notes": "Decoded from tolerance band or code"},
            {"parameter": "Power Rating", "typicalRange": "0.063 W – 5 W", "standardUnit": "Watt (W)", "provenance": "VISUAL_INFERENCE", "notes": "Estimated from physical package footprint"},
            {"parameter": "Temperature Coefficient", "typicalRange": "±25 – ±200 ppm/°C", "standardUnit": "ppm/°C", "provenance": "DATABASE_REFERENCE", "notes": "Typical for metal/carbon film"},
        ],
        "limitations": [
            "Max working voltage (e.g. 150V vs 250V vs 500V) requires manufacturer catalog.",
            "Film composition (carbon film vs metal film) cannot always be verified under opaque lacquer.",
            "Internal thermal degradation cannot be detected without Ohmmeter verification.",
        ],
        "references": [
            {"standardOrDoc": "IEC 60062: Marking codes for resistors and capacitors", "organization": "IEC"},
            {"standardOrDoc": "EIA-RS-279: Color code for film and wirewound resistors", "organization": "EIA"},
        ],
    },

    "Capacitor": {
        "family": "Capacitor",
        "category": "Passive Component",
        "taxonomyTree": [
            "Electronic Component",
            "Passive Component",
            "Capacitor",
            "Fixed Capacitor",
            "Ceramic (MLCC) / Aluminum Electrolytic / Tantalum / Film",
        ],
        "primaryFunctions": [
            "Stores electrical potential energy electrostatically in an internal electric field.",
            "Provides instantaneous charge reservoir during rapid IC switching transients (decoupling).",
            "Smooths rectified AC voltage ripple on DC power supply rails.",
            "Blocks steady DC voltage while transmitting alternating AC or audio signals (AC coupling).",
        ],
        "workingPrinciple": {
            "governingLaw": "Coulomb's Law: Q = C · V; Current-Voltage relation: i(t) = C · (dv/dt); Energy: E = ½ · C · V²",
            "summary": "Accumulates opposite charges on opposing conductive plates separated by an insulating dielectric medium.",
            "detailedPhysics": (
                "An applied voltage displaces charge carriers, polarizing the dielectric material. Opposing charges accumulate "
                "on plate surfaces without direct conduction. Capacitive reactance (X_C = 1 / (2πfC)) decreases with frequency, "
                "shunting high-frequency noise to ground while blocking steady direct current."
            ),
        },
        "acDcCompatibility": {
            "rating": "Depends on Subtype & Polarity",
            "dcBehavior": "Charges to DC rail voltage and blocks steady-state direct current entirely.",
            "acBehavior": "Conducts AC current with 90° leading phase angle; impedance drops inversely with frequency (X_C = 1/(2πfC)).",
            "frequencyAndLimitNotes": "Polarized electrolytic and tantalum capacitors strictly require correct DC bias. Reverse voltage destroys dielectric.",
            "opticalBoundaryDisclaimer": "Dielectric breakdown voltage and ESR cannot be verified without readable stamped markings.",
        },
        "typicalSpecifications": [
            {"parameter": "Capacitance (C)", "typicalRange": "1 pF – 10,000 µF", "standardUnit": "Farad (F)", "provenance": "NOT_AVAILABLE", "notes": "Requires legible stamping or LCR meter"},
            {"parameter": "Voltage Rating", "typicalRange": "6.3 V – 450 V DC", "standardUnit": "Volt (V)", "provenance": "NOT_AVAILABLE", "notes": "Requires legible stamping or datasheet"},
            {"parameter": "Dielectric Type", "typicalRange": "Aluminum Oxide / BaTiO3 Ceramic", "standardUnit": "Material", "provenance": "VISUAL_INFERENCE", "notes": "Inferred from can vs SMD chip package"},
            {"parameter": "Equivalent Series Resistance (ESR)", "typicalRange": "0.01 Ω – 5 Ω", "standardUnit": "Ohm (Ω)", "provenance": "NOT_AVAILABLE", "notes": "Requires dedicated ESR meter"},
        ],
        "limitations": [
            "Capacitance value on unprinted SMD MLCC chips cannot be determined optically.",
            "Internal electrolyte dry-out cannot be confirmed without ESR testing.",
            "Exact voltage breakdown safety margin cannot be visually inspected.",
        ],
        "references": [
            {"standardOrDoc": "IEC 60384: Fixed capacitors for use in electronic equipment", "organization": "IEC"},
            {"standardOrDoc": "EIA-198: Ceramic dielectric capacitors classes I, II, III", "organization": "EIA"},
        ],
    },

    "Diode": {
        "family": "Diode",
        "category": "Semiconductor",
        "taxonomyTree": [
            "Electronic Component",
            "Semiconductor Component",
            "Diode",
            "Rectifier / Schottky / Zener / TVS",
            "Axial Leaded / Surface Mount (SMA/SMB/SOD)",
        ],
        "primaryFunctions": [
            "Unidirectional current rectification (converts alternating current to pulsating direct current).",
            "Flyback and inductive kickback clamping across coils, relays, and motor windings.",
            "Reverse polarity protection on DC power inlets.",
            "Voltage clamping and transient surge suppression.",
        ],
        "workingPrinciple": {
            "governingLaw": "Shockley Diode Equation: I = I_s · (exp(qV / nkT) - 1)",
            "summary": "Conducts electrical current easily in the forward direction while presenting extremely high resistance in reverse.",
            "detailedPhysics": (
                "Consists of a P-N semiconductor junction (or metal-semiconductor junction in Schottky diodes). In forward bias, "
                "the external electric field overcomes the built-in depletion barrier (~0.7V for Si, ~0.3V for Schottky), permitting "
                "rapid majority carrier flow. In reverse bias, the depletion zone widens, permitting only tiny reverse saturation current."
            ),
        },
        "acDcCompatibility": {
            "rating": "Polarity-Sensitive / Rectifies AC to DC",
            "dcBehavior": "Conducts when Anode > Cathode by forward drop (V_f); blocks current when reverse-biased.",
            "acBehavior": "Conducts during positive half-cycles and blocks negative half-cycles, producing rectified DC.",
            "frequencyAndLimitNotes": "Peak inverse voltage (PIV) and maximum continuous forward current (I_f) must be respected.",
            "opticalBoundaryDisclaimer": "Breakdown voltage and forward current ratings require readable part numbers.",
        },
        "typicalSpecifications": [
            {"parameter": "Forward Voltage Drop (V_f)", "typicalRange": "0.2 V – 1.1 V", "standardUnit": "Volt (V)", "provenance": "DATABASE_REFERENCE", "notes": "~0.3V Schottky, ~0.7V Silicon"},
            {"parameter": "Peak Inverse Voltage (PIV)", "typicalRange": "20 V – 1000 V", "standardUnit": "Volt (V)", "provenance": "NOT_AVAILABLE", "notes": "Requires part number lookup"},
            {"parameter": "Continuous Forward Current", "typicalRange": "0.1 A – 10 A", "standardUnit": "Ampere (A)", "provenance": "NOT_AVAILABLE", "notes": "Requires datasheet"},
            {"parameter": "Polarity Marker", "typicalRange": "Cathode Annular Band / Bar", "standardUnit": "Visual indicator", "provenance": "IMAGE_OBSERVED", "notes": "Printed bar indicates Cathode"},
        ],
        "limitations": [
            "Diode subtype (Schottky vs Standard Silicon vs Zener) cannot be distinguished by package alone without part markings.",
            "Reverse leakage current and junction capacitance require curve tracer testing.",
        ],
        "references": [
            {"standardOrDoc": "JEDEC JESD282: Standards for semiconductor diodes", "organization": "JEDEC"},
        ],
    },

    "Transistor": {
        "family": "Transistor",
        "category": "Active Semiconductor",
        "taxonomyTree": [
            "Electronic Component",
            "Semiconductor Component",
            "Active Device",
            "Transistor",
            "Bipolar Junction Transistor (BJT) / Field-Effect Transistor (FET)",
        ],
        "primaryFunctions": [
            "Regulates, amplifies, and switches electrical current and analog signals.",
            "Acts as digital logic switch driven by low-power microcontroller GPIO pins.",
            "Provides constant current sinks and sources in linear power circuits.",
            "Forms push-pull output stages for audio and motor driving.",
        ],
        "workingPrinciple": {
            "governingLaw": "BJT: I_c = β · I_b; FET: I_d = k · (V_gs - V_th)²",
            "summary": "A small control current (BJT base) or voltage (FET gate) controls a significantly larger main terminal current.",
            "detailedPhysics": (
                "In a BJT, injecting minority carriers into the ultra-thin base region modulates current flowing across reverse-biased "
                "collector-base junction. In an FET, an electric field across a dielectric gate oxide modulates the conductive channel "
                "width between source and drain, providing high input impedance and efficient power switching."
            ),
        },
        "acDcCompatibility": {
            "rating": "DC Powered / AC or DC Signal Processing",
            "dcBehavior": "Requires DC supply voltages and proper DC biasing to establish quiescent operating point (Q-point).",
            "acBehavior": "Amplifies or switches AC waveforms superimposed on established DC bias rails.",
            "frequencyAndLimitNotes": "V_ce / V_ds maximum voltage, maximum collector/drain current, and gate oxide breakdown limits apply.",
            "opticalBoundaryDisclaimer": "Pinout configuration (e.g. BCE vs CBE vs DGS) strictly depends on legible part markings.",
        },
        "typicalSpecifications": [
            {"parameter": "Maximum V_ce / V_ds", "typicalRange": "20 V – 600 V", "standardUnit": "Volt (V)", "provenance": "NOT_AVAILABLE", "notes": "Requires part number"},
            {"parameter": "Continuous Collector/Drain Current", "typicalRange": "100 mA – 50 A", "standardUnit": "Ampere (A)", "provenance": "NOT_AVAILABLE", "notes": "Requires part number"},
            {"parameter": "Current Gain / Transconductance", "typicalRange": "hFE 50 – 800", "standardUnit": "Ratio", "provenance": "NOT_AVAILABLE", "notes": "Requires semiconductor analyzer"},
            {"parameter": "Package Footprint", "typicalRange": "SOT-23 / TO-92 / TO-220 / DPAK", "standardUnit": "JEDEC Outline", "provenance": "VISUAL_INFERENCE", "notes": "Optical package geometry"},
        ],
        "limitations": [
            "Transistor polarity (NPN vs PNP, N-channel vs P-channel) cannot be established without legible part stamp.",
            "Internal health and semiconductor leakage cannot be determined visually.",
        ],
        "references": [
            {"standardOrDoc": "JEDEC Standard JESD-14: Transistor definitions and ratings", "organization": "JEDEC"},
        ],
    },

    "Integrated Circuit (IC)": {
        "family": "Integrated Circuit (IC)",
        "category": "Integrated Semiconductor",
        "taxonomyTree": [
            "Electronic Component",
            "Semiconductor Component",
            "Active Complex Device",
            "Integrated Circuit (IC)",
            "Microcontroller / Flash / Op-Amp / Regulator / Transceiver",
        ],
        "primaryFunctions": [
            "Central program execution, digital signal processing, and communication control.",
            "Non-volatile firmware, configuration, and filesystem storage.",
            "High-efficiency switch-mode power regulation and battery charging.",
            "Precision analog signal conditioning, filtering, and analog-to-digital conversion.",
        ],
        "workingPrinciple": {
            "governingLaw": "Solid-state semiconductor microarchitecture & Boolean digital logic",
            "summary": "Monolithically integrates thousands to billions of transistors, diodes, and interconnects onto a single silicon die.",
            "detailedPhysics": (
                "Manufactured via photolithographic semiconductor planar processes on monocrystalline silicon wafers. "
                "Combines complementary MOSFETs (CMOS) into logic gates, memory cells, and analog operational stages "
                "interconnected with multilayer copper/aluminum metallization layers."
            ),
        },
        "acDcCompatibility": {
            "rating": "Strict Regulated DC Power Required",
            "dcBehavior": "Requires tightly regulated DC supply rails (e.g. 5.0V, 3.3V, 1.8V, 1.2V). Negative or overvoltage causes latch-up.",
            "acBehavior": "Cannot be directly connected to unregulated AC mains. High-frequency digital signals run internally.",
            "frequencyAndLimitNotes": "Clock frequencies up to hundreds of megahertz; requires decoupling capacitors immediately adjacent to VDD pins.",
            "opticalBoundaryDisclaimer": "Internal silicon microcode, logic architecture, and register maps strictly depend on readable markings.",
        },
        "typicalSpecifications": [
            {"parameter": "Supply Voltage (VDD/VCC)", "typicalRange": "1.2 V – 5.5 V DC", "standardUnit": "Volt (V)", "provenance": "DATABASE_REFERENCE", "notes": "Standard digital CMOS logic rails"},
            {"parameter": "Pin Count", "typicalRange": "8 – 144+ Pins", "standardUnit": "Leads / Balls", "provenance": "IMAGE_OBSERVED", "notes": "Counted from package perimeter"},
            {"parameter": "Package Style", "typicalRange": "QFP / QFN / SOIC / BGA", "standardUnit": "JEDEC Package", "provenance": "IMAGE_OBSERVED", "notes": "Identified from package morphology"},
            {"parameter": "Pin 1 Index Marker", "typicalRange": "Notch / Laser Chamfer / Dot", "standardUnit": "Visual indicator", "provenance": "IMAGE_OBSERVED", "notes": "Pin 1 index orientation"},
        ],
        "limitations": [
            "Firmware contents, internal silicon health, and fuse configurations cannot be read visually.",
            "Part number and manufacturer cannot be identified if laser markings are abraded or occluded.",
        ],
        "references": [
            {"standardOrDoc": "JEDEC Publication 95: Registered and standard mechanical outlines for semiconductor packages", "organization": "JEDEC"},
        ],
    },
}
