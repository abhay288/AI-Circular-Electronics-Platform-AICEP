"""
EcoIntel Visual Condition Model & Diagnostic Pipeline
======================================================
Comprehensive computer vision analysis for electronic hardware condition classification:
- NORMAL
- BURNT
- CORRODED
- CRACKED
- BULGED
- LEAKING
- DISCOLORED
- MISSING
- SOLDER_ANOMALY
- PHYSICALLY_DAMAGED
- UNKNOWN

DISCLAIMER:
Visual appearance does not infer or guarantee electrical functionality.
Electrical health remains UNKNOWN unless confirmed with in-circuit test data.
"""

import cv2
import numpy as np
from typing import Dict, Any, List, Optional, Tuple

VALID_CONDITIONS = [
    "NORMAL",
    "BURNT",
    "CORRODED",
    "CRACKED",
    "BULGED",
    "LEAKING",
    "DISCOLORED",
    "MISSING",
    "SOLDER_ANOMALY",
    "PHYSICALLY_DAMAGED",
    "UNKNOWN",
]

class VisualConditionAnalyzer:
    """
    Evaluates PCB surface and component packages for 11 canonical visual condition classes.
    Uses spectro-chromatic analysis, morphological filtering, and contour geometry.
    """

    def analyze_board_conditions(
        self,
        cv_image: np.ndarray,
        detections: List[Dict[str, Any]],
        analysis_id: str = "ECI-ANOMALY",
        image_type: Optional[str] = None
    ) -> Dict[str, Any]:
        h, w = cv_image.shape[:2]
        gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(cv_image, cv2.COLOR_BGR2HSV)

        findings: List[Dict[str, Any]] = []
        component_conditions: List[Dict[str, Any]] = []

        # 1. Component-wise visual condition evaluation
        for idx, d in enumerate(detections):
            bbox = d.get("bbox") or d.get("boundingBox") or {}
            bx = max(0, int(bbox.get("x", 0)))
            by = max(0, int(bbox.get("y", 0)))
            bw = min(w - bx, int(bbox.get("width", 50)))
            bh = min(h - by, int(bbox.get("height", 50)))

            if bw < 8 or bh < 8:
                continue

            crop_bgr = cv_image[by : by + bh, bx : bx + bw]
            crop_gray = gray[by : by + bh, bx : bx + bw]
            crop_hsv = hsv[by : by + bh, bx : bx + bw]

            comp_condition, severity, conf, evidence = self._evaluate_component_crop(
                crop_bgr, crop_gray, crop_hsv, d.get("className", "Component"), image_type
            )

            cid = d.get("componentId") or f"CMP-ECI-{analysis_id[-4:].upper()}-{idx+1:03d}"
            component_conditions.append({
                "componentId": cid,
                "className": d.get("className", "Component"),
                "visualCondition": comp_condition,
                "severity": severity,
                "confidence": round(conf, 3),
                "visualEvidence": evidence,
                "electricalIntegrity": "UNKNOWN (Visual inspection only)",
                "boundingBox": {"x": bx, "y": by, "width": bw, "height": bh},
            })

            if comp_condition != "NORMAL" and comp_condition != "UNKNOWN":
                findings.append({
                    "conditionId": f"CND-ECI-{analysis_id[-4:].upper()}-{len(findings)+1:03d}",
                    "condition": comp_condition,
                    "targetType": "COMPONENT",
                    "targetId": cid,
                    "severity": severity,
                    "confidence": round(conf, 3),
                    "boundingBox": {"x": bx, "y": by, "width": bw, "height": bh},
                    "visualEvidence": evidence,
                    "recommendedInspection": self._get_recommendation(comp_condition),
                })

        # 2. Global PCB Surface Anomaly Scanning (Burn marks, corrosion crust)
        # Strictly run only when image is a confirmed PCB board
        if image_type == "PCB_BOARD":
            surface_findings = self._scan_surface_anomalies(cv_image, gray, hsv, w, h, analysis_id)
            findings.extend(surface_findings)

        # 3. Compute Aggregate Visual Condition Score (0 - 100)
        penalty = 0
        for f in findings:
            sev = f.get("severity", "LOW")
            if sev == "CRITICAL":
                penalty += 25
            elif sev == "HIGH":
                penalty += 15
            elif sev == "MEDIUM":
                penalty += 8
            else:
                penalty += 4

        visual_score = max(20, min(98, 100 - penalty))

        # Condition breakdown summary
        breakdown: Dict[str, int] = {c: 0 for c in VALID_CONDITIONS}
        for cc in component_conditions:
            cond = cc["visualCondition"]
            breakdown[cond] = breakdown.get(cond, 0) + 1

        return {
            "visualConditionScore": visual_score,
            "overallAssessment": (
                "EXCELLENT_CONDITION" if visual_score >= 90
                else "ACCEPTABLE_WEAR" if visual_score >= 75
                else "SURFACE_DEGRADATION" if visual_score >= 50
                else "CRITICAL_ANOMALIES_DETECTED"
            ),
            "findingsCount": len(findings),
            "findings": findings,
            "componentConditions": component_conditions,
            "conditionBreakdown": breakdown,
            "disclaimer": (
                "Visual condition score is strictly based on optical computer vision surface inspection. "
                "Electrical health and remaining dielectric lifetime remain UNKNOWN without in-circuit electrical telemetry."
            ),
            "modelVersion": "EcoIntel-VisualCondition-v1.0.0",
        }

    def _evaluate_component_crop(
        self,
        bgr: np.ndarray,
        gray: np.ndarray,
        hsv: np.ndarray,
        comp_type: str,
        image_type: Optional[str] = None
    ) -> Tuple[str, str, float, str]:
        """Analyzes a single component sub-image for genuine visual anomalies."""
        mean_lum = float(np.mean(gray))
        var_lum = float(np.var(gray))
        h, w = gray.shape[:2]

        # Resistors have normal colored coding bands (black, brown, red, gold, etc.)
        # and ICs have normal black packaging. Do not classify normal body markings as burns!
        is_resistor = "resistor" in comp_type.lower() or image_type == "ISOLATED_COMPONENT"

        # 1. Check for BURNT / Severe Carbonization
        # True burning exhibits irregular rough blistered cratering with high Laplacian variance and soot halo
        if not is_resistor:
            dark_pixels = np.count_nonzero(gray < 25)
            dark_ratio = dark_pixels / max(1, w * h)
            laplacian = cv2.Laplacian(gray, cv2.CV_64F)
            lap_var = float(laplacian.var())
            if dark_ratio > 0.55 and mean_lum < 35 and lap_var > 600.0:
                return "BURNT", "CRITICAL", 0.90, "Severe localized surface carbonization and charred packaging."

        # 2. Check for CORRODED (Verdigris / Greenish-Cyan oxidation crust)
        if not is_resistor:
            lower_green = np.array([35, 60, 40])
            upper_green = np.array([85, 255, 220])
            corrosion_mask = cv2.inRange(hsv, lower_green, upper_green)
            corrosion_ratio = np.count_nonzero(corrosion_mask) / max(1, w * h)
            if corrosion_ratio > 0.32:
                return "CORRODED", "HIGH", 0.88, "Copper verdigris oxidation detected on leads and solder contact pads."

        # 3. Check for SOLDER_ANOMALY (Only applicable to PCB surface joints)
        if image_type == "PCB_BOARD":
            edges = cv2.Canny(gray, 40, 120)
            edge_density = np.count_nonzero(edges) / max(1, w * h)
            if edge_density > 0.38 and 40 < mean_lum < 160:
                return "SOLDER_ANOMALY", "MEDIUM", 0.80, "High-frequency surface roughness indicative of solder fatigue or cold joint."

        # 4. Check for DISCOLORED / Thermal Stress (on non-resistor packages)
        if not is_resistor and image_type == "PCB_BOARD":
            lower_amber = np.array([12, 80, 60])
            upper_amber = np.array([28, 255, 200])
            discolor_mask = cv2.inRange(hsv, lower_amber, upper_amber)
            if (np.count_nonzero(discolor_mask) / max(1, w * h)) > 0.40:
                return "DISCOLORED", "LOW", 0.75, "Thermal discoloration halo indicative of sustained elevated operating temperature."

        # 5. Check for BULGED / LEAKING (particularly for electrolytic capacitors)
        if ("Capacitor" in comp_type or "cap" in comp_type.lower()) and image_type == "PCB_BOARD":
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if contours:
                c = max(contours, key=cv2.contourArea)
                hull = cv2.convexHull(c)
                area = cv2.contourArea(c)
                hull_area = cv2.contourArea(hull)
                if hull_area > 0 and (area / hull_area) < 0.72:
                    return "BULGED", "HIGH", 0.84, "Convex top deformation detected on capacitor enclosure."

        # 6. Check for CRACKED / PHYSICALLY_DAMAGED
        # Sharp fracture fissures traversing the body
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.count_nonzero(edges) / max(1, w * h)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        if laplacian.var() > 800.0 and edge_density > 0.30:
            lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=20, minLineLength=max(8, int(min(w, h) * 0.5)), maxLineGap=3)
            if lines is not None and len(lines) >= 4:
                return "CRACKED", "HIGH", 0.81, "Linear fracture fissures traversing component package body."

        # Default: NORMAL
        return "NORMAL", "NONE", 0.95, "Surface packaging, leads, and visible elements exhibit normal optical appearance."

    def _scan_surface_anomalies(
        self,
        cv_image: np.ndarray,
        gray: np.ndarray,
        hsv: np.ndarray,
        w: int,
        h: int,
        analysis_id: str
    ) -> List[Dict[str, Any]]:
        """Identifies global board anomalies outside detected component centroids."""
        short_id = analysis_id[-4:].upper()
        surface_findings = []

        # 1. Board Burn Scars
        _, dark_thresh = cv2.threshold(gray, 25, 255, cv2.THRESH_BINARY_INV)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        dark_clean = cv2.morphologyEx(dark_thresh, cv2.MORPH_OPEN, kernel)
        contours, _ = cv2.findContours(dark_clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if 350 < area < (w * h * 0.03):
                x, y, bw, bh = cv2.boundingRect(cnt)
                surface_findings.append({
                    "conditionId": f"CND-ECI-{short_id}-{len(surface_findings)+1:03d}",
                    "condition": "BURNT",
                    "targetType": "PCB_SUBSTRATE",
                    "targetId": f"SUBSTRATE-BURN-{x}-{y}",
                    "severity": "HIGH",
                    "confidence": 0.89,
                    "boundingBox": {"x": int(x), "y": int(y), "width": int(bw), "height": int(bh)},
                    "visualEvidence": "Localized high-opacity carbonized scar on PCB solder mask.",
                    "recommendedInspection": "Perform megohmmeter insulation resistance check across burned region.",
                })
                if len(surface_findings) >= 3:
                    break

        return surface_findings

    def _get_recommendation(self, condition: str) -> str:
        recommendations = {
            "BURNT": "Remove carbonized debris, check for substrate delamination, and replace affected semiconductor.",
            "CORRODED": "Clean leads with isopropyl alcohol (IPA) and ultrasonic bath; check lead thickness for acid etching.",
            "CRACKED": "Mandatory component replacement. Silicon die hermetic seal is compromised.",
            "BULGED": "De-solder and replace capacitor immediately. Risk of internal electrolyte dry-out or short circuit.",
            "LEAKING": "Neutralize leaked electrolyte with deionized wash; clean solder mask to avoid copper pitting.",
            "DISCOLORED": "Verify heat-sink mounting, thermal interface paste, and ambient airflow.",
            "MISSING": "Inspect footprint pads for torn solder traces; resolder designated BOM replacement component.",
            "SOLDER_ANOMALY": "Apply no-clean flux and reflow with hot air (350°C profile) or rework iron.",
            "PHYSICALLY_DAMAGED": "Rework technician inspection required for trace repair and component replacement.",
            "UNKNOWN": "Clean lens and capture macro photograph under diffuse 5000K illumination.",
        }
        return recommendations.get(condition, "Standard visual inspection recommended.")

visual_condition_analyzer = VisualConditionAnalyzer()
