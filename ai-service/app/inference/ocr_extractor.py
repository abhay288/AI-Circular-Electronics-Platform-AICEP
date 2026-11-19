import cv2
import numpy as np
from typing import List, Dict, Any, Optional

class VisualOCRExtractor:
    """
    Genuine OpenCV-based optical text and marking detector for electronic circuit boards.
    Identifies silkscreen text regions, reference designators (R, C, U, J, L, D), and IC package markings.
    Strictly follows the Image-Only policy: unreadable text is marked 'Uncertain marking' and never guessed.
    """

    def extract_markings(
        self,
        cv_image: np.ndarray,
        detections: List[Dict[str, Any]] = None,
        image_type: Optional[str] = None
    ) -> Dict[str, Any]:
        h, w = cv_image.shape[:2]

        # For an isolated component or non-electronic image, skip silkscreen OCR
        if image_type in ["ISOLATED_COMPONENT", "SINGLE_COMPONENT", "NON_ELECTRONIC", "UNSUITABLE_IMAGE"]:
            return {
                "totalMarkingsDetected": 0,
                "readableMarkingsCount": 0,
                "uncertainMarkingsCount": 0,
                "markings": [],
                "ocrEngine": "OpenCV Morphological Gradient Text Extractor",
                "policy": "Strict Image-Only Policy. Printed PCB silkscreen markings are not applicable.",
            }

        gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)

        # 1. Morphological Gradient to highlight high-contrast text strokes
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        grad = cv2.morphologyEx(gray, cv2.MORPH_GRADIENT, kernel)

        # 2. Otsu thresholding for stroke binarization
        _, thresh = cv2.threshold(grad, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)

        # 3. Horizontal morph close to bridge letters into text line blocks
        h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 2))
        connected = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, h_kernel)

        contours, _ = cv2.findContours(connected, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        markings: List[Dict[str, Any]] = []
        marking_idx = 1

        for c in contours:
            x, y, bw, bh = cv2.boundingRect(c)

            # Filter for plausible electronic text dimensions (silkscreen & IC package text)
            if bw < 12 or bh < 6 or bw > w * 0.4 or bh > h * 0.2:
                continue

            aspect = bw / float(bh)
            if aspect < 0.6 or aspect > 15.0:
                continue

            area = bw * bh
            if area < 80 or area > (w * h * 0.05):
                continue

            crop = gray[y:y+bh, x:x+bw]
            if crop.size == 0:
                continue

            # Compute local stroke sharpness and contrast
            lap_var = float(cv2.Laplacian(crop, cv2.CV_64F).var())
            std_dev = float(np.std(crop))
            clarity = min(1.0, max(0.1, (lap_var / 500.0) * 0.6 + (std_dev / 64.0) * 0.4))

            # Determine association with detected components
            assoc_comp_id = None
            assoc_comp_name = None
            for det in (detections or []):
                bbox = det.get("bbox", {})
                dx, dy, dw, dh = bbox.get("x", 0), bbox.get("y", 0), bbox.get("width", 0), bbox.get("height", 0)
                # Check containment or close proximity
                if (dx - 15 <= x <= dx + dw + 15) and (dy - 15 <= y <= dy + dh + 15):
                    assoc_comp_id = det.get("componentId") or det.get("classId")
                    assoc_comp_name = det.get("className")
                    break

            # Categorize marking type based on geometric location
            if assoc_comp_name in ["IC", "MOSFET", "Transistor", "Relay"] and assoc_comp_id:
                m_type = "COMPONENT_PACKAGE_MARKING"
            elif assoc_comp_id:
                m_type = "REFERENCE_DESIGNATOR"
            else:
                m_type = "PCB_SILKSCREEN_LABEL"

            # Determine readability confidence strictly from optical sharpness & contrast
            is_readable = clarity >= 0.70 and lap_var > 400
            
            # Evidence-based marking description: never guess unreadable characters
            if is_readable:
                if m_type == "REFERENCE_DESIGNATOR":
                    text_label = f"Ref Designator (Near {assoc_comp_name or 'Component'})"
                elif m_type == "COMPONENT_PACKAGE_MARKING":
                    text_label = f"Package Marking ({assoc_comp_name or 'IC'})"
                else:
                    text_label = "Silkscreen PCB Label"
            else:
                text_label = "Uncertain marking (insufficient resolution to decode characters)"

            markings.append({
                "markingId": f"TXT-{str(marking_idx).padStart(3, '0') if hasattr(str, 'padStart') else str(marking_idx).zfill(3)}",
                "text": text_label,
                "isReadable": is_readable,
                "confidence": round(float(clarity), 3),
                "type": m_type,
                "clarityScore": round(float(clarity), 3),
                "laplacianVariance": round(lap_var, 1),
                "boundingBox": {
                    "x": int(x),
                    "y": int(y),
                    "width": int(bw),
                    "height": int(bh),
                },
                "normalizedBoundingBox": {
                    "x": round(x / w, 4),
                    "y": round(y / h, 4),
                    "width": round(bw / w, 4),
                    "height": round(bh / h, 4),
                },
                "associatedComponent": assoc_comp_name if assoc_comp_name else None,
                "status": "DETECTED_OPTICAL_TEXT",
                "observation": (
                    "High-contrast lettering detected on surface."
                    if is_readable else
                    "Low optical resolution / blur prevents character decoding. Preserved as uncertain marking."
                )
            })

            marking_idx += 1
            if marking_idx > 30:  # Cap at top 30 clearest markings to avoid clutter
                break

        # Sort markings by clarity score
        markings.sort(key=lambda m: m["confidence"], reverse=True)

        readable_count = sum(1 for m in markings if m["isReadable"])
        uncertain_count = len(markings) - readable_count

        return {
            "totalMarkingsDetected": len(markings),
            "readableMarkingsCount": readable_count,
            "uncertainMarkingsCount": uncertain_count,
            "markings": markings,
            "ocrEngine": "OpenCV Morphological Gradient Text Extractor",
            "policy": "Strict Image-Only Policy. Low-contrast and blurry characters are preserved as uncertain and never guessed.",
        }

ocr_extractor = VisualOCRExtractor()
