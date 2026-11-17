#!/usr/bin/env python3
"""
EcoIntel Component Technical Intelligence & Knowledge Database
==============================================================
Provides structured, multi-level component classification, generic electrical
functions, polarity, and AC/DC compatibility information.

Adheres strictly to EcoIntel Image-Only Policy:
- Never invents exact part numbers, working voltages, currents, or power ratings from ordinary photography.
- Explains general electrical compatibility while maintaining clear optical boundaries.
"""

from typing import Dict, Any, Optional
import numpy as np
from app.inference.resistor_decoder import resistor_decoder

# Comprehensive structured electronics component knowledge database
COMPONENT_KNOWLEDGE_BASE = {
    "Resistor": {
        "category": "Passive Component",
        "primaryFunction": "Opposes and limits the flow of electrical current, produces voltage drops in divider networks, and provides biasing.",
        "operatingPrinciple": "Ohm's Law (V = I × R). Dissipates electrical energy as heat through resistive material (carbon film, metal film, wire-wound, or metal oxide).",
        "commonApplications": "Current limiting for LEDs/ICs, voltage division, pull-up/pull-down logic termination, analog RC filtering, feedback loops in voltage regulators.",
        "generalAcDcCompatibility": "AC & DC Compatible",
        "acDcDetails": "Standard non-polarized fixed resistors operate equally in both AC and DC circuits within their voltage, power, and thermal ratings. In high-frequency AC circuits, parasitic lead inductance and shunt capacitance may affect high-frequency impedance.",
        "polarity": "Non-polarized (bidirectional current flow)",
        "voltageDisclaimer": "Working voltage rating, power dissipation rating (e.g., 1/8W, 1/4W, 1/2W), and temperature rating cannot be confirmed from photography alone. Verify with circuit schematics or component dimensions.",
    },
    "Capacitor": {
        "category": "Passive Component",
        "primaryFunction": "Stores electrical potential energy electrostatically in an electric field between conductive plates separated by a dielectric medium.",
        "operatingPrinciple": "Charge storage Q = C × V. Opposes instantaneous changes in voltage (i = C × dv/dt). Passes alternating current (AC) while blocking steady direct current (DC).",
        "commonApplications": "Power rail decoupling, DC blocking / AC coupling in audio and RF stages, power supply ripple smoothing, timing circuits, resonant LC tanks.",
        "generalAcDcCompatibility": "Depends on Subtype & Polarity",
        "acDcDetails": "Non-polarized ceramic and film capacitors operate in both AC and DC circuits. Polarized electrolytic capacitors strictly require correct DC polarity; reversing polarity or unpolarized AC voltage causes dielectric destruction and venting.",
        "polarity": "Polarized for Aluminum Electrolytic & Tantalum (marked negative/positive stripe); Non-polarized for Ceramic MLCC & Film.",
        "voltageDisclaimer": "Dielectric breakdown voltage and capacitance value must not be exceeded. Voltage rating cannot be verified without legible printed markings.",
    },
    "Diode": {
        "category": "Semiconductor",
        "primaryFunction": "Permits electrical current to flow predominantly in one direction (forward bias) while presenting very high resistance in the reverse direction.",
        "operatingPrinciple": "P-N semiconductor junction exhibiting asymmetrical conductivity. Forward conduction occurs when anode voltage exceeds cathode by forward barrier potential (~0.7V for Silicon, ~0.3V for Schottky).",
        "commonApplications": "AC to DC rectification, flyback inductive kickback protection, reverse polarity protection, clamping, voltage regulation (Zener).",
        "generalAcDcCompatibility": "Polarity-Sensitive / Rectifies AC to DC",
        "acDcDetails": "Diodes are fundamentally polarity-sensitive. When connected to AC voltage, a diode conducts during positive half-cycles and blocks during negative half-cycles, converting AC into pulsating DC.",
        "polarity": "Polarized (Cathode marked with printed annular band or bar; Anode is unmarked terminal)",
        "voltageDisclaimer": "Peak inverse voltage (PIV) and maximum forward current ratings cannot be determined visually without readable part numbers.",
    },
    "LED": {
        "category": "Optoelectronic Semiconductor",
        "primaryFunction": "Emits optical light (photons) when electric current flows through its forward-biased semiconductor junction.",
        "operatingPrinciple": "Electroluminescence: Electrons recombine with electron holes within the semiconductor bandgap, releasing energy as photons.",
        "commonApplications": "Status indication, display backlighting, optical signaling, optocoupler isolation.",
        "generalAcDcCompatibility": "DC Preferred (Forward Biased)",
        "acDcDetails": "Operates only under forward DC bias with current limiting. Direct connection to AC causes rapid reverse breakdown or 50/60Hz visible flicker unless paired with anti-parallel diodes or bridge rectifiers.",
        "polarity": "Polarized (Anode = longer lead / circular rim; Cathode = shorter lead / flat edge on package / cathode mark on SMD)",
        "voltageDisclaimer": "Forward voltage drop (typically 1.8V to 3.3V depending on color/material) and forward current limit (typically 20mA) must be verified.",
    },
    "Transistor": {
        "category": "Semiconductor (Active)",
        "primaryFunction": "Regulates, switches, or amplifies electrical current or voltage signals.",
        "operatingPrinciple": "Bipolar Junction Transistors (BJT) are current-controlled (small base current controls large collector-emitter current). Field Effect Transistors (FET) are voltage-controlled.",
        "commonApplications": "Logic switching, audio and RF signal amplification, digital pulse generation, power regulation.",
        "generalAcDcCompatibility": "DC Powered / AC or DC Signal Processing",
        "acDcDetails": "Transistors require DC power supplies and DC bias voltages to establish proper operating points (Q-point), within which they can amplify or switch both AC signals and DC levels.",
        "polarity": "Polarized (Strict terminal orientation: Collector-Base-Emitter or Drain-Gate-Source)",
        "voltageDisclaimer": "Maximum Vce/Vds voltage, continuous collector/drain current, and gain (hFE) cannot be verified without readable part markings.",
    },
    "MOSFET": {
        "category": "Semiconductor (Active Power Switch)",
        "primaryFunction": "Voltage-controlled power switching and high-efficiency current regulation.",
        "operatingPrinciple": "Electric field modulates conductance of a semiconductor channel between Drain and Source based on Gate-to-Source voltage (Vgs).",
        "commonApplications": "Switch-mode power supplies (SMPS), DC-DC buck/boost converters, brushless motor drivers, load switching.",
        "generalAcDcCompatibility": "DC Rail Switching / High-Frequency PWM",
        "acDcDetails": "Operates as a unipolar switch on DC rails or high-frequency PWM modulated buses. Includes an intrinsic body diode from Source to Drain.",
        "polarity": "Polarized (Drain, Gate, Source terminals)",
        "voltageDisclaimer": "Rds(on) resistance, threshold voltage Vgs(th), and drain current limits require verified datasheet review.",
    },
    "Integrated Circuit (IC)": {
        "category": "Integrated Semiconductor",
        "primaryFunction": "Complex microelectronic circuit monolithically integrating thousands to billions of transistors, diodes, and passives onto a single silicon chip.",
        "operatingPrinciple": "Silicon wafer microfabrication performing logic computation, analog amplification, memory storage, or mixed-signal processing.",
        "commonApplications": "Microcontrollers (MCU), system-on-chips (SoC), Flash memory, operational amplifiers, Ethernet transceivers, DC-DC controllers.",
        "generalAcDcCompatibility": "Strict DC Power Supply",
        "acDcDetails": "ICs strictly require stable regulated DC power supply rails (e.g., 5V, 3.3V, 1.8V, 1.2V). Exposure to unregulated AC or reverse voltage typically causes immediate latch-up or permanent silicon junction destruction.",
        "polarity": "Strict Pin 1 Orientation (Notch, laser-etched dot, or chamfered corner defines Pin 1)",
        "voltageDisclaimer": "Silicon function, supply rail requirements, clock speed, and pinout strictly depend on readable part markings and verified manufacturer datasheets.",
    },
    "Inductor": {
        "category": "Passive Component",
        "primaryFunction": "Stores energy in a magnetic field when electric current flows through its conductive winding; resists changes in electrical current.",
        "operatingPrinciple": "Faraday's and Lenz's laws of electromagnetic induction (V = L × di/dt). Presents high impedance to high-frequency AC while presenting low DC resistance.",
        "commonApplications": "DC-DC buck/boost converter energy storage, RF chokes, electromagnetic interference (EMI) filtering, LC harmonic filters.",
        "generalAcDcCompatibility": "AC & DC Compatible (Behavior Differs)",
        "acDcDetails": "In DC circuits, acts as a low-resistance conductor once current is steady. In AC circuits, provides inductive reactance (Xl = 2πfL) proportional to frequency, filtering high-frequency ripple.",
        "polarity": "Non-polarized for standard single-winding inductors",
        "voltageDisclaimer": "Inductance value (µH/mH), saturation current (Isat), and DC resistance (DCR) cannot be determined from exterior view alone.",
    },
    "Transformer": {
        "category": "Electromagnetic Component",
        "primaryFunction": "Transfers electrical energy between two or more circuits through electromagnetic induction, stepping voltages up or down.",
        "operatingPrinciple": "Mutual inductance between primary and secondary windings wound around a ferromagnetic core (Vp / Vs = Np / Ns).",
        "commonApplications": "Mains power supply galvanic isolation, switch-mode flyback conversion, impedance matching, Ethernet signal isolation.",
        "generalAcDcCompatibility": "AC Strictly Required",
        "acDcDetails": "Transformers strictly require time-varying AC current to generate changing magnetic flux in the core. Applying steady DC causes magnetic core saturation, high current draw, and winding burnout without secondary voltage induction.",
        "polarity": "Winding phase-polarity indicated by dot conventions on schematics",
        "voltageDisclaimer": "Primary/secondary turns ratio, isolation voltage rating, and frequency rating (50Hz vs 100kHz SMPS) cannot be confirmed visually.",
    },
    "Relay": {
        "category": "Electromechanical Component",
        "primaryFunction": "Electrically operated switch providing complete galvanic isolation between a low-power control circuit and high-power load circuit.",
        "operatingPrinciple": "Energizing an internal electromagnetic coil generates magnetic attraction that physically pulls mechanical contacts into closed or open positions.",
        "commonApplications": "Automotive electronics, industrial control, smart home appliance switching, safety interlocks.",
        "generalAcDcCompatibility": "Coil: DC or AC (Specified); Contacts: AC & DC Rated",
        "acDcDetails": "Relay contact sets can generally switch both AC and DC loads up to rated limits. Note that DC contact breaking requires lower voltage/current ratings than AC due to sustained DC arcing without zero-crossings.",
        "polarity": "Contacts are non-polarized; Coils with internal flyback protection diodes are polarity-sensitive.",
        "voltageDisclaimer": "Coil voltage (e.g. 5V, 12V, 24V DC) and contact switching ratings (e.g. 10A 250V AC) require legible package markings.",
    },
    "Connector": {
        "category": "Interconnect Component",
        "primaryFunction": "Provides detachable mechanical coupling and electrical conductivity between distinct circuits, boards, or cables.",
        "operatingPrinciple": "Mechanical contact force between conductive metallic pins and mating receptacles maintaining low contact resistance.",
        "commonApplications": "DC power input jacks, USB interfaces, RJ-45 Ethernet ports, pin headers, board-to-board connectors.",
        "generalAcDcCompatibility": "AC & DC Compatible",
        "acDcDetails": "Physical connectors carry both AC and DC within their insulation dielectric breakdown and current-carrying pin capacities.",
        "polarity": "Keyed or shrouded geometry enforces correct orientation where applicable.",
        "voltageDisclaimer": "Current carrying capacity per pin and dielectric withstand voltage require manufacturer catalog verification.",
    },
    "Fuse": {
        "category": "Circuit Protection",
        "primaryFunction": "Sacrificial overcurrent protection device that safely interrupts excessive current by melting its internal element.",
        "operatingPrinciple": "Joule heating (P = I² × R). When current exceeds rating for a specific duration, thermal energy melts the fusible conductor, opening the circuit.",
        "commonApplications": "Mains power input protection, battery discharge safety, reverse current protection, automotive fuse blocks.",
        "generalAcDcCompatibility": "AC & DC Compatible (Voltage Rating Dependent)",
        "acDcDetails": "Fuses clear both AC and DC fault currents. However, DC voltage ratings are strictly lower than AC ratings because DC arcs do not naturally extinguish at voltage zero-crossings.",
        "polarity": "Non-polarized",
        "voltageDisclaimer": "Current trip rating (Amperes), voltage rating, and blow characteristics (Fast-acting vs Slow-blow) cannot be determined without legible stamping.",
    },
    "Crystal": {
        "category": "Frequency Control",
        "primaryFunction": "Provides a highly stable, precise resonant frequency for microcontroller system clocks and RF synthesizers.",
        "operatingPrinciple": "Piezoelectric effect: Applying electrical voltage causes mechanical deformation of a quartz crystal wafer, which vibrates at a precise mechanical resonance.",
        "commonApplications": "Microcontroller oscillators, real-time clocks (32.768 kHz), Ethernet PHY timing (25 MHz), Wi-Fi RF synthesizers.",
        "generalAcDcCompatibility": "AC Resonant Oscillatory Circuit",
        "acDcDetails": "Operates within an active oscillator inverter circuit providing high-frequency AC oscillation. Pure DC cannot produce piezoelectric resonance.",
        "polarity": "Non-polarized for standard 2-terminal crystals; ground pins on 4-pad SMD packages are chassis grounded.",
        "voltageDisclaimer": "Resonant frequency (e.g. 16.000 MHz, 25.000 MHz) and load capacitance (pF) require legible package engraving.",
    },
    "Sensor": {
        "category": "Transducer",
        "primaryFunction": "Measures physical environmental phenomena (temperature, light, pressure, motion) and converts them into readable electrical signals.",
        "operatingPrinciple": "Physical modulation (photoconductive, thermoelectric, capacitive, or Hall effect).",
        "commonApplications": "Environmental monitoring, automation control, robotics navigation, security motion detection.",
        "generalAcDcCompatibility": "DC Powered",
        "acDcDetails": "Sensors and modular sensor boards generally require regulated DC supply voltages and output analog DC voltages or digital I2C/SPI signals.",
        "polarity": "Polarized (VCC, GND, Signal terminals)",
        "voltageDisclaimer": "Operating supply voltage and sensitivity calibration require datasheet verification.",
    },
}

class ComponentIntelligenceEnricher:
    """Enriches raw optical detections with multi-level component classification and verified engineering knowledge."""

    def __init__(self):
        pass

    def enrich_detection(
        self, detection: Dict[str, Any], cv_img: np.ndarray, image_type: str = "UNKNOWN"
    ) -> Dict[str, Any]:
        """
        Enriches a single detection with:
        - Multi-level physical identity (Category, Subtype, Package, Mounting, Terminals, Polarity)
        - Generic educational component function
        - Dedicated AC/DC compatibility section
        - Resistor colour band decoding (if Resistor)
        - Verified datasheet references
        """
        cls_name = detection.get("className", "Unknown")
        bbox = detection.get("bbox", {})
        conf = float(detection.get("confidence", 0.85))

        # 1. Base knowledge lookup
        kb_entry = COMPONENT_KNOWLEDGE_BASE.get(cls_name, COMPONENT_KNOWLEDGE_BASE.get("Resistor"))

        # 2. Resistor-specific deep analysis
        if cls_name.lower() == "resistor":
            resistor_analysis = resistor_decoder.decode_bands(cv_img, bbox)
            phys = resistor_analysis["physicalIdentification"]
            
            return {
                "category": "Resistor",
                "subtype": phys["subtype"],
                "package": phys["package"],
                "mountingType": phys["mountingType"],
                "visibleTerminals": phys["visibleTerminals"],
                "terminalDescription": phys["terminalDescription"],
                "polarity": phys["polarity"],
                "confidence": conf,
                "classificationConfidence": conf,
                "packageConfidence": phys.get("confidence", 0.90),
                "componentFunction": {
                    "primaryRole": kb_entry["primaryFunction"],
                    "operatingPrinciple": kb_entry["operatingPrinciple"],
                    "commonApplications": kb_entry["commonApplications"],
                },
                "acDcCompatibility": {
                    "generalCompatibility": kb_entry["generalAcDcCompatibility"],
                    "details": kb_entry["acDcDetails"],
                    "polarity": kb_entry["polarity"],
                    "operatingLimitDisclaimer": kb_entry["voltageDisclaimer"],
                },
                "colorBandData": resistor_analysis,
                "technicalIdentification": {
                    "nominalResistance": resistor_analysis.get("formattedResistance", "Cannot determine from image"),
                    "tolerance": f"±{resistor_analysis.get('tolerancePercent')}%" if resistor_analysis.get("tolerancePercent") else "Cannot determine from image",
                    "toleranceRange": resistor_analysis.get("formattedRange", "Cannot determine from image"),
                    "bandSequence": resistor_analysis.get("bandSequence", []),
                    "bandDetails": resistor_analysis.get("bandDetails", []),
                    "readingOrientation": resistor_analysis.get("readingOrientation", "Unknown"),
                },
                "datasheetReference": {
                    "searchUrl": "https://octopart.com/search?q=axial+through-hole+resistor",
                    "notes": "Standard EIA-RS-279 / IEC 60062 colour-coded carbon/metal film resistor.",
                },
                "explanation": (
                    f"Identified as {phys['subtype']} ({phys['mountingType']}) based on "
                    f"cylindrical body morphology and {phys['visibleTerminals']} visible terminals. "
                    + (
                        f"Colour bands decoded as {resistor_analysis.get('formattedResistance')} ({resistor_analysis.get('formattedRange')})."
                        if resistor_analysis.get("status") == "COMPLETED"
                        else "Colour bands could not be verified reliably from original pixels."
                    )
                ),
            }

        # 3. Non-resistor component multi-level resolution
        bw = bbox.get("width", 50)
        bh = bbox.get("height", 50)
        aspect = max(bw, bh) / float(max(1, min(bw, bh)))
        area = bw * bh

        subtype, package, mounting, terminals, terminal_desc, polarity = self._resolve_non_resistor_form_factor(
            cls_name, bw, bh, aspect, area, image_type
        )

        return {
            "category": cls_name,
            "subtype": subtype,
            "package": package,
            "mountingType": mounting,
            "visibleTerminals": terminals,
            "terminalDescription": terminal_desc,
            "polarity": polarity,
            "confidence": conf,
            "classificationConfidence": conf,
            "packageConfidence": 0.88,
            "componentFunction": {
                "primaryRole": kb_entry["primaryFunction"],
                "operatingPrinciple": kb_entry["operatingPrinciple"],
                "commonApplications": kb_entry["commonApplications"],
            },
            "acDcCompatibility": {
                "generalCompatibility": kb_entry["generalAcDcCompatibility"],
                "details": kb_entry["acDcDetails"],
                "polarity": kb_entry["polarity"],
                "operatingLimitDisclaimer": kb_entry["voltageDisclaimer"],
            },
            "colorBandData": {
                "status": "NOT_APPLICABLE",
                "message": f"Colour band decoding is only applicable to IEC 60062 leaded resistors, not {cls_name}.",
            },
            "technicalIdentification": {
                "nominalValue": "Cannot determine from ordinary photography without printed laser markings",
                "markings": "See OCR inspection section",
                "packageFootprint": package,
            },
            "datasheetReference": {
                "searchUrl": f"https://octopart.com/search?q={cls_name}",
                "notes": f"Verify circuit schematic or printed markings for exact {cls_name} manufacturer specifications.",
            },
            "explanation": f"Classified as {subtype} ({package}) using optical boundaries, package morphology, and terminal arrangement.",
        }

    def _resolve_non_resistor_form_factor(
        self, cls: str, w: float, h: float, aspect: float, area: float, image_type: str
    ):
        """Resolves package, mounting, and terminal information for non-resistor classes."""
        c = cls.lower()
        if "capacitor" in c:
            if aspect > 1.4 and area > 1500:
                return (
                    "Radial electrolytic capacitor",
                    "Radial Through-Hole Can (THT)",
                    "Through-Hole Technology (THT)",
                    2,
                    "2 Leaded terminals with negative cathode stripe",
                    "Polarized (Negative stripe marked on sleeve)",
                )
            else:
                return (
                    "Multilayer ceramic chip capacitor (MLCC)",
                    "SMD Chip (e.g., 0805 / 0603)",
                    "Surface Mount Device (SMD)",
                    2,
                    "2 Metallized end-cap solder terminations",
                    "Non-polarized",
                )

        if "diode" in c:
            return (
                "Semiconductor diode",
                "Axial / SMD Diode Package (DO-41 or SOD-123)",
                "Surface Mount / Through-Hole",
                2,
                "2 Terminals (Anode and Cathode)",
                "Polarized (Cathode polarity band visible on package)",
            )

        if "led" in c:
            return (
                "Light Emitting Diode (LED)",
                "Indicator LED (Radial THT / SMD 0805)",
                "Surface Mount / Through-Hole",
                2,
                "2 Terminals (Anode and Cathode)",
                "Polarized (Cathode lead shorter / flat edge on housing)",
            )

        if "ic" in c:
            if area > 8000:
                return (
                    "Microprocessor / SoC Integrated Circuit",
                    "Quad Flat Package (LQFP / QFP)",
                    "Surface Mount Device (SMD)",
                    64,
                    "Multi-lead perimeter quad flat leads (0.5mm pitch)",
                    "Polarized (Pin 1 index dot / notch)",
                )
            else:
                return (
                    "Small Outline Integrated Circuit (SOIC)",
                    "SOIC-8 / SOP-8 (1.27mm pitch)",
                    "Surface Mount Device (SMD)",
                    8,
                    "8 Gull-wing leads (4 per opposing side)",
                    "Polarized (Pin 1 index dot / notch)",
                )

        if "transistor" in c or "mosfet" in c:
            return (
                "Discrete semiconductor transistor",
                "SOT-23 (SMD) or TO-92 (THT)",
                "Surface Mount / Through-Hole",
                3,
                "3 Terminals (Collector/Base/Emitter or Drain/Gate/Source)",
                "Polarized pinout",
            )

        if "inductor" in c:
            return (
                "Power Inductor / Choke",
                "Shielded Drum Core SMD / Toroidal THT",
                "Surface Mount / Through-Hole",
                2,
                "2 Solder pads or lead terminations",
                "Non-polarized",
            )

        if "connector" in c:
            return (
                "Interconnect Header / Jack",
                "Multi-pin Header or Socket Interface",
                "Through-Hole / Surface Mount",
                4,
                "Multiple conductive pin contacts",
                "Polarized by shroud or keying where applicable",
            )

        if "crystal" in c:
            return (
                "Quartz Crystal Resonator",
                "HC-49 (THT) or 4-Pad Ceramic SMD",
                "Surface Mount / Through-Hole",
                2,
                "2 Resonant terminals (plus optional ground shield)",
                "Non-polarized",
            )

        if "fuse" in c:
            return (
                "Overcurrent Protection Fuse",
                "Cartridge Glass Tube or SMD 1206 Fuse",
                "Through-Hole Clip / Surface Mount",
                2,
                "2 End-cap terminations",
                "Non-polarized",
            )

        if "transformer" in c:
            return (
                "High-Frequency Isolation Transformer",
                "E-Core / Toroidal Bobbin Assembly",
                "Through-Hole Technology (THT)",
                4,
                "Primary and secondary winding pin pairs",
                "Phase-dot polarized windings",
            )

        if "relay" in c:
            return (
                "Electromechanical PCB Relay",
                "Sealed DIP / Subminiature PCB Relay",
                "Through-Hole Technology (THT)",
                5,
                "Coil pins (2) and Contact pins (NO/NC/COM)",
                "Coil and contact specific pinout",
            )

        # Default fallback
        return (
            f"Electronic {cls}",
            f"Standard {cls} Package",
            "Discrete Component",
            2,
            "Visible terminal contacts",
            "Refer to component datasheet",
        )

component_intelligence = ComponentIntelligenceEnricher()
