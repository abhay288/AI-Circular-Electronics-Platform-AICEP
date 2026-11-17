#!/usr/bin/env python3
"""
Unit and Integration Tests for EcoIntel Resistor Decoder
Tests EIA/IEC 60062 colour band calculations and real fixture decoding.
"""

import sys
import os
import cv2

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AI_SERVICE_DIR = os.path.join(BASE_DIR, "ai-service")
if AI_SERVICE_DIR not in sys.path:
    sys.path.insert(0, AI_SERVICE_DIR)

from app.inference.resistor_decoder import resistor_decoder

def test_math_decoding():
    print("=" * 60)
    print("TEST: Mathematical Colour Code Decoding")
    print("=" * 60)

    # 1. Standard 4-band: Brown - Black - Red - Gold (1 kΩ ±5%)
    b4 = [
        {"color": "Brown", "confidence": 0.95},
        {"color": "Black", "confidence": 0.96},
        {"color": "Red", "confidence": 0.95},
        {"color": "Gold", "confidence": 0.94},
    ]
    res4 = resistor_decoder._compute_resistance_math(b4)
    assert res4["nominalOhms"] == 1000.0, f"Expected 1000.0, got {res4['nominalOhms']}"
    assert res4["tolerancePercent"] == 5.0
    assert res4["minOhms"] == 950.0
    assert res4["maxOhms"] == 1050.0
    print(" PASS: 4-band 1 kΩ ±5% (Brown-Black-Red-Gold)")

    # 2. User prompt example: 5-band Brown - Black - Black - Red - Brown (10 kΩ ±1%)
    b5 = [
        {"color": "Brown", "confidence": 0.95},
        {"color": "Black", "confidence": 0.95},
        {"color": "Black", "confidence": 0.95},
        {"color": "Red", "confidence": 0.95},
        {"color": "Brown", "confidence": 0.95},
    ]
    res5 = resistor_decoder._compute_resistance_math(b5)
    assert res5["nominalOhms"] == 10000.0, f"Expected 10000.0, got {res5['nominalOhms']}"
    assert res5["tolerancePercent"] == 1.0
    assert res5["minOhms"] == 9900.0
    assert res5["maxOhms"] == 10100.0
    assert res5["formattedString"] == "10 kΩ ±1%"
    print(" PASS: 5-band 10 kΩ ±1% (Brown-Black-Black-Red-Brown)")

    # 3. 3-band: Orange - Orange - Brown (330 Ω ±20%)
    b3 = [
        {"color": "Orange", "confidence": 0.95},
        {"color": "Orange", "confidence": 0.95},
        {"color": "Brown", "confidence": 0.95},
    ]
    res3 = resistor_decoder._compute_resistance_math(b3)
    assert res3["nominalOhms"] == 330.0
    assert res3["tolerancePercent"] == 20.0
    assert res3["minOhms"] == 264.0
    assert res3["maxOhms"] == 396.0
    print(" PASS: 3-band 330 Ω ±20% (Orange-Orange-Brown)")

    # 4. 6-band: Blue - Grey - Black - Orange - Brown - Red (680 kΩ ±1% 50ppm)
    b6 = [
        {"color": "Blue", "confidence": 0.95},
        {"color": "Grey", "confidence": 0.95},
        {"color": "Black", "confidence": 0.95},
        {"color": "Orange", "confidence": 0.95},
        {"color": "Brown", "confidence": 0.95},
        {"color": "Red", "confidence": 0.95},
    ]
    res6 = resistor_decoder._compute_resistance_math(b6)
    assert res6["nominalOhms"] == 680000.0
    assert res6["tolerancePercent"] == 1.0
    assert res6["tempCoeff"] == 50
    assert res6["formattedString"] == "680 kΩ ±1%"
    print(" PASS: 6-band 680 kΩ ±1% 50ppm/K")

    # 5. Invalid band count rejection
    res_inv = resistor_decoder._compute_resistance_math([{"color": "Red"}])
    assert not res_inv["success"]
    print(" PASS: Invalid band count rejected")

def test_real_image_fixture():
    print("\n" + "=" * 60)
    print("TEST: Real Resistor Image Fixture Decoding")
    print("=" * 60)
    fixture_path = os.path.join(BASE_DIR, "tests", "fixtures", "resistor-public-domain-modified.jpg")
    img = cv2.imread(fixture_path)
    assert img is not None, f"Failed to load fixture at {fixture_path}"

    bbox = {"x": 98, "y": 269, "width": 605, "height": 63}
    res = resistor_decoder.decode_bands(img, bbox)

    print("Status       :", res["status"])
    print("Subtype      :", res["physicalIdentification"]["subtype"])
    print("Mounting     :", res["physicalIdentification"]["mountingType"])
    print("Terminals    :", res["physicalIdentification"]["visibleTerminals"])
    print("Terminal Desc:", res["physicalIdentification"]["terminalDescription"])
    print("Band Count   :", res["bandCount"])
    print("Bands        :", res["bandSequence"])
    print("Resistance   :", res["formattedResistance"])
    print("Range        :", res["formattedRange"])

    assert res["status"] == "COMPLETED", f"Expected COMPLETED, got {res['status']}"
    assert res["physicalIdentification"]["subtype"] == "Axial through-hole resistor"
    assert res["physicalIdentification"]["mountingType"] == "Through-Hole Technology (THT)"
    assert res["physicalIdentification"]["visibleTerminals"] == 2
    assert res["bandCount"] == 4
    assert res["bandSequence"] == ["Brown", "Black", "Red", "Gold"]
    assert res["nominalResistanceOhms"] == 1000.0
    assert res["tolerancePercent"] == 5.0
    assert res["minResistanceOhms"] == 950.0
    assert res["maxResistanceOhms"] == 1050.0
    print("\n ALL REAL FIXTURE ASSERTIONS PASSED!")

if __name__ == "__main__":
    test_math_decoding()
    test_real_image_fixture()
    print("\n" + "=" * 60)
    print("100% UNIT AND INTEGRATION TESTS PASSED")
    print("=" * 60)
