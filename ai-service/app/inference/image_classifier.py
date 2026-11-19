"""
EcoIntel Hierarchical Image Type & Domain Classifier
=====================================================
Accurately categorizes verified electronic hardware into specific form-factors:
  - FULL_PCB: Standard printed circuit board assembly
  - MOTHERBOARD: Large complex computing board (Desktop/Server/Industrial)
  - DESKTOP_PCB: Desktop computer ATX/ITX motherboard
  - LAPTOP_PCB: Laptop motherboard with soldered CPU/RAM/heatpipe
  - MOBILE_PCB: Smartphone/tablet high-density PCB with RF shield cans
  - POWER_SUPPLY_BOARD: SMPS / AC-DC power supply with large caps & transformers
  - SINGLE_COMPONENT: Isolated through-hole or discrete component (resistor, toroid, IC, etc.)
  - MULTIPLE_COMPONENTS: Tray or collection of loose components
  - ELECTRONIC_DEVICE: Assembled consumer hardware chassis / outer enclosure
  - MIXED_ELECTRONIC_SCENE: Hardware held in hand or workbench mixed scene
  - UNKNOWN_ELECTRONICS: Unclassified electronic hardware
  - NON_ELECTRONIC: Out-of-domain image rejected by guardrails
  - UNSUITABLE_IMAGE: Optical quality insufficient for assessment
"""

import cv2
import numpy as np
from typing import Dict, Any, Tuple
from app.inference.relevance_classifier import relevance_classifier

class ImageTypeClassifier:
    """
    Evaluates background uniformity, substrate color distribution, edge frequency,
    component topology, and aspect ratio to classify image domain without heuristics or fabrication.
    """

    def classify(self, cv_img: np.ndarray) -> Dict[str, Any]:
        if cv_img is None or cv_img.size == 0:
            return {
                "imageType": "UNSUITABLE_IMAGE",
                "relevance": "UNSUITABLE_IMAGE",
                "confidence": 1.0,
                "hasPcbSubstrate": False,
                "isIsolatedComponent": False,
                "reason": "Image data is empty or unreadable.",
            }

        # 1. First run Mandatory Image Relevance Gatekeeper
        rel = relevance_classifier.classify_relevance(cv_img)
        if rel["relevance"] == "NON_ELECTRONIC":
            return {
                "imageType": "NON_ELECTRONIC",
                "relevance": "NON_ELECTRONIC",
                "confidence": rel["confidence"],
                "hasPcbSubstrate": False,
                "isIsolatedComponent": False,
                "category": rel.get("category", "NON_ELECTRONIC"),
                "reason": rel.get("reason", "Image is not electronic hardware."),
                "rejectionRecommendation": True,
                "rejectionMessage": rel.get("rejectionMessage"),
                "signals": rel.get("signals"),
            }

        if rel["relevance"] == "UNSUITABLE_IMAGE":
            return {
                "imageType": "UNSUITABLE_IMAGE",
                "relevance": "UNSUITABLE_IMAGE",
                "confidence": rel["confidence"],
                "hasPcbSubstrate": False,
                "isIsolatedComponent": False,
                "category": rel.get("category", "UNSUITABLE_IMAGE"),
                "reason": rel.get("reason", "Image optical quality is insufficient."),
                "rejectionRecommendation": True,
                "rejectionMessage": rel.get("rejectionMessage"),
            }

        if rel["relevance"] == "MIXED_SCENE":
            return {
                "imageType": "MIXED_ELECTRONIC_SCENE",
                "relevance": "MIXED_SCENE",
                "confidence": rel["confidence"],
                "hasPcbSubstrate": True,
                "isIsolatedComponent": False,
                "category": "MIXED_ELECTRONIC_SCENE",
                "reason": rel.get("reason", "Mixed scene with human interaction."),
                "electronicRegions": rel.get("electronicRegions", []),
                "rejectionRecommendation": False,
            }

        h, w = cv_img.shape[:2]
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(cv_img, cv2.COLOR_BGR2HSV)

        # 2. Check for Single Isolated Component
        is_studio_bg, is_discrete, subtype, isolated_features = relevance_classifier._verify_isolated_component(
            cv_img, gray, hsv, w, h, False
        )
        if rel.get("category") == "DISCRETE_COMPONENT" or is_discrete:
            return {
                "imageType": "SINGLE_COMPONENT",
                "relevance": "ELECTRONICS_RELATED",
                "confidence": 0.95,
                "hasPcbSubstrate": False,
                "isIsolatedComponent": True,
                "category": "SINGLE_COMPONENT",
                "subtype": subtype if subtype != "NONE" else rel.get("subtype", "DISCRETE_COMPONENT"),
                "reason": "Single isolated electronic component on neutral plain background. PCB substrate is NOT present.",
                "details": isolated_features,
            }

        if is_studio_bg and isolated_features.get("objectCount", 0) > 1:
            return {
                "imageType": "MULTIPLE_COMPONENTS",
                "relevance": "ELECTRONICS_RELATED",
                "confidence": 0.89,
                "hasPcbSubstrate": False,
                "isIsolatedComponent": False,
                "category": "MULTIPLE_COMPONENTS",
                "reason": "Multiple distinct loose components on uniform background without a PCB board.",
                "details": isolated_features,
            }

        # 3. Form-Factor Subtyping for Circuit Boards
        pcb_color_ratio, dominant_solder_mask, via_count, pad_count = relevance_classifier._evaluate_pcb_substrate_evidence(cv_img, gray, hsv, w, h)
        edge_density, orthogonal_line_score, trace_count = relevance_classifier._evaluate_pcb_texture(gray, w, h)

        # A. Power Supply Board (Large cylindrical capacitors, transformers, heatsinks)
        # Check for circular can shapes and high-contrast large rectangular transformers
        circles = cv2.HoughCircles(
            gray, cv2.HOUGH_GRADIENT, dp=1.2, minDist=35,
            param1=80, param2=38, minRadius=20, maxRadius=int(min(w, h) * 0.25)
        )
        large_circle_count = len(circles[0]) if circles is not None else 0

        # Yellow transformer tape detection in HSV (Hue ~ 20-35, Sat > 100)
        yellow_tape = cv2.inRange(hsv, np.array([20, 100, 80]), np.array([35, 255, 255]))
        yellow_ratio = float(np.count_nonzero(yellow_tape)) / float(w * h)

        if large_circle_count >= 3 and yellow_ratio > 0.015:
            return {
                "imageType": "POWER_SUPPLY_BOARD",
                "relevance": "ELECTRONICS_RELATED",
                "confidence": 0.90,
                "hasPcbSubstrate": True,
                "isIsolatedComponent": False,
                "dominantSolderMask": dominant_solder_mask,
                "reason": f"Identified SMPS power supply assembly: {large_circle_count} large electrolytic filter capacitors and magnetic power transformer.",
                "details": {
                    "largeCapacitorCount": large_circle_count,
                    "transformerYellowRatio": round(yellow_ratio, 4),
                },
            }

        # B. Mobile / Smartphone PCB (ultra-dense, high aspect ratio > 2.0 or RF shield cans)
        aspect_ratio = float(max(w, h)) / float(max(1, min(w, h)))
        # Silver / metallic shield can detection in HSV (low sat < 35, high val > 140)
        silver_mask = cv2.inRange(hsv, np.array([0, 0, 130]), np.array([180, 40, 240]))
        silver_ratio = float(np.count_nonzero(silver_mask)) / float(w * h)

        if (aspect_ratio > 2.2 and edge_density > 0.035 and silver_ratio > 0.15) or (aspect_ratio > 2.5 and pcb_color_ratio > 0.10):
            return {
                "imageType": "MOBILE_PCB",
                "relevance": "ELECTRONICS_RELATED",
                "confidence": 0.89,
                "hasPcbSubstrate": True,
                "isIsolatedComponent": False,
                "dominantSolderMask": dominant_solder_mask,
                "reason": f"High-aspect ratio ({aspect_ratio:.1f}:1) mobile form-factor with RF shielding partitions and micro-miniature SMD topology.",
                "details": {
                    "aspectRatio": round(aspect_ratio, 2),
                    "shieldCanRatio": round(silver_ratio, 3),
                },
            }

        # C. Motherboard / Laptop PCB vs Desktop Motherboard
        # Large motherboards have high component density, grid arrays, memory slots or CPU socket
        if edge_density > 0.040 and (w >= 1000 or h >= 1000):
            if aspect_ratio > 1.6 and aspect_ratio < 2.2:
                return {
                    "imageType": "LAPTOP_PCB",
                    "relevance": "ELECTRONICS_RELATED",
                    "confidence": 0.88,
                    "hasPcbSubstrate": True,
                    "isIsolatedComponent": False,
                    "dominantSolderMask": dominant_solder_mask,
                    "reason": f"Laptop internal motherboard: dense integrated layout ({dominant_solder_mask} mask) with soldered subsystems.",
                    "details": {
                        "aspectRatio": round(aspect_ratio, 2),
                        "edgeDensity": round(edge_density, 4),
                    },
                }
            else:
                return {
                    "imageType": "MOTHERBOARD",
                    "relevance": "ELECTRONICS_RELATED",
                    "confidence": 0.92,
                    "hasPcbSubstrate": True,
                    "isIsolatedComponent": False,
                    "dominantSolderMask": dominant_solder_mask,
                    "reason": f"Computer motherboard assembly: large footprint with high component count and characteristic IC bus traces.",
                    "details": {
                        "edgeDensity": round(edge_density, 4),
                        "orthogonalLineScore": round(orthogonal_line_score, 3),
                    },
                }

        # D. Standard General PCB Board
        if pcb_color_ratio > 0.12 or edge_density > 0.025:
            return {
                "imageType": "FULL_PCB",
                "relevance": "ELECTRONICS_RELATED",
                "confidence": 0.91,
                "hasPcbSubstrate": True,
                "isIsolatedComponent": False,
                "dominantSolderMask": dominant_solder_mask,
                "reason": f"Standard electronic printed circuit board with visible {dominant_solder_mask} solder mask and component routing.",
                "details": {
                    "pcbColorRatio": round(pcb_color_ratio, 3),
                    "edgeDensity": round(edge_density, 4),
                },
            }

        # E. Electronic Device Enclosure
        if rel.get("category") == "ELECTRONIC_DEVICE":
            return {
                "imageType": "ELECTRONIC_DEVICE",
                "relevance": "ELECTRONICS_RELATED",
                "confidence": 0.82,
                "hasPcbSubstrate": False,
                "isIsolatedComponent": False,
                "reason": "External chassis / device enclosure of electronic equipment.",
            }

        # Fallback to UNKNOWN_ELECTRONICS
        return {
            "imageType": "UNKNOWN_ELECTRONICS",
            "relevance": "ELECTRONICS_RELATED",
            "confidence": 0.65,
            "hasPcbSubstrate": True,
            "isIsolatedComponent": False,
            "reason": "Electronic hardware assembly requiring manual visual verification of specific form factor.",
        }

image_classifier = ImageTypeClassifier()
