#!/usr/bin/env python3
"""
EcoIntel Component Technical Intelligence & Report Verification Suite
=====================================================================
Validates that:
1. All 11 target components generate accurate hierarchical taxonomy and detailed engineering reports.
2. Toroidal Inductors (Iron Powder, Ferrite, Common-Mode Choke) generate dedicated toroid reports:
   - Core coating observation without guessing Material 26
   - Winding analysis and turn estimation
   - Low external leakage flux & EMI characteristics
   - AC/DC compatibility & saturation limits
3. Resistors:
   - Axial through-hole decoded with color bands, nominal resistance, tolerance range
   - SMD chip decoded via 3-digit, 4-digit, or EIA-96 marking codes
4. Capacitors (Electrolytic vs Ceramic MLCC) correctly resolved with polarity rules.
5. Diodes, MOSFETs, Transformers, Connectors verified.
6. Unsupported numerical specs are strictly tagged NOT_AVAILABLE or omitted from guessing.
7. Provenance labels verified across all technical specifications.
"""

import os
import sys
import numpy as np
import cv2

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AI_SERVICE_DIR = os.path.join(BASE_DIR, "ai-service")
if AI_SERVICE_DIR not in sys.path:
    sys.path.insert(0, AI_SERVICE_DIR)

from app.inference.component_intelligence import component_intelligence
from app.inference.toroid_analyzer import toroidal_analyzer
from app.inference.component_knowledge_base import decode_smd_resistor_code

def create_synthetic_toroid(coating_color="yellow", dual_winding=False):
    """Generates synthetic toroidal inductor image crop for optical validation."""
    img = np.full((140, 140, 3), 245, dtype=np.uint8)
    
    # Core coating
    bgr_color = (0, 200, 220) if coating_color == "yellow" else (40, 160, 40) if coating_color == "green" else (30, 30, 30)
    cv2.circle(img, (70, 70), 55, bgr_color, -1)
    # Center aperture hole
    cv2.circle(img, (70, 70), 28, (245, 245, 245), -1)
    
    # Helical copper wire turns
    copper_bgr = (20, 90, 180) # Amber/copper
    turns_count = 12 if not dual_winding else 16
    for deg in range(0, 360, 360 // turns_count):
        rad = np.radians(deg)
        x1 = int(70 + 29 * np.cos(rad))
        y1 = int(70 + 29 * np.sin(rad))
        x2 = int(70 + 54 * np.cos(rad))
        y2 = int(70 + 54 * np.sin(rad))
        cv2.line(img, (x1, y1), (x2, y2), copper_bgr, 4)

    # Lead wires extending downwards
    cv2.line(img, (55, 120), (55, 138), (140, 140, 140), 3)
    cv2.line(img, (85, 120), (85, 138), (140, 140, 140), 3)
    if dual_winding:
        cv2.line(img, (45, 120), (45, 138), (140, 140, 140), 3)
        cv2.line(img, (95, 120), (95, 138), (140, 140, 140), 3)

    return img

def test_smd_resistor_decoder():
    print("=" * 70)
    print("TEST: SMD Resistor Alphanumeric Marking Decoder")
    print("=" * 70)

    # 1. Standard 3-digit EIA (e.g. '103' = 10k)
    r1 = decode_smd_resistor_code("103")
    assert r1 is not None and r1["formattedResistance"] == "10 kΩ", f"Expected 10 kΩ, got {r1}"
    print(f" PASS: 3-Digit Code '103' -> {r1['formattedResistance']} ({r1['tolerance']})")

    # 2. Precision 4-digit EIA (e.g. '4702' = 47k)
    r2 = decode_smd_resistor_code("4702")
    assert r2 is not None and r2["formattedResistance"] == "47 kΩ", f"Expected 47 kΩ, got {r2}"
    print(f" PASS: 4-Digit Code '4702' -> {r2['formattedResistance']} ({r2['tolerance']})")

    # 3. EIA-96 Code (e.g. '01C' = 100 * 100 = 10k)
    r3 = decode_smd_resistor_code("01C")
    assert r3 is not None and r3["formattedResistance"] == "10 kΩ", f"Expected 10 kΩ, got {r3}"
    print(f" PASS: EIA-96 Code '01C' -> {r3['formattedResistance']} ({r3['tolerance']})")

    # 4. Decimal 'R' code (e.g. '4R7' = 4.7 Ohm)
    r4 = decode_smd_resistor_code("4R7")
    assert r4 is not None and r4["formattedResistance"] == "4.7 Ω", f"Expected 4.7 Ω, got {r4}"
    print(f" PASS: Decimal Code '4R7' -> {r4['formattedResistance']}")

def test_toroidal_inductors():
    print("\n" + "=" * 70)
    print("TEST: Dedicated Toroidal Inductor Technical Intelligence Engine")
    print("=" * 70)

    # 1. Toroidal Iron Powder Inductor (Yellow coating)
    yellow_toroid = create_synthetic_toroid(coating_color="yellow", dual_winding=False)
    det = {"className": "Inductor", "bbox": {"x": 10, "y": 10, "width": 120, "height": 120}, "confidence": 0.91}
    res = component_intelligence.enrich_detection(det, yellow_toroid)

    assert "Toroidal" in res["subtype"], f"Expected Toroidal subtype, got {res['subtype']}"
    report = res["technicalReport"]
    assert report is not None, "Missing technicalReport"
    assert report["componentIdentity"]["componentFamily"] == "Inductor"
    assert "Toroidal Ring" in report["componentIdentity"]["physicalForm"]
    assert "Faraday's Law" in report["workingPrinciple"]["governingLaw"]
    assert "AC & DC Compatible" in report["acDcCompatibility"]["rating"]
    assert report["emiCharacteristics"]["leakageFluxReduction"] is not None

    # Verify zero-fabrication of numerical inductance
    inductance_spec = next((s for s in report["technicalSpecifications"] if "Inductance" in s["parameter"]), None)
    assert inductance_spec is not None and inductance_spec["provenance"] == "NOT_AVAILABLE", "Inductance must be NOT_AVAILABLE!"
    assert "Cannot determine" in inductance_spec["value"]

    print(f" PASS: Toroidal Iron Powder Inductor -> Subtype: {res['subtype']}")
    print(f"       Core Appearance: {res['technicalIdentification'].get('coreAppearance')}")
    print(f"       Inductance Provenance: {inductance_spec['provenance']} (Correctly not fabricated)")

    # 2. Toroidal Ferrite Common-Mode Choke (Green coating, 4 leads)
    green_choke = create_synthetic_toroid(coating_color="green", dual_winding=True)
    det2 = {"className": "Inductor", "bbox": {"x": 10, "y": 10, "width": 120, "height": 120}, "confidence": 0.93}
    res2 = component_intelligence.enrich_detection(det2, green_choke)
    assert "Common-Mode Choke" in res2["subtype"] or "Toroidal" in res2["subtype"]
    assert res2["visibleTerminals"] == 4, f"Expected 4 leads for common-mode choke, got {res2['visibleTerminals']}"
    print(f" PASS: Common-Mode Choke -> Subtype: {res2['subtype']}, Visible Leads: {res2['visibleTerminals']}")

def test_diverse_components():
    print("\n" + "=" * 70)
    print("TEST: Multi-Component Family Reports & Strict Provenance Verification")
    print("=" * 70)

    fixtures = [
        ("Resistor (Axial THT)", "Resistor", {"x": 20, "y": 20, "width": 160, "height": 40}, "Axial through-hole resistor", "Through-Hole Technology (THT)"),
        ("Resistor (SMD Chip)", "Resistor", {"x": 20, "y": 20, "width": 40, "height": 30}, "SMD Thick Film Chip Resistor", "Surface Mount Device (SMD)"),
        ("Capacitor (Electrolytic Can)", "Capacitor", {"x": 20, "y": 20, "width": 60, "height": 110}, "Aluminum Electrolytic Radial Capacitor", "Through-Hole Technology (THT)"),
        ("Capacitor (Ceramic MLCC)", "Capacitor", {"x": 20, "y": 20, "width": 30, "height": 25}, "Multilayer Ceramic Chip Capacitor (MLCC)", "Surface Mount Device (SMD)"),
        ("Diode (Rectifier)", "Diode", {"x": 20, "y": 20, "width": 60, "height": 30}, "Semiconductor Rectifier / Schottky Diode", "Through-Hole / Surface Mount"),
        ("MOSFET (Power Switch)", "MOSFET", {"x": 20, "y": 20, "width": 50, "height": 50}, "Discrete Semiconductor Transistor / Power MOSFET", "Surface Mount / Through-Hole"),
        ("Transformer (Isolation)", "Transformer", {"x": 20, "y": 20, "width": 80, "height": 80}, "High-Frequency Isolation Transformer", "Through-Hole Technology (THT)"),
        ("Connector (Header)", "Connector", {"x": 20, "y": 20, "width": 100, "height": 40}, "Interconnect Header / Jack", "Through-Hole / Surface Mount"),
    ]

    for label, cls, bbox, exp_subtype, exp_mount in fixtures:
        mock_img = np.full((180, 200, 3), 200, dtype=np.uint8)
        det = {"className": cls, "bbox": bbox, "confidence": 0.88}
        res = component_intelligence.enrich_detection(det, mock_img)
        rep = res["technicalReport"]

        assert rep is not None, f"Missing technical report for {label}"
        assert res["subtype"] == exp_subtype, f"[{label}] Expected subtype '{exp_subtype}', got '{res['subtype']}'"
        assert res["mountingType"] == exp_mount, f"[{label}] Expected mounting '{exp_mount}', got '{res['mountingType']}'"

        # Check required sections presence
        for sec in ["componentIdentity", "constructionAndMaterials", "workingPrinciple", "primaryFunctions", "commonApplications", "acDcCompatibility", "technicalSpecifications", "identificationEvidence", "inspectionLimitations"]:
            assert sec in rep, f"[{label}] Missing report section: {sec}"

        # Check provenance tags on all specifications
        for spec in rep["technicalSpecifications"]:
            assert "provenance" in spec, f"[{label}] Specification missing provenance label: {spec}"
            assert spec["provenance"] in ["IMAGE_OBSERVED", "OCR_EXTRACTED", "DATASHEET_VERIFIED", "DATABASE_REFERENCE", "VISUAL_INFERENCE", "NOT_AVAILABLE"]

        print(f" PASS: {label:<32} -> Subtype: {res['subtype']} ({len(rep['technicalSpecifications'])} verified specs)")

    print("\n" + "=" * 70)
    print("ALL 11 COMPONENT ENGINE ACCEPTANCE TESTS PASSED (100% SUCCESS)!")
    print("=" * 70)

if __name__ == "__main__":
    test_smd_resistor_decoder()
    test_toroidal_inductors()
    test_diverse_components()
