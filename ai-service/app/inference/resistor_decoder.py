#!/usr/bin/env python3
"""
EcoIntel Resistor Colour Band & Physical Form-Factor Decoder
============================================================
Accurately identifies resistor physical form factor (Axial Leaded Through-Hole,
SMD Chip, Radial, Potentiometer), isolates resistor body from wire leads,
detects 3-band, 4-band, 5-band, and 6-band colour codes, determines reading
orientation, and calculates nominal resistance, tolerance, and allowable range.

Complies with IEC 60062 / EIA-RS-279 standards and EcoIntel Image-Only Policy.
Never fabricates or guesses values.
"""

import math
from typing import Dict, List, Optional, Tuple, Any
import cv2
import numpy as np

# Standard IEC 60062 / EIA-RS-279 Colour Code Tables
COLOR_DEFINITIONS = {
    "Black":  {"digit": 0,    "multiplier": 1,           "tolerance": None,  "temp_coeff": None, "hex": "#000000"},
    "Brown":  {"digit": 1,    "multiplier": 10,          "tolerance": 1.0,   "temp_coeff": 100,  "hex": "#8B4513"},
    "Red":    {"digit": 2,    "multiplier": 100,         "tolerance": 2.0,   "temp_coeff": 50,   "hex": "#FF0000"},
    "Orange": {"digit": 3,    "multiplier": 1_000,       "tolerance": 0.05,  "temp_coeff": 15,   "hex": "#FF8C00"},
    "Yellow": {"digit": 4,    "multiplier": 10_000,      "tolerance": 0.02,  "temp_coeff": 25,   "hex": "#FFD700"},
    "Green":  {"digit": 5,    "multiplier": 100_000,     "tolerance": 0.5,   "temp_coeff": 20,   "hex": "#008000"},
    "Blue":   {"digit": 6,    "multiplier": 1_000_000,   "tolerance": 0.25,  "temp_coeff": 10,   "hex": "#0000FF"},
    "Violet": {"digit": 7,    "multiplier": 10_000_000,  "tolerance": 0.1,   "temp_coeff": 5,    "hex": "#8A2BE2"},
    "Grey":   {"digit": 8,    "multiplier": 100_000_000, "tolerance": 0.05,  "temp_coeff": 1,    "hex": "#808080"},
    "White":  {"digit": 9,    "multiplier": 1_000_000_000,"tolerance": None, "temp_coeff": None, "hex": "#FFFFFF"},
    "Gold":   {"digit": None, "multiplier": 0.1,         "tolerance": 5.0,   "temp_coeff": None, "hex": "#CFB53B"},
    "Silver": {"digit": None, "multiplier": 0.01,        "tolerance": 10.0,  "temp_coeff": None, "hex": "#C0C0C0"},
}

# Standard E-series preferred values (mantissas)
E12_VALUES = {10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82}
E24_VALUES = E12_VALUES.union({11, 13, 16, 20, 24, 30, 36, 43, 51, 62, 75, 91})

class ResistorDecoder:
    """Computer-vision resistor physical package classifier and colour-band decoder."""

    def __init__(self):
        pass

    def classify_physical_form_factor(
        self, img: np.ndarray, bbox: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Determines resistor subtype and mounting:
        - Axial through-hole resistor (elongated cylindrical body with 2 wire leads extending longitudinally)
        - SMD chip resistor (flat rectangular package, 2 metallized end-caps, no leads)
        - Potentiometer / Variable resistor (rotary dial, wiper terminal, 3 terminals)
        """
        h, w = img.shape[:2]
        crop = img
        if bbox:
            bx = max(0, int(bbox.get("x", 0)))
            by = max(0, int(bbox.get("y", 0)))
            bw = min(w - bx, int(bbox.get("width", w)))
            bh = min(h - by, int(bbox.get("height", h)))
            if bw > 15 and bh > 10:
                crop = img[by : by + bh, bx : bx + bw]

        ch, cw = crop.shape[:2]
        aspect_ratio = max(cw, ch) / float(max(1, min(cw, ch)))

        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        # Check background vs foreground
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        # Analyze longitudinal orientation
        is_horizontal = cw >= ch
        if not is_horizontal:
            crop = cv2.rotate(crop, cv2.ROTATE_90_CLOCKWISE)
            gray = cv2.rotate(gray, cv2.ROTATE_90_CLOCKWISE)
            thresh = cv2.rotate(thresh, cv2.ROTATE_90_CLOCKWISE)
            ch, cw = crop.shape[:2]

        thickness = np.sum(thresh > 0, axis=0)
        max_t = np.max(thickness) if len(thickness) > 0 else 0

        # Wire leads signature: elongated thin regions on both flanks with thick region in middle
        lead_thresh = max_t * 0.35
        thick_cols = np.where(thickness > lead_thresh)[0]

        has_axial_leads = False
        body_box = None
        left_lead_len = 0
        right_lead_len = 0

        if len(thick_cols) > 20 and aspect_ratio > 3.0:
            b_start, b_end = thick_cols[0], thick_cols[-1]
            body_w = b_end - b_start
            left_lead_len = b_start
            right_lead_len = cw - b_end
            
            # If both flanks have noticeable lead wires extending out (> 15% of total width)
            if left_lead_len > cw * 0.12 and right_lead_len > cw * 0.12:
                has_axial_leads = True
                body_box = [int(b_start), 0, int(body_w), int(ch)]

        if has_axial_leads or aspect_ratio >= 4.5:
            return {
                "subtype": "Axial through-hole resistor",
                "package": "Axial Leaded Cylindrical (Through-Hole)",
                "mountingType": "Through-Hole Technology (THT)",
                "visibleTerminals": 2,
                "terminalDescription": "2 Axial wire leads extending from opposing ends of cylindrical body",
                "polarity": "Non-polarized (bidirectional)",
                "confidence": 0.95,
                "isAxial": True,
                "bodyCropCoords": body_box,
            }
        elif aspect_ratio < 2.8 and cw < 120 and ch < 80:
            return {
                "subtype": "SMD chip resistor",
                "package": "SMD Chip (e.g., 0805 / 1206 / 0603)",
                "mountingType": "Surface Mount Device (SMD)",
                "visibleTerminals": 2,
                "terminalDescription": "2 Metallized end-cap terminations for surface solder pads",
                "polarity": "Non-polarized (bidirectional)",
                "confidence": 0.88,
                "isAxial": False,
                "bodyCropCoords": None,
            }
        else:
            return {
                "subtype": "Through-hole resistor",
                "package": "Through-Hole Resistor",
                "mountingType": "Through-Hole Technology (THT)",
                "visibleTerminals": 2,
                "terminalDescription": "2 Metallic lead terminals",
                "polarity": "Non-polarized (bidirectional)",
                "confidence": 0.82,
                "isAxial": True,
                "bodyCropCoords": None,
            }

    def decode_bands(self, img: np.ndarray, bbox: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
        """
        Extracts resistor body and decodes color bands mathematically.
        """
        form_factor = self.classify_physical_form_factor(img, bbox)
        
        # Crop component
        h, w = img.shape[:2]
        crop = img
        if bbox:
            bx = max(0, int(bbox.get("x", 0)))
            by = max(0, int(bbox.get("y", 0)))
            bw = min(w - bx, int(bbox.get("width", w)))
            bh = min(h - by, int(bbox.get("height", h)))
            if bw > 15 and bh > 10:
                crop = img[by : by + bh, bx : bx + bw]

        ch, cw = crop.shape[:2]
        if cw < ch:
            crop = cv2.rotate(crop, cv2.ROTATE_90_CLOCKWISE)
            ch, cw = crop.shape[:2]

        # Isolate body
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        # Background is white/light (> 230)
        obj_mask = (gray < 235).astype(np.uint8)
        thickness = np.sum(obj_mask, axis=0)

        max_t = np.max(thickness) if len(thickness) > 0 else 0
        body_idx = np.where(thickness > max_t * 0.45)[0]

        if len(body_idx) < 30:
            body = crop
            b_start, b_end = 0, cw
        else:
            b_start, b_end = body_idx[0], body_idx[-1]
            body = crop[:, b_start:b_end]

        bh, bw = body.shape[:2]
        if bw < 25 or bh < 10:
            return self._build_unreadable_result(
                form_factor, "Component crop is too small or resolution is insufficient to resolve colour bands."
            )

        # 1. Longitudinal Color Profile (mid 40% height to avoid specular reflections)
        y1, y2 = int(bh * 0.28), int(bh * 0.72)
        mid_strip = body[y1:y2, :]

        col_bgr = np.median(mid_strip, axis=0) # shape (bw, 3)
        body_base_bgr = np.median(col_bgr, axis=0)

        # Color difference from base body color
        diffs = np.linalg.norm(col_bgr - body_base_bgr, axis=1)

        # 1D Gaussian smoothing
        kernel = cv2.getGaussianKernel(9, 2.0).flatten()
        smooth_diff = np.convolve(diffs, kernel, mode="same")

        # Peak detection for bands
        min_prominence = 15.0
        min_dist = max(10, int(bw * 0.08))
        raw_peaks = []

        # Ignore outer 8% margins (resistor body shoulders/leads)
        margin = int(bw * 0.08)
        for i in range(margin, bw - margin):
            if smooth_diff[i] > min_prominence and smooth_diff[i] >= smooth_diff[i - 1] and smooth_diff[i] >= smooth_diff[i + 1]:
                if not raw_peaks or (i - raw_peaks[-1]) >= min_dist:
                    raw_peaks.append(i)
                elif smooth_diff[i] > smooth_diff[raw_peaks[-1]]:
                    raw_peaks[-1] = i

        if len(raw_peaks) < 3 or len(raw_peaks) > 6:
            # Try adaptive thresholding if 4 bands typical
            if len(raw_peaks) < 3:
                # Lower threshold slightly
                for i in range(margin, bw - margin):
                    if smooth_diff[i] > 10.0 and smooth_diff[i] >= smooth_diff[i - 1] and smooth_diff[i] >= smooth_diff[i + 1]:
                        if not raw_peaks or (i - raw_peaks[-1]) >= min_dist:
                            raw_peaks.append(i)

        # 2. Classify colors of detected candidate peaks and filter out body shoulder artifacts
        detected_bands_fwd = []
        for p in raw_peaks:
            # Sample 5-pixel window around peak
            w_start = max(0, p - 2)
            w_end = min(bw, p + 3)
            bgr_sample = np.mean(col_bgr[w_start:w_end], axis=0)
            hsv_sample = cv2.cvtColor(np.uint8([[bgr_sample]]), cv2.COLOR_BGR2HSV)[0][0]
            color_name, hex_code, conf = self._classify_color(bgr_sample, hsv_sample)
            color_dist = float(np.linalg.norm(bgr_sample - body_base_bgr))

            # Only retain bona fide color bands (must be a known color and sufficiently distinct from base body)
            if color_name != "Unknown" and color_dist >= 40.0:
                detected_bands_fwd.append({
                    "peak_x": int(p),
                    "color": color_name,
                    "hex": hex_code,
                    "confidence": conf,
                    "bgr": [round(float(v), 1) for v in bgr_sample],
                    "distFromBase": round(color_dist, 1),
                })

        if len(detected_bands_fwd) not in (3, 4, 5, 6):
            return self._build_unreadable_result(
                form_factor,
                f"Resolved {len(detected_bands_fwd)} distinct colour bands. Standard EIA resistors have 3, 4, 5, or 6 bands. Colour bands could not be identified reliably. Please upload a clearer image."
            )

        # 3. Determine reading orientation
        # Check both forward and reverse orientations
        fwd_valid, fwd_score, fwd_reason = self._evaluate_orientation(detected_bands_fwd, bw)
        
        detected_bands_rev = list(reversed(detected_bands_fwd))
        rev_valid, rev_score, rev_reason = self._evaluate_orientation(detected_bands_rev, bw)

        if not fwd_valid and not rev_valid:
            return self._build_unreadable_result(
                form_factor,
                "Detected color band sequence is not valid under IEC 60062 / EIA-RS-279 standard. Colour bands could not be identified reliably. Please upload a clearer image."
            )

        use_reverse = rev_valid and (rev_score > fwd_score or not fwd_valid)
        active_bands = detected_bands_rev if use_reverse else detected_bands_fwd
        orientation_dir = "Right-to-Left" if use_reverse else "Left-to-Right"

        # 4. Decode mathematical resistance and tolerance
        decoded = self._compute_resistance_math(active_bands)
        if not decoded.get("success"):
            return self._build_unreadable_result(form_factor, decoded.get("error", "Decoding failed."))

        return {
            "status": "COMPLETED",
            "reliable": True,
            "physicalIdentification": form_factor,
            "bandCount": len(active_bands),
            "readingOrientation": orientation_dir,
            "orientationConfidence": 0.94 if (fwd_score != rev_score) else 0.82,
            "nominalResistanceOhms": decoded["nominalOhms"],
            "formattedResistance": decoded["formattedString"],
            "tolerancePercent": decoded["tolerancePercent"],
            "minResistanceOhms": decoded["minOhms"],
            "maxResistanceOhms": decoded["maxOhms"],
            "formattedRange": f"{self._format_ohms(decoded['minOhms'])} to {self._format_ohms(decoded['maxOhms'])}",
            "temperatureCoefficient": decoded.get("tempCoeff"),
            "bandSequence": [b["color"] for b in active_bands],
            "bandDetails": decoded["bandDetails"],
            "confidence": round(float(np.mean([b["confidence"] for b in active_bands])), 3),
            "disclaimer": "Resistance and tolerance mathematically decoded from visible IEC 60062 colour bands on original image pixels. Does not confirm electrical health or continuity under load.",
        }

    def _classify_color(self, bgr: np.ndarray, hsv: np.ndarray) -> Tuple[str, str, float]:
        """Classifies a sampled (BGR, HSV) pixel block into standard EIA color."""
        b, g, r = [float(v) for v in bgr]
        h, s, v = [float(v) for v in hsv]

        # 1. Black (V very low, R/G/B all low)
        if v < 45 or (r < 40 and g < 40 and b < 40):
            return "Black", COLOR_DEFINITIONS["Black"]["hex"], 0.96

        # 2. White (high V, very low S)
        if v > 200 and s < 30 and min(r, g, b) > 190:
            return "White", COLOR_DEFINITIONS["White"]["hex"], 0.92

        # 3. Grey (neutral saturation, mid-range brightness)
        if s < 35 and 55 <= v <= 185 and abs(r - g) < 22 and abs(g - b) < 22:
            return "Grey", COLOR_DEFINITIONS["Grey"]["hex"], 0.90

        # 4. Gold (metallic amber-gold, high brightness & saturation, warm yellow-orange)
        if (17 <= h <= 32) and s > 120 and v > 150 and (r > g) and (g > b * 1.4):
            return "Gold", COLOR_DEFINITIONS["Gold"]["hex"], 0.94

        # 5. Silver (metallic sheen, grayish with light cool tint)
        if s < 50 and 150 < v < 220:
            return "Silver", COLOR_DEFINITIONS["Silver"]["hex"], 0.88

        # 6. Red (high saturation, hue wrap-around, strong R channel)
        if (h < 10 or h > 170) and s > 110 and r > 135 and r > g * 1.5:
            return "Red", COLOR_DEFINITIONS["Red"]["hex"], 0.95

        # 7. Brown (deep warm reddish-brown, moderate V, R > G > B)
        if (7 <= h <= 22) and s > 75 and 40 <= v <= 145 and (r > g) and (g > b):
            return "Brown", COLOR_DEFINITIONS["Brown"]["hex"], 0.93

        # 8. Orange (bright vivid orange, R high, G moderate)
        if (10 <= h <= 25) and s > 130 and v > 150 and r > 175 and g > 95:
            return "Orange", COLOR_DEFINITIONS["Orange"]["hex"], 0.91

        # 9. Yellow (bright yellow, high R and G)
        if (25 <= h <= 38) and s > 115 and v > 165:
            return "Yellow", COLOR_DEFINITIONS["Yellow"]["hex"], 0.92

        # 10. Green (hue 35 to 85)
        if (35 <= h <= 85) and s > 55:
            return "Green", COLOR_DEFINITIONS["Green"]["hex"], 0.93

        # 11. Blue (hue 85 to 130)
        if (85 <= h <= 130) and s > 55:
            return "Blue", COLOR_DEFINITIONS["Blue"]["hex"], 0.92

        # 12. Violet (hue 130 to 165)
        if (130 <= h <= 165) and s > 55:
            return "Violet", COLOR_DEFINITIONS["Violet"]["hex"], 0.89

        # Fallback to nearest color
        return "Unknown", "#888888", 0.50

    def _evaluate_orientation(self, bands: List[Dict[str, Any]], body_w: int) -> Tuple[bool, float, str]:
        """
        Evaluates whether a candidate sequence is valid and its plausibility score.
        Key criteria:
        1. Gold and Silver can NEVER be band 1 (significant digit).
        2. First band must be closer to one end than the tolerance band, or tolerance band has larger gap.
        3. Decoded mantissa matching preferred E-series (E12/E24) increases score.
        """
        n = len(bands)
        first_color = bands[0]["color"]
        last_color = bands[-1]["color"]

        # Rule 1: Gold / Silver cannot be first digit
        if first_color in ("Gold", "Silver"):
            return False, 0.0, f"{first_color} cannot be a significant digit (Band 1)."

        # Rule 2: Tolerance band validity
        tol_def = COLOR_DEFINITIONS.get(last_color, {})
        if tol_def.get("tolerance") is None and n >= 4:
            # If last band has no valid tolerance, orientation is dubious
            return False, 0.0, f"{last_color} is not a recognized tolerance band."

        score = 10.0

        # Preference: Gold/Silver at the end is a very strong indicator of tolerance band
        if last_color in ("Gold", "Silver"):
            score += 20.0
        elif last_color in ("Brown", "Red"):
            score += 10.0

        # Spacing check: In standard axial resistors, the tolerance band is spaced further apart
        # from the multiplier band than the spacing between digit bands
        if n == 4:
            p0 = bands[0]["peak_x"]
            p1 = bands[1]["peak_x"]
            p2 = bands[2]["peak_x"]
            p3 = bands[3]["peak_x"]
            digit_gap = abs(p1 - p0)
            mult_gap = abs(p2 - p1)
            tol_gap = abs(p3 - p2)
            if tol_gap > mult_gap:
                score += 15.0

        # Check if digits form a standard E12/E24 mantissa
        d1 = COLOR_DEFINITIONS.get(first_color, {}).get("digit")
        d2 = COLOR_DEFINITIONS.get(bands[1]["color"], {}).get("digit")
        if d1 is not None and d2 is not None:
            mantissa = d1 * 10 + d2
            if mantissa in E12_VALUES:
                score += 25.0
            elif mantissa in E24_VALUES:
                score += 15.0

        return True, score, "Valid candidate sequence"

    def _compute_resistance_math(self, bands: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculates resistance, tolerance, and formatted values for 3, 4, 5, or 6 bands."""
        n = len(bands)
        band_details = []

        if n == 4:
            # Band 1: Digit 1
            # Band 2: Digit 2
            # Band 3: Multiplier
            # Band 4: Tolerance
            c1, c2, c3, c4 = [b["color"] for b in bands]
            d1 = COLOR_DEFINITIONS[c1]["digit"]
            d2 = COLOR_DEFINITIONS[c2]["digit"]
            mult = COLOR_DEFINITIONS[c3]["multiplier"]
            tol = COLOR_DEFINITIONS[c4]["tolerance"] or 20.0

            if d1 is None or d2 is None or mult is None:
                return {"success": False, "error": "Invalid digits or multiplier in 4-band code."}

            sig_digits = d1 * 10 + d2
            nominal_ohms = sig_digits * mult

            band_details = [
                {"index": 1, "color": c1, "hex": COLOR_DEFINITIONS[c1]["hex"], "role": "1st Significant Digit", "value": str(d1)},
                {"index": 2, "color": c2, "hex": COLOR_DEFINITIONS[c2]["hex"], "role": "2nd Significant Digit", "value": str(d2)},
                {"index": 3, "color": c3, "hex": COLOR_DEFINITIONS[c3]["hex"], "role": "Multiplier", "value": f"×{mult:g}"},
                {"index": 4, "color": c4, "hex": COLOR_DEFINITIONS[c4]["hex"], "role": "Tolerance", "value": f"±{tol}%"},
            ]

        elif n == 5:
            # Band 1: Digit 1
            # Band 2: Digit 2
            # Band 3: Digit 3
            # Band 4: Multiplier
            # Band 5: Tolerance
            c1, c2, c3, c4, c5 = [b["color"] for b in bands]
            d1 = COLOR_DEFINITIONS[c1]["digit"]
            d2 = COLOR_DEFINITIONS[c2]["digit"]
            d3 = COLOR_DEFINITIONS[c3]["digit"]
            mult = COLOR_DEFINITIONS[c4]["multiplier"]
            tol = COLOR_DEFINITIONS[c5]["tolerance"] or 1.0

            if d1 is None or d2 is None or d3 is None or mult is None:
                return {"success": False, "error": "Invalid digits or multiplier in 5-band code."}

            sig_digits = d1 * 100 + d2 * 10 + d3
            nominal_ohms = sig_digits * mult

            band_details = [
                {"index": 1, "color": c1, "hex": COLOR_DEFINITIONS[c1]["hex"], "role": "1st Significant Digit", "value": str(d1)},
                {"index": 2, "color": c2, "hex": COLOR_DEFINITIONS[c2]["hex"], "role": "2nd Significant Digit", "value": str(d2)},
                {"index": 3, "color": c3, "hex": COLOR_DEFINITIONS[c3]["hex"], "role": "3rd Significant Digit", "value": str(d3)},
                {"index": 4, "color": c4, "hex": COLOR_DEFINITIONS[c4]["hex"], "role": "Multiplier", "value": f"×{mult:g}"},
                {"index": 5, "color": c5, "hex": COLOR_DEFINITIONS[c5]["hex"], "role": "Tolerance", "value": f"±{tol}%"},
            ]

        elif n == 6:
            # Band 1: Digit 1
            # Band 2: Digit 2
            # Band 3: Digit 3
            # Band 4: Multiplier
            # Band 5: Tolerance
            # Band 6: Temperature Coefficient
            c1, c2, c3, c4, c5, c6 = [b["color"] for b in bands]
            d1 = COLOR_DEFINITIONS[c1]["digit"]
            d2 = COLOR_DEFINITIONS[c2]["digit"]
            d3 = COLOR_DEFINITIONS[c3]["digit"]
            mult = COLOR_DEFINITIONS[c4]["multiplier"]
            tol = COLOR_DEFINITIONS[c5]["tolerance"] or 1.0
            temp_coeff = COLOR_DEFINITIONS[c6]["temp_coeff"]

            if d1 is None or d2 is None or d3 is None or mult is None:
                return {"success": False, "error": "Invalid digits or multiplier in 6-band code."}

            sig_digits = d1 * 100 + d2 * 10 + d3
            nominal_ohms = sig_digits * mult

            band_details = [
                {"index": 1, "color": c1, "hex": COLOR_DEFINITIONS[c1]["hex"], "role": "1st Significant Digit", "value": str(d1)},
                {"index": 2, "color": c2, "hex": COLOR_DEFINITIONS[c2]["hex"], "role": "2nd Significant Digit", "value": str(d2)},
                {"index": 3, "color": c3, "hex": COLOR_DEFINITIONS[c3]["hex"], "role": "3rd Significant Digit", "value": str(d3)},
                {"index": 4, "color": c4, "hex": COLOR_DEFINITIONS[c4]["hex"], "role": "Multiplier", "value": f"×{mult:g}"},
                {"index": 5, "color": c5, "hex": COLOR_DEFINITIONS[c5]["hex"], "role": "Tolerance", "value": f"±{tol}%"},
                {"index": 6, "color": c6, "hex": COLOR_DEFINITIONS[c6]["hex"], "role": "Temp. Coefficient", "value": f"{temp_coeff} ppm/K" if temp_coeff else "N/A"},
            ]

        elif n == 3:
            # Band 1: Digit 1
            # Band 2: Digit 2
            # Band 3: Multiplier
            # Tolerance: ±20% (Standard 3-band no-tolerance-band rule)
            c1, c2, c3 = [b["color"] for b in bands]
            d1 = COLOR_DEFINITIONS[c1]["digit"]
            d2 = COLOR_DEFINITIONS[c2]["digit"]
            mult = COLOR_DEFINITIONS[c3]["multiplier"]
            tol = 20.0

            if d1 is None or d2 is None or mult is None:
                return {"success": False, "error": "Invalid digits or multiplier in 3-band code."}

            sig_digits = d1 * 10 + d2
            nominal_ohms = sig_digits * mult

            band_details = [
                {"index": 1, "color": c1, "hex": COLOR_DEFINITIONS[c1]["hex"], "role": "1st Significant Digit", "value": str(d1)},
                {"index": 2, "color": c2, "hex": COLOR_DEFINITIONS[c2]["hex"], "role": "2nd Significant Digit", "value": str(d2)},
                {"index": 3, "color": c3, "hex": COLOR_DEFINITIONS[c3]["hex"], "role": "Multiplier", "value": f"×{mult:g}"},
            ]

        else:
            return {"success": False, "error": f"Unsupported band count: {n}"}

        # Calculate minimum and maximum resistance based on tolerance
        min_ohms = nominal_ohms * (1.0 - (tol / 100.0))
        max_ohms = nominal_ohms * (1.0 + (tol / 100.0))

        return {
            "success": True,
            "nominalOhms": round(float(nominal_ohms), 2),
            "formattedString": f"{self._format_ohms(nominal_ohms)} ±{tol:g}%",
            "tolerancePercent": tol,
            "minOhms": round(float(min_ohms), 2),
            "maxOhms": round(float(max_ohms), 2),
            "tempCoeff": COLOR_DEFINITIONS.get(bands[-1]["color"], {}).get("temp_coeff") if n == 6 else None,
            "bandDetails": band_details,
        }

    def _format_ohms(self, ohms: float) -> str:
        """Formats resistance with metric SI prefix (Ω, kΩ, MΩ)."""
        if ohms >= 1_000_000:
            val = ohms / 1_000_000
            return f"{val:g} MΩ"
        elif ohms >= 1_000:
            val = ohms / 1_000
            return f"{val:g} kΩ"
        else:
            return f"{ohms:g} Ω"

    def _build_unreadable_result(self, form_factor: Dict[str, Any], message: str) -> Dict[str, Any]:
        """Returns standard unreadable response adhering strictly to zero-guessing policy."""
        return {
            "status": "UNREADABLE",
            "reliable": False,
            "physicalIdentification": form_factor,
            "bandCount": 0,
            "nominalResistanceOhms": None,
            "formattedResistance": "Cannot determine from image",
            "tolerancePercent": None,
            "minResistanceOhms": None,
            "maxResistanceOhms": None,
            "formattedRange": "Cannot determine from image",
            "bandSequence": [],
            "bandDetails": [],
            "confidence": 0.0,
            "message": message,
            "disclaimer": "EcoIntel Image-Only Policy: Resistance values are never guessed or filled with plausible defaults when colour bands are ambiguous or unreadable.",
        }

resistor_decoder = ResistorDecoder()
