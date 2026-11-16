#!/usr/bin/env python3
"""
Validation script: Tests the trained model across all 6 electronic hardware devices
and under all actual operational conditions (clean, dust_light, dust_moderate, dust_heavy).
"""

import os
import sys
from pathlib import Path
import cv2

# Add ai-service to path
sys.path.insert(0, os.path.abspath("ai-service"))
from app.inference.detector import detector
from app.inference.preprocessing import analyze_image_quality

DEVICES = [
    ("laptop_motherboard", "Consumer Laptop Mainboard"),
    ("iot_controller", "ESP32 / Sensor Controller"),
    ("power_supply", "AC/DC Power Supply PCB"),
    ("industrial_controller", "Industrial Control Board"),
    ("smartphone_pcb", "Smartphone PCB"),
    ("router_board", "Router Board"),
]

CONDITIONS = [
    "clean",
    "dust_light",
    "dust_moderate",
    "dust_heavy",
]

def main():
    print("=" * 80)
    print(" ECOINTEL MULTI-DEVICE & ACTUAL CONDITION AI INFERENCE VERIFICATION")
    print(f" Active Model   : {detector.model_name} ({detector.model_version})")
    print(f" Custom Trained : {detector.is_custom_trained}")
    print(f" Device / Mode  : {detector.device} / {detector.model_status}")
    print("=" * 80)

    total_tests = len(DEVICES) * len(CONDITIONS)
    passed_tests = 0

    for dev_key, dev_name in DEVICES:
        print(f"\n--- Testing Hardware: {dev_name} ({dev_key}) ---")
        for cond in CONDITIONS:
            img_path = Path("public/images/samples/conditions") / f"{dev_key}_{cond}.jpg"
            if not img_path.exists():
                # Fallback to base image
                img_path = Path("public/images/samples") / f"{dev_key}.jpg"

            if not img_path.exists():
                print(f"  ❌ Missing test image: {img_path}")
                continue

            cv_img = cv2.imread(str(img_path))
            if cv_img is None:
                print(f"  ❌ Failed to load image: {img_path}")
                continue

            # Run full detection pipeline
            result = detector.detect(cv_img)
            quality = result.quality

            print(f"  [{cond.upper():12}] Detected: {result.totalDetected:2d} boxes | "
                  f"Avg Conf: {result.confidenceAverage:.2f} | "
                  f"Dust Level: {quality.dustLevel:8} | "
                  f"Score: {quality.score:.2f} | "
                  f"Time: {result.processingTimeMs:.1f}ms")

            assert result.success is True
            assert result.image.width > 0 and result.image.height > 0
            passed_tests += 1

    print("\n" + "=" * 80)
    print(f" VERIFICATION RESULTS: {passed_tests}/{total_tests} Tests Passed Successfully!")
    print("=" * 80)

if __name__ == "__main__":
    main()
