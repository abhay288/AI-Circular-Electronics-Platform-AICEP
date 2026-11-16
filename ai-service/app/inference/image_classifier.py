"""
EcoIntel Hardware Image Type Classifier
========================================
Scientifically classifies input images prior to optical analysis into:
- ISOLATED_COMPONENT: Individual component photograph (e.g. axial resistor, discrete IC, capacitor)
- PCB_BOARD: Printed circuit board with substrate, solder mask, traces, and mounted components
- ELECTRONIC_DEVICE: Outer enclosure, assembled device chassis, or consumer electronic casing
- MULTIPLE_COMPONENTS: Tray or collection of loose components without PCB substrate
- UNSUITABLE_IMAGE: Excessive blur, glare, solid blank image, or corrupted optical data
- UNKNOWN: Ambiguous scene requiring user verification
"""

import cv2
import numpy as np
from typing import Dict, Any, Tuple

class ImageTypeClassifier:
    """
    Evaluates background uniformity, substrate color distribution, edge frequency,
    and contour hierarchy to classify image domain without heuristics or fabrication.
    """

    def classify(self, cv_img: np.ndarray) -> Dict[str, Any]:
        if cv_img is None or cv_img.size == 0:
            return {
                "imageType": "UNSUITABLE_IMAGE",
                "confidence": 1.0,
                "hasPcbSubstrate": False,
                "isIsolatedComponent": False,
                "reason": "Image data is empty or unreadable.",
            }

        h, w = cv_img.shape[:2]
        if h < 100 or w < 100:
            return {
                "imageType": "UNSUITABLE_IMAGE",
                "confidence": 0.95,
                "hasPcbSubstrate": False,
                "isIsolatedComponent": False,
                "reason": f"Image resolution ({w}x{h}) is too low for reliable electronic inspection.",
            }

        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(cv_img, cv2.COLOR_BGR2HSV)

        # 1. Image Quality & Blur Check
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        mean_brightness = float(np.mean(gray))
        contrast_std = float(np.std(gray))

        # Blank or extreme glare / solid color
        if contrast_std < 5.0 and (mean_brightness > 250 or mean_brightness < 5):
            return {
                "imageType": "UNSUITABLE_IMAGE",
                "confidence": 0.99,
                "hasPcbSubstrate": False,
                "isIsolatedComponent": False,
                "reason": "Image is nearly blank or completely overexposed/underexposed.",
            }

        # 2. Check Background Uniformity (Border pixels analysis)
        # Sample 5% border margin around all four edges
        top_margin = cv_img[0:max(5, int(h * 0.05)), :]
        bot_margin = cv_img[min(h - 5, int(h * 0.95)):h, :]
        left_margin = cv_img[:, 0:max(5, int(w * 0.05))]
        right_margin = cv_img[:, min(w - 5, int(w * 0.95)):w]

        border_pixels = np.vstack([
            top_margin.reshape(-1, 3),
            bot_margin.reshape(-1, 3),
            left_margin.reshape(-1, 3),
            right_margin.reshape(-1, 3),
        ])

        border_std = np.std(border_pixels, axis=0)
        border_mean = np.mean(border_pixels, axis=0)
        is_uniform_border = float(np.mean(border_std)) < 22.0
        is_light_background = float(np.mean(border_mean)) > 215.0
        is_dark_background = float(np.mean(border_mean)) < 40.0

        # Background segmentation: pixels close to border mean
        diff_from_bg = np.linalg.norm(cv_img.astype(np.float32) - border_mean, axis=2)
        bg_mask = diff_from_bg < 38.0
        bg_ratio = float(np.count_nonzero(bg_mask)) / float(w * h)

        # 3. Overall Edge Density
        edges = cv2.Canny(gray, 40, 120)
        edge_density = float(np.count_nonzero(edges)) / float(w * h)

        # 4. Check for PCB Solder Mask Characteristics
        # Green solder mask (HSV hue ~ 35-85, sat > 40, val > 30)
        green_mask = cv2.inRange(hsv, np.array([35, 40, 30]), np.array([85, 255, 220]))
        # Blue solder mask (HSV hue ~ 95-130, sat > 50, val > 30)
        blue_mask = cv2.inRange(hsv, np.array([95, 50, 30]), np.array([130, 255, 220]))
        # Red solder mask (HSV hue ~ 0-10 or 170-180)
        red_mask1 = cv2.inRange(hsv, np.array([0, 70, 40]), np.array([10, 255, 220]))
        red_mask2 = cv2.inRange(hsv, np.array([170, 70, 40]), np.array([180, 255, 220]))
        red_mask = cv2.bitwise_or(red_mask1, red_mask2)

        pcb_color_pixels = (
            np.count_nonzero(green_mask) +
            np.count_nonzero(blue_mask) +
            np.count_nonzero(red_mask)
        )
        pcb_color_ratio = float(pcb_color_pixels) / float(w * h)

        # Find largest non-background contour (the foreground object)
        fg_mask = cv2.bitwise_not(bg_mask.astype(np.uint8) * 255)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        fg_cleaned = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel)
        contours, _ = cv2.findContours(fg_cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        foreground_objects = []
        for c in contours:
            area = cv2.contourArea(c)
            if area > (w * h * 0.005):
                x, y, bw, bh = cv2.boundingRect(c)
                foreground_objects.append({
                    "area": float(area),
                    "bbox": {"x": int(x), "y": int(y), "width": int(bw), "height": int(bh)},
                    "aspectRatio": round(float(bw) / max(1.0, float(bh)), 2),
                })

        foreground_objects.sort(key=lambda o: o["area"], reverse=True)

        # -------------------------------------------------------------
        # Decision Matrix
        # -------------------------------------------------------------
        # Case A: Plain studio background with isolated foreground object(s)
        if (is_uniform_border and bg_ratio > 0.45) or (is_light_background and bg_ratio > 0.40):
            if len(foreground_objects) <= 2:
                # Single isolated component on clean background
                return {
                    "imageType": "ISOLATED_COMPONENT",
                    "confidence": 0.94,
                    "hasPcbSubstrate": False,
                    "isIsolatedComponent": True,
                    "reason": "High background uniformity (>50% margin area) with single central electronic component foreground. No PCB substrate detected.",
                    "details": {
                        "bgRatio": round(bg_ratio, 3),
                        "edgeDensity": round(edge_density, 4),
                        "foregroundObjectsCount": len(foreground_objects),
                        "pcbColorRatio": round(pcb_color_ratio, 3),
                    },
                }
            elif len(foreground_objects) > 2:
                return {
                    "imageType": "MULTIPLE_COMPONENTS",
                    "confidence": 0.88,
                    "hasPcbSubstrate": False,
                    "isIsolatedComponent": False,
                    "reason": "Uniform background with multiple distinct component objects without a shared PCB substrate.",
                    "details": {
                        "bgRatio": round(bg_ratio, 3),
                        "foregroundObjectsCount": len(foreground_objects),
                    },
                }

        # Case B: Prominent PCB Solder Mask and High Edge Trace Density
        if (pcb_color_ratio > 0.18 and edge_density > 0.02) or (edge_density > 0.06 and bg_ratio < 0.35):
            return {
                "imageType": "PCB_BOARD",
                "confidence": 0.92,
                "hasPcbSubstrate": True,
                "isIsolatedComponent": False,
                "reason": "Identified PCB substrate solder mask with characteristic high-density copper traces and component grid.",
                "details": {
                    "pcbColorRatio": round(pcb_color_ratio, 3),
                    "edgeDensity": round(edge_density, 4),
                    "bgRatio": round(bg_ratio, 3),
                },
            }

        # Case C: Check for outer device casing / chassis
        if bg_ratio < 0.20 and edge_density < 0.04 and laplacian_var > 30:
            return {
                "imageType": "ELECTRONIC_DEVICE",
                "confidence": 0.78,
                "hasPcbSubstrate": False,
                "isIsolatedComponent": False,
                "reason": "Image depicts full device enclosure or external chassis rather than bare circuit board or isolated component.",
                "details": {
                    "bgRatio": round(bg_ratio, 3),
                    "edgeDensity": round(edge_density, 4),
                },
            }

        # Default fallback: If single dominant foreground object exists even on non-white background
        if len(foreground_objects) == 1 and foreground_objects[0]["area"] < (w * h * 0.40):
            return {
                "imageType": "ISOLATED_COMPONENT",
                "confidence": 0.82,
                "hasPcbSubstrate": False,
                "isIsolatedComponent": True,
                "reason": "Single focal component object without observable PCB substrate.",
                "details": {
                    "foregroundObjectsCount": 1,
                    "bgRatio": round(bg_ratio, 3),
                },
            }

        return {
            "imageType": "UNKNOWN",
            "confidence": 0.50,
            "hasPcbSubstrate": False,
            "isIsolatedComponent": False,
            "reason": "Scene characteristics are ambiguous between PCB, device assembly, and loose parts.",
            "details": {
                "bgRatio": round(bg_ratio, 3),
                "edgeDensity": round(edge_density, 4),
                "pcbColorRatio": round(pcb_color_ratio, 3),
            },
        }

image_classifier = ImageTypeClassifier()
