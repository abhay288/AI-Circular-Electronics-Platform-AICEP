#!/usr/bin/env python3
"""
EcoIntel Direct AI Inference CLI
=================================
Runs the trained YOLO component detector, image-type classifier, and OpenCV PCB topology analysis
directly using Python and PyTorch weights, without requiring a running HTTP microservice.
Strictly adheres to Image-Only Policy: zero fabrication, zero mock datasets.
"""

import sys
import os
import json
import base64
import time
import hashlib
import cv2
import numpy as np

# Ensure ai-service is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AI_SERVICE_DIR = os.path.join(BASE_DIR, "ai-service")
if AI_SERVICE_DIR not in sys.path:
    sys.path.insert(0, AI_SERVICE_DIR)

from app.inference.image_classifier import image_classifier
from app.inference.detector import detector
from app.inference.pcb_analyzer import pcb_analyzer
from app.inference.visual_condition import visual_condition_analyzer
from app.inference.preprocessing import analyze_image_quality
from app.inference.ocr_extractor import ocr_extractor
from app.inference.component_intelligence import component_intelligence

def load_image(image_input: str) -> np.ndarray:
    """Loads image from file path, base64 data URI, or text file."""
    if image_input == "--stdin":
        image_input = sys.stdin.read().strip()

    if image_input.endswith((".txt", ".b64")) and os.path.exists(image_input):
        with open(image_input, "r", encoding="utf-8") as f:
            content = f.read().strip()
            return load_image(content)

    if image_input.startswith("data:image"):
        _, encoded = image_input.split(",", 1)
        image_bytes = base64.b64decode(encoded)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    elif os.path.exists(image_input):
        return cv2.imread(image_input)
    else:
        # Check if in base dir or public/
        clean_path = image_input.lstrip("/\\")
        rel_path = os.path.join(BASE_DIR, clean_path)
        if os.path.exists(rel_path):
            return cv2.imread(rel_path)
        pub_path = os.path.join(BASE_DIR, "public", clean_path)
        if os.path.exists(pub_path):
            return cv2.imread(pub_path)
        raise FileNotFoundError(f"Image not found at path: {image_input}")

def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python direct_ai_inference.py <image_path_or_data_uri> [analysis_id]"
        }))
        sys.exit(1)

    image_source = sys.argv[1]
    analysis_id = sys.argv[2] if len(sys.argv) > 2 else "ECI-DIRECT"

    try:
        cv_img = load_image(image_source)
        if cv_img is None:
            raise ValueError("Failed to decode image into OpenCV format. File may be corrupted or unreadable.")

        h, w = cv_img.shape[:2]

        # 0. Compute SHA-256 hash of original image bytes for provenance tracking
        _, encoded_img = cv2.imencode(".png", cv_img)
        image_hash = hashlib.sha256(encoded_img.tobytes()).hexdigest()

        # 1. Image-Type Classification (ISOLATED_COMPONENT, PCB_BOARD, ELECTRONIC_DEVICE, etc.)
        image_type_info = image_classifier.classify(cv_img)
        image_type = image_type_info.get("imageType", "UNKNOWN")

        # 2. Image Quality & Optical Diagnostics
        quality = analyze_image_quality(cv_img)

        # 3. Component Detection (Trained YOLO model + isolated component geometry)
        det_response = detector.detect(cv_img, image_type=image_type)
        detections = [d.model_dump() for d in det_response.detections]
        for d in detections:
            d["intelligence"] = component_intelligence.enrich_detection(d, cv_img, image_type=image_type)

        # 4. PCB Visual Structure (Conditioned on imageType)
        pcb_res = pcb_analyzer.analyze(cv_img, detections, analysis_id, image_type=image_type)

        # 5. Visual Condition & Damage Inspection
        cond_res = visual_condition_analyzer.analyze_board_conditions(
            cv_img, detections, analysis_id, image_type=image_type
        )

        # 6. Visible Text & Silkscreen Markings (OCR)
        ocr_res = ocr_extractor.extract_markings(cv_img, detections, image_type=image_type)

        # 7. Strict Evidence-Based Summary
        damage_items = [c for c in cond_res.get("conditions", []) if c.get("visualCondition") != "NORMAL"]
        high_severity = [d for d in damage_items if d.get("severity") == "HIGH" or d.get("severity") == "CRITICAL"]
        med_severity = [d for d in damage_items if d.get("severity") == "MEDIUM"]

        if image_type == "UNSUITABLE_IMAGE" or quality.get("score", 1.0) < 0.45 or quality.get("quality") == "POOR":
            overall_classification = "Image quality insufficient for assessment."
            summary_statement = "Image optical resolution, blur, or lighting is inadequate for conclusive visual inspection."
        elif len(high_severity) > 0:
            overall_classification = "Severe visible physical damage."
            summary_statement = f"Identified {len(high_severity)} high-severity visible anomaly/anomalies (e.g. {high_severity[0].get('visualCondition')})."
        elif len(med_severity) > 0 or len(damage_items) >= 2:
            overall_classification = "Moderate visible physical damage."
            summary_statement = f"Observed {len(damage_items)} visible surface defect(s) on component packaging or board."
        elif len(damage_items) > 0:
            overall_classification = "Minor visible surface damage."
            summary_statement = f"Observed minor visible surface irregularity ({damage_items[0].get('visualCondition')})."
        elif image_type == "ISOLATED_COMPONENT":
            comp_name = detections[0]["className"] if len(detections) > 0 else "Electronic component"
            overall_classification = "No obvious visible damage detected."
            summary_statement = f"Observed 1 isolated {comp_name} on clean background. No physical fracture, charring, or terminal severance detected. This does not confirm electrical functionality."
        else:
            overall_classification = "No obvious visible damage detected."
            summary_statement = "No obvious visible damage was detected in this image. This does not confirm electrical functionality."

        evidence_summary = {
            "classification": overall_classification,
            "statement": summary_statement,
            "findingsCount": len(damage_items),
            "damageFindings": damage_items,
            "opticalLimitations": [
                "Optical inspection is strictly limited to visible exterior surface features in the 2D photography.",
                "Internal silicon junction health, dielectric breakdown, and hidden BGA solder balls remain UNKNOWN.",
                "Multilayer inner copper traces and buried ground/power planes cannot be determined from optical photography.",
                "This visual analysis does not confirm electrical functionality, signal integrity, or electrical continuity.",
            ],
            "recommendedManualInspections": [
                "Perform four-wire Kelvin electrical continuity testing across key power/ground rails.",
                "X-ray inspection (computed tomography) for BGA solder voids and inner-layer copper integrity.",
                "Laboratory in-circuit voltage, clock frequency, and current draw measurement under powered test conditions.",
            ],
        }

        # Module statuses tracking
        modules = {
            "imageClassification": {
                "status": "COMPLETED",
                "imageType": image_type,
                "confidence": image_type_info.get("confidence", 1.0),
                "reason": image_type_info.get("reason", ""),
            },
            "componentDetection": {
                "status": "COMPLETED",
                "count": len(detections),
            },
            "visualCondition": {
                "status": "COMPLETED",
                "damageFindingsCount": len(damage_items),
            },
            "pcbAnalysis": {
                "status": "COMPLETED" if image_type == "PCB_BOARD" else "UNSUPPORTED_IMAGE",
                "reason": pcb_res.get("message", "PCB structure mapped successfully."),
            },
            "ocr": {
                "status": "COMPLETED",
                "markingsCount": ocr_res.get("totalMarkingsDetected", 0),
            },
        }

        output = {
            "success": True,
            "analysisId": analysis_id,
            "imageHash": image_hash,
            "imageType": image_type,
            "imageClassification": image_type_info,
            "modules": modules,
            "model": {
                "name": detector.model_name,
                "version": detector.model_version,
                "customTrained": detector.is_custom_trained,
                "device": str(detector.device),
                "classTaxonomy": detector.class_names,
            },
            "quality": quality,
            "totalDetected": det_response.totalDetected,
            "confidenceAverage": det_response.confidenceAverage,
            "processingTimeMs": det_response.processingTimeMs,
            "detections": detections,
            "pcb": pcb_res,
            "visualCondition": cond_res,
            "ocr": ocr_res,
            "summary": evidence_summary,
        }

        def json_serialize(obj):
            if isinstance(obj, (np.integer, np.int64, np.int32)):
                return int(obj)
            elif isinstance(obj, (np.floating, np.float64, np.float32)):
                return float(obj)
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            return str(obj)

        print(json.dumps(output, default=json_serialize))

    except Exception as exc:
        import traceback
        traceback.print_exc(file=sys.stderr)
        print(json.dumps({
            "success": False,
            "error": str(exc),
            "analysisId": analysis_id,
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
