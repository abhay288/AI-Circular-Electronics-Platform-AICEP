"""
EcoIntel Image Relevance & Domain Safety Classifier
===================================================
Mandatory first-stage gatekeeper for the EcoIntel AI inspection system.
Classifies input images into:
  - ELECTRONICS_RELATED: Circuit boards, motherboards, discrete components, electronic devices.
  - NON_ELECTRONIC: Food, human portraits, animals, landscapes, plants, vehicles, documents, household items.
  - MIXED_SCENE: Hardware held in hand or placed on desk with visible human/environment.
  - UNKNOWN: Ambiguous scene without clear electronic or out-of-domain evidence.
  - UNSUITABLE_IMAGE: Blurry, overexposed, blank, or corrupted.

Adheres strictly to the Image-Only Policy:
  - Zero fabricated measurements.
  - Calibrated rejection thresholds.
  - Full domain exclusion for non-electronic images.
"""

import os
import sys
import cv2
import numpy as np
from typing import Dict, Any, List, Tuple, Optional

# Set ultralytics cache dir to temp to avoid permission issues
import tempfile
os.environ["YOLO_CONFIG_DIR"] = os.path.join(tempfile.gettempdir(), "ecointel_yolo_cfg")
os.environ["YOLO_VERBOSE"] = "False"

class ImageRelevanceClassifier:
    """
    Multi-signal relevance classifier combining deep object detection,
    color-space segmentation, texture-frequency analysis, and skin detection.
    """

    def __init__(self):
        self.coco_model = None
        self.electronics_model = None
        self._load_models()

    def _load_models(self):
        """Loads both COCO detector (for out-of-domain rejection) and custom electronics detector."""
        try:
            from ultralytics import YOLO
            curr_dir = os.path.dirname(os.path.abspath(__file__))
            candidates_dir = [
                os.path.abspath(os.path.join(curr_dir, "..", "..", "..")),  # project root (4 levels)
                os.path.abspath(os.path.join(curr_dir, "..", "..")),        # ai-service (3 levels)
                os.getcwd(),
            ]

            # 1. COCO general detector (for out-of-domain rejection: people, animals, vehicles, food, furniture)
            coco_candidates = []
            for d in candidates_dir:
                coco_candidates.append(os.path.join(d, "yolo11n.pt"))
                coco_candidates.append(os.path.join(d, "ai-service", "yolo11n.pt"))
            coco_candidates.append("yolo11n.pt")

            for m in coco_candidates:
                if os.path.exists(m):
                    try:
                        self.coco_model = YOLO(m)
                        break
                    except Exception:
                        continue

            # 2. Electronics fine-tuned detector
            candidate_weights = []
            for d in candidates_dir:
                candidate_weights.append(os.path.join(d, "ai-service", "models", "weights", "best.pt"))
                candidate_weights.append(os.path.join(d, "models", "weights", "best.pt"))
                candidate_weights.append(os.path.join(d, "runs", "detect", "runs", "detect", "ecointel-unified-yolo", "weights", "best.pt"))
                candidate_weights.append(os.path.join(d, "runs", "detect", "ecointel-unified-yolo", "weights", "best.pt"))
                candidate_weights.append(os.path.join(d, "runs", "detect", "runs", "detect", "ecointel-pcb-yolo", "weights", "best.pt"))
                candidate_weights.append(os.path.join(d, "runs", "detect", "ecointel-pcb-yolo", "weights", "best.pt"))

            for w in candidate_weights:
                if os.path.exists(w):
                    try:
                        self.electronics_model = YOLO(w)
                        break
                    except Exception:
                        continue
        except Exception as e:
            print(f"[RelevanceClassifier] Warning: Could not initialize models: {e}", file=sys.stderr)

    def classify_relevance(self, cv_img: np.ndarray) -> Dict[str, Any]:
        """
        Executes comprehensive multi-signal relevance validation on the input image.
        """
        if cv_img is None or cv_img.size == 0:
            return {
                "relevance": "UNSUITABLE_IMAGE",
                "confidence": 1.0,
                "category": "INVALID_IMAGE",
                "isElectronic": False,
                "reason": "Image data is empty, null, or corrupted.",
                "rejectionRecommendation": True,
                "rejectionMessage": "Image data is empty or unreadable.",
            }

        h, w = cv_img.shape[:2]
        if h < 100 or w < 100:
            return {
                "relevance": "UNSUITABLE_IMAGE",
                "confidence": 0.98,
                "category": "INSUFFICIENT_RESOLUTION",
                "isElectronic": False,
                "reason": f"Resolution ({w}x{h} px) is below minimum optical inspection threshold (100x100 px).",
                "rejectionRecommendation": True,
                "rejectionMessage": "Image resolution is too low for optical inspection.",
            }

        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(cv_img, cv2.COLOR_BGR2HSV)
        rgb = cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB)

        # -------------------------------------------------------------
        # 1. Quality & Blank / Solid Color Check
        # -------------------------------------------------------------
        contrast_std = float(np.std(gray))
        mean_brightness = float(np.mean(gray))

        if contrast_std < 5.0 and (mean_brightness > 248 or mean_brightness < 8):
            return {
                "relevance": "UNSUITABLE_IMAGE",
                "confidence": 0.99,
                "category": "BLANK_SOLID_IMAGE",
                "isElectronic": False,
                "reason": "Image is nearly blank or completely solid with zero contrast.",
                "rejectionRecommendation": True,
                "rejectionMessage": "Image does not contain observable visual features.",
            }

        # -------------------------------------------------------------
        # 2. General COCO Object Detection (Out-of-Domain Detection)
        # -------------------------------------------------------------
        coco_detections = self._run_coco_detection(rgb, w, h)
        out_of_domain_objects = coco_detections.get("outOfDomain", [])
        people_objects = coco_detections.get("people", [])
        consumer_electronics = coco_detections.get("consumerElectronics", [])

        # -------------------------------------------------------------
        # 3. Fine-Tuned Electronics Component Inference Check
        # -------------------------------------------------------------
        electronics_detections = self._run_electronics_detection(rgb)
        has_genuine_electronic_components = len(electronics_detections) > 0

        # -------------------------------------------------------------
        # 4. Domain Spectral, Geometric & Structural Analysis
        # -------------------------------------------------------------
        # A. Solder Mask Spectrum & Via/Pad Verification
        pcb_color_ratio, dominant_solder_mask, via_count, pad_count = self._evaluate_pcb_substrate_evidence(
            cv_img, gray, hsv, w, h
        )

        # B. Edge & Orthogonal Trace Density (high in PCBs and electronic leads)
        edge_density, orthogonal_line_score, trace_count = self._evaluate_pcb_texture(gray, w, h)

        # C. Skin Tone Detection (Human Hands / Faces)
        skin_mask, skin_ratio = self._detect_skin_regions(cv_img, w, h)

        # D. Document / Text Sheet Detection
        is_document, doc_score = self._evaluate_document_profile(gray, w, h)

        # E. Food / Organic Color Statistics
        food_organic_score = self._evaluate_organic_color_profile(hsv, cv_img, w, h)

        # F. Landscape / Sky / Nature Analysis
        landscape_score = self._evaluate_landscape_profile(hsv, cv_img, w, h)

        # G. Isolated Electronic Component Geometry (Metallic leads, color bands, IC pins)
        has_coco_out_of_domain = any(o.get("confidence", 0) >= 0.45 for o in out_of_domain_objects)
        has_yolo_ic = any(d.get("classId") == 0 and d.get("confidence", 0) >= 0.50 for d in electronics_detections)
        is_studio_bg, is_discrete_comp, comp_subtype, isolated_features = self._verify_isolated_component(
            cv_img, gray, hsv, w, h, has_genuine_electronic_components, has_coco_out_of_domain, has_yolo_ic
        )

        # -------------------------------------------------------------
        # 5. Synthesize Evidence Signals
        # -------------------------------------------------------------
        # A genuine PCB MUST have copper traces or via holes or solder pads or mounted components!
        # Mere red or green color without traces or vias (like pizza sauce or lawn) is NOT a PCB!
        has_verified_pcb_substrate = (
            (via_count >= 15 and pad_count >= 10 and trace_count >= 20) or
            (pcb_color_ratio > 0.06 and edge_density > 0.028 and (via_count >= 2 or pad_count >= 3 or trace_count >= 15) and trace_count >= 8) or
            (edge_density > 0.040 and trace_count >= 15 and (via_count >= 2 or pad_count >= 2)) or
            (has_genuine_electronic_components and edge_density > 0.025 and (via_count >= 2 or pad_count >= 2 or trace_count >= 5))
        )

        has_human_presence = len(people_objects) > 0 or skin_ratio > 0.05

        # --- CASE A: Confident Food Detection ---
        EDIBLE_FOOD_LABELS = {
            "banana", "apple", "sandwich", "orange", "broccoli", "carrot",
            "hot dog", "pizza", "donut", "cake"
        }
        TABLEWARE_LABELS = {"bowl", "fork", "knife", "spoon", "plate", "dining table"}

        edible_food_items = [obj for obj in out_of_domain_objects if obj["label"] in EDIBLE_FOOD_LABELS and obj["confidence"] >= 0.20]
        tableware_items = [obj for obj in out_of_domain_objects if obj["label"] in TABLEWARE_LABELS and obj["confidence"] >= 0.20]
        other_food_items = [obj for obj in out_of_domain_objects if obj["category"] == "FOOD_BEVERAGE" and obj["confidence"] >= 0.40]

        is_confirmed_meal = (
            len(edible_food_items) > 0 or
            len(tableware_items) >= 2 or
            (len(tableware_items) == 1 and tableware_items[0]["confidence"] >= 0.35 and not has_verified_pcb_substrate) or
            (len(other_food_items) > 0 and not has_verified_pcb_substrate) or
            (food_organic_score > 0.60 and not is_discrete_comp and not has_verified_pcb_substrate)
        )

        if is_confirmed_meal:
            detected_food = (edible_food_items + tableware_items + other_food_items)
            food_name = detected_food[0]["label"] if detected_food else "food/organic dish"
            return {
                "relevance": "NON_ELECTRONIC",
                "confidence": round(max(0.92, detected_food[0]["confidence"] if detected_food else 0.90), 3),
                "category": "FOOD_BEVERAGE",
                "isElectronic": False,
                "hasHumanPresence": has_human_presence,
                "reason": f"Image identifies {food_name} without electronic circuitry or components.",
                "rejectionRecommendation": True,
                "rejectionMessage": "This image does not appear to contain electronic hardware or electronic components. Please upload a clear photograph of a PCB, motherboard, electronic device, or individual electronic component.",
                "signals": {
                    "foodOrganicScore": round(food_organic_score, 3),
                    "pcbColorRatio": round(pcb_color_ratio, 3),
                    "viaCount": via_count,
                    "foodItems": [f["label"] for f in detected_food[:5]],
                },
            }

        # --- CASE B: Confident Animal Detection ---
        animal_items = [obj for obj in out_of_domain_objects if obj["category"] == "ANIMAL" and obj["confidence"] >= 0.35]
        if len(animal_items) > 0 or (self._is_animal_profile(cv_img, gray, w, h) and not is_discrete_comp and not has_verified_pcb_substrate):
            return {
                "relevance": "NON_ELECTRONIC",
                "confidence": round(animal_items[0]["confidence"] if animal_items else 0.92, 3),
                "category": "ANIMAL",
                "isElectronic": False,
                "hasHumanPresence": False,
                "reason": f"Image identifies an animal with no electronic hardware present.",
                "rejectionRecommendation": True,
                "rejectionMessage": "This image does not appear to contain electronic hardware or electronic components. Please upload a clear photograph of a PCB, motherboard, electronic device, or individual electronic component.",
            }

        # --- CASE C: Confident Vehicle Detection ---
        vehicle_items = [obj for obj in out_of_domain_objects if obj["category"] == "VEHICLE" and obj["confidence"] >= 0.40]
        if (len(vehicle_items) > 0 and not is_discrete_comp and not has_verified_pcb_substrate) or (self._is_vehicle_profile(cv_img, gray, w, h) and not is_discrete_comp and not has_verified_pcb_substrate):
            return {
                "relevance": "NON_ELECTRONIC",
                "confidence": round(vehicle_items[0]["confidence"] if vehicle_items else 0.93, 3),
                "category": "VEHICLE",
                "isElectronic": False,
                "hasHumanPresence": has_human_presence,
                "reason": f"Image identifies a vehicle rather than an electronic circuit assembly.",
                "rejectionRecommendation": True,
                "rejectionMessage": "This image does not appear to contain electronic hardware or electronic components. Please upload a clear photograph of a PCB, motherboard, electronic device, or individual electronic component.",
            }

        # --- CASE D: Confident Landscape / Scenery / Nature ---
        if landscape_score > 0.70 and not has_verified_pcb_substrate and not is_discrete_comp and not has_genuine_electronic_components:
            return {
                "relevance": "NON_ELECTRONIC",
                "confidence": 0.95,
                "category": "LANDSCAPE_NATURE",
                "isElectronic": False,
                "hasHumanPresence": False,
                "reason": "Image contains outdoor scenery, natural vegetation, or landscape horizons without electronic hardware.",
                "rejectionRecommendation": True,
                "rejectionMessage": "This image does not appear to contain electronic hardware or electronic components. Please upload a clear photograph of a PCB, motherboard, electronic device, or individual electronic component.",
                "signals": {"landscapeScore": round(landscape_score, 3)},
            }

        # --- CASE E: Document / Paper Text Sheet ---
        if is_document and not has_verified_pcb_substrate and not is_discrete_comp and not has_genuine_electronic_components:
            return {
                "relevance": "NON_ELECTRONIC",
                "confidence": 0.94,
                "category": "DOCUMENT",
                "isElectronic": False,
                "hasHumanPresence": has_human_presence,
                "reason": "Image depicts a printed document or text sheet with zero electronic circuitry or components.",
                "rejectionRecommendation": True,
                "rejectionMessage": "This image does not appear to contain electronic hardware or electronic components. Please upload a clear photograph of a PCB, motherboard, electronic device, or individual electronic component.",
                "signals": {"docScore": round(doc_score, 3)},
            }

        # --- CASE F: Human Portrait / People with NO verified electronics ---
        if has_human_presence and not has_verified_pcb_substrate and not is_discrete_comp:
            return {
                "relevance": "NON_ELECTRONIC",
                "confidence": 0.94,
                "category": "HUMAN_PORTRAIT",
                "isElectronic": False,
                "hasHumanPresence": True,
                "reason": "Image contains a person, face, or portrait with no observable electronic hardware or circuit board.",
                "rejectionRecommendation": True,
                "rejectionMessage": "This image does not appear to contain electronic hardware or electronic components. Please upload a clear photograph of a PCB, motherboard, electronic device, or individual electronic component.",
                "signals": {"skinRatio": round(skin_ratio, 3)},
            }

        # --- CASE G: General Household Objects / Furniture with NO electronics ---
        household_items = [obj for obj in out_of_domain_objects if obj["category"] in ["FURNITURE", "CLOTHING"] and obj["confidence"] >= 0.35]
        if ((len(household_items) > 0 and not has_verified_pcb_substrate and not is_discrete_comp) or
            (self._is_furniture_profile(cv_img, gray, w, h) and not has_verified_pcb_substrate and not is_discrete_comp)):
            return {
                "relevance": "NON_ELECTRONIC",
                "confidence": round(household_items[0]["confidence"] if household_items else 0.91, 3),
                "category": "HOUSEHOLD_OBJECT",
                "isElectronic": False,
                "hasHumanPresence": has_human_presence,
                "reason": "Image identifies general household furniture or non-electronic objects.",
                "rejectionRecommendation": True,
                "rejectionMessage": "This image does not appear to contain electronic hardware or electronic components. Please upload a clear photograph of a PCB, motherboard, electronic device, or individual electronic component.",
            }

        # --- CASE H: MIXED_SCENE (Human Hand / Person holding PCB or Workbench) ---
        if has_human_presence and has_verified_pcb_substrate:
            electronic_regions = self._localize_electronic_region(cv_img, skin_mask, w, h)
            return {
                "relevance": "MIXED_SCENE",
                "confidence": 0.93,
                "category": "MIXED_HARDWARE_HUMAN",
                "isElectronic": True,
                "hasHumanPresence": True,
                "dominantSolderMask": dominant_solder_mask,
                "reason": "Image depicts a mixed scene: a person/hand interacting with electronic hardware. Analysis will be constrained strictly to the verified electronic board region.",
                "rejectionRecommendation": False,
                "electronicRegions": electronic_regions,
                "signals": {
                    "skinRatio": round(skin_ratio, 3),
                    "pcbColorRatio": round(pcb_color_ratio, 3),
                    "viaCount": via_count,
                },
            }

        # --- CASE I: Confirmed ELECTRONICS_RELATED (PCB or Motherboard) ---
        if has_verified_pcb_substrate:
            return {
                "relevance": "ELECTRONICS_RELATED",
                "confidence": 0.96,
                "category": "PCB_HARDWARE",
                "isElectronic": True,
                "hasHumanPresence": False,
                "dominantSolderMask": dominant_solder_mask,
                "reason": f"Confirmed electronic circuit hardware: identified {dominant_solder_mask} solder mask substrate with traces and component mounting pads.",
                "rejectionRecommendation": False,
                "signals": {
                    "pcbColorRatio": round(pcb_color_ratio, 3),
                    "edgeDensity": round(edge_density, 4),
                    "viaCount": via_count,
                    "padCount": pad_count,
                },
            }

        # --- CASE J: Confirmed ELECTRONICS_RELATED (Discrete Component on Neutral Background) ---
        if is_discrete_comp:
            return {
                "relevance": "ELECTRONICS_RELATED",
                "confidence": 0.94,
                "category": "DISCRETE_COMPONENT",
                "subtype": comp_subtype,
                "isElectronic": True,
                "hasHumanPresence": False,
                "reason": f"Confirmed individual electronic component ({comp_subtype}) on plain background. Characteristic leads/pins/markings verified.",
                "rejectionRecommendation": False,
                "signals": isolated_features,
            }

        # --- CASE K: Assembled Electronic Device / Enclosure ---
        if len(consumer_electronics) > 0 and consumer_electronics[0]["confidence"] > 0.50:
            return {
                "relevance": "ELECTRONICS_RELATED",
                "confidence": round(consumer_electronics[0]["confidence"], 3),
                "category": "ELECTRONIC_DEVICE",
                "isElectronic": True,
                "hasHumanPresence": has_human_presence,
                "reason": f"Identified electronic device assembly/enclosure ({consumer_electronics[0]['label']}).",
                "rejectionRecommendation": False,
                "signals": {"deviceClass": consumer_electronics[0]["label"]},
            }

        # --- CASE L: Fallback Guardrail (Non-Electronic Catch-All) ---
        # If an image has NO verified PCB substrate, NO verified discrete component,
        # NO electronic device features, and NO detected electronic components:
        # IT CANNOT BE ACCEPTED AS ELECTRONICS!
        return {
            "relevance": "NON_ELECTRONIC",
            "confidence": 0.88,
            "category": "NON_ELECTRONIC_SCENE",
            "isElectronic": False,
            "hasHumanPresence": has_human_presence,
            "reason": "Image does not exhibit verified electronic circuit traces, solder pads, component pins, or electronic markings.",
            "rejectionRecommendation": True,
            "rejectionMessage": "This image does not appear to contain electronic hardware or electronic components. Please upload a clear photograph of a PCB, motherboard, electronic device, or individual electronic component.",
            "signals": {
                "pcbColorRatio": round(pcb_color_ratio, 3),
                "viaCount": via_count,
                "edgeDensity": round(edge_density, 4),
            },
        }

    # -----------------------------------------------------------------
    # Helper Signal Extraction & Geometric Validation Methods
    # -----------------------------------------------------------------
    def _run_coco_detection(self, rgb_img: np.ndarray, w: int, h: int) -> Dict[str, List[Dict[str, Any]]]:
        """Runs pretrained YOLO to detect common real-world objects."""
        res: Dict[str, List[Dict[str, Any]]] = {
            "outOfDomain": [],
            "people": [],
            "consumerElectronics": [],
        }
        if self.coco_model is None:
            return res

        try:
            results = self.coco_model.predict(
                rgb_img,
                conf=0.18,
                iou=0.45,
                verbose=False,
                imgsz=640,
            )

            FOOD_LABELS = {
                "banana", "apple", "sandwich", "orange", "broccoli", "carrot",
                "hot dog", "pizza", "donut", "cake", "bottle", "wine glass",
                "cup", "fork", "knife", "spoon", "bowl"
            }
            ANIMAL_LABELS = {
                "bird", "cat", "dog", "horse", "sheep", "cow", "elephant",
                "bear", "zebra", "giraffe"
            }
            VEHICLE_LABELS = {
                "bicycle", "car", "motorcycle", "airplane", "bus", "train",
                "truck", "boat"
            }
            FURNITURE_LABELS = {"chair", "couch", "bed", "toilet"}
            CLOTHING_LABELS = {"backpack", "umbrella", "handbag", "tie", "suitcase"}
            ELECTRONIC_DEVICE_LABELS = {
                "tv", "laptop", "mouse", "remote", "keyboard", "cell phone",
                "microwave", "oven", "toaster", "clock"
            }

            for r in results:
                for b in r.boxes:
                    cls_id = int(b.cls[0])
                    conf = float(b.conf[0])
                    name = self.coco_model.names.get(cls_id, "").lower()
                    x1, y1, x2, y2 = b.xyxy[0].tolist()
                    box_area = (x2 - x1) * (y2 - y1)
                    area_ratio = box_area / max(1.0, float(w * h))

                    item = {
                        "label": name,
                        "classId": cls_id,
                        "confidence": round(conf, 3),
                        "bbox": {"x": int(x1), "y": int(y1), "width": int(x2 - x1), "height": int(y2 - y1)},
                        "areaRatio": round(area_ratio, 4),
                    }

                    if name == "person":
                        res["people"].append(item)
                    elif name in FOOD_LABELS:
                        item["category"] = "FOOD_BEVERAGE"
                        res["outOfDomain"].append(item)
                    elif name == "dining table":
                        item["category"] = "FOOD_BEVERAGE"
                        res["outOfDomain"].append(item)
                    elif name in ANIMAL_LABELS:
                        item["category"] = "ANIMAL"
                        res["outOfDomain"].append(item)
                    elif name in VEHICLE_LABELS:
                        item["category"] = "VEHICLE"
                        res["outOfDomain"].append(item)
                    elif name in FURNITURE_LABELS:
                        item["category"] = "FURNITURE"
                        res["outOfDomain"].append(item)
                    elif name in CLOTHING_LABELS:
                        item["category"] = "CLOTHING"
                        res["outOfDomain"].append(item)
                    elif name in ELECTRONIC_DEVICE_LABELS:
                        res["consumerElectronics"].append(item)

        except Exception as err:
            print(f"[RelevanceClassifier] COCO inference error: {err}", file=sys.stderr)

        return res

    def _run_electronics_detection(self, rgb_img: np.ndarray) -> List[Dict[str, Any]]:
        """Runs custom fine-tuned electronics model to detect authentic electronic components."""
        detections = []
        if self.electronics_model is None:
            return detections
        try:
            results = self.electronics_model.predict(
                rgb_img,
                conf=0.25,
                iou=0.45,
                verbose=False,
                imgsz=640,
            )
            for r in results:
                for b in r.boxes:
                    conf = float(b.conf[0])
                    cls_idx = int(b.cls[0])
                    detections.append({"classId": cls_idx, "confidence": conf})
        except Exception:
            pass
        return detections

    def _evaluate_pcb_substrate_evidence(
        self, cv_img: np.ndarray, gray: np.ndarray, hsv: np.ndarray, w: int, h: int
    ) -> Tuple[float, str, int, int]:
        """
        Evaluates physical PCB substrate evidence: solder mask color + circular via holes + solder pads.
        """
        total_pixels = float(w * h)

        # Standard Green Solder Mask (Hue 35-85)
        green_mask = cv2.inRange(hsv, np.array([35, 45, 30]), np.array([85, 255, 220]))
        green_count = np.count_nonzero(green_mask)

        # Blue Solder Mask (Hue 95-130)
        blue_mask = cv2.inRange(hsv, np.array([95, 60, 30]), np.array([130, 255, 220]))
        blue_count = np.count_nonzero(blue_mask)

        # Red Solder Mask (Hue 0-10 or 170-180)
        red_mask1 = cv2.inRange(hsv, np.array([0, 80, 40]), np.array([10, 255, 220]))
        red_mask2 = cv2.inRange(hsv, np.array([170, 80, 40]), np.array([180, 255, 220]))
        red_mask = cv2.bitwise_or(red_mask1, red_mask2)
        red_count = np.count_nonzero(red_mask)

        # Matte Black Solder Mask (dark, low sat)
        black_mask = cv2.inRange(hsv, np.array([0, 0, 15]), np.array([180, 45, 65]))
        black_count = np.count_nonzero(black_mask)

        counts = {
            "green": green_count,
            "blue": blue_count,
            "red": red_count,
            "black": black_count,
        }
        dominant_color = max(counts, key=counts.get)

        # Solder mask spatial mask
        pcb_mask = cv2.bitwise_or(green_mask, cv2.bitwise_or(blue_mask, red_mask))
        if black_count > (total_pixels * 0.05):
            pcb_mask = cv2.bitwise_or(pcb_mask, black_mask)

        total_colored_pixels = green_count + blue_count + red_count
        # Black solder mask pixels are only accepted if verified with colored solder mask or significant contrast
        total_pcb_pixels = total_colored_pixels + (black_count if (black_count > (total_pixels * 0.05) and total_colored_pixels > (total_pixels * 0.02)) else (black_count if black_count > (total_pixels * 0.15) else 0))
        pcb_color_ratio = float(total_pcb_pixels) / total_pixels

        # Detect via holes (circular metallic drill holes, radius 3-16 px)
        # Using param2=34 prevents thousands of false circles on textured food/organic surfaces
        via_count = 0
        try:
            circles = cv2.HoughCircles(
                gray, cv2.HOUGH_GRADIENT, dp=1.2, minDist=14,
                param1=100, param2=34, minRadius=3, maxRadius=16
            )
            if circles is not None:
                detected_circles = circles[0]
                valid_vias = 0
                for c in detected_circles:
                    cx, cy = int(c[0]), int(c[1])
                    if 0 <= cx < w and 0 <= cy < h:
                        if pcb_mask[cy, cx] > 0:
                            valid_vias += 1
                via_count = valid_vias
                if via_count > 300:
                    via_count = 0
        except Exception:
            pass

        # Detect solder pads (small rectangular high-contrast metallic features)
        pad_count = 0
        try:
            # Solder pads are high value and low saturation (silvery solder HASL / ENIG gold)
            solder_mask = cv2.inRange(hsv, np.array([15, 10, 160]), np.array([45, 180, 255]))
            contours, _ = cv2.findContours(solder_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for c in contours:
                area = cv2.contourArea(c)
                if 25 < area < 1500:
                    pad_count += 1
        except Exception:
            pass

        return pcb_color_ratio, dominant_color, via_count, pad_count

    def _evaluate_pcb_texture(self, gray: np.ndarray, w: int, h: int) -> Tuple[float, float, int]:
        """Calculates edge density, orthogonal trace frequency, and trace count."""
        edges = cv2.Canny(gray, 40, 120)
        edge_density = float(np.count_nonzero(edges)) / float(w * h)

        orthogonal_line_score = 0.0
        trace_count = 0
        try:
            lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=45, minLineLength=25, maxLineGap=5)
            if lines is not None and len(lines) > 0:
                trace_count = len(lines)
                orthogonal_count = 0
                for line in lines:
                    x1, y1, x2, y2 = line[0]
                    dx = abs(x2 - x1)
                    dy = abs(y2 - y1)
                    angle = np.degrees(np.arctan2(dy, dx))
                    if angle < 10 or abs(angle - 90) < 10 or abs(angle - 45) < 8:
                        orthogonal_count += 1
                orthogonal_line_score = min(1.0, float(orthogonal_count) / max(1.0, float(len(lines))))
        except Exception:
            pass

        return edge_density, orthogonal_line_score, trace_count

    def _detect_skin_regions(self, cv_img: np.ndarray, w: int, h: int) -> Tuple[np.ndarray, float]:
        """Detects human skin tones in YCrCb color space to identify hands and faces."""
        ycrcb = cv2.cvtColor(cv_img, cv2.COLOR_BGR2YCrCb)
        skin_mask = cv2.inRange(ycrcb, np.array([0, 133, 77]), np.array([255, 173, 127]))
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_OPEN, kernel)

        # Only retain contiguous skin blobs (hand / fingers / face >= 1.2% of image)
        # to avoid misinterpreting copper pads or FR4 substrate as skin
        contours, _ = cv2.findContours(skin_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        contiguous_mask = np.zeros_like(skin_mask)
        min_hand_blob_area = float(w * h) * 0.012
        for c in contours:
            if cv2.contourArea(c) >= min_hand_blob_area:
                cv2.drawContours(contiguous_mask, [c], -1, 255, -1)

        skin_ratio = float(np.count_nonzero(contiguous_mask)) / float(w * h)
        return contiguous_mask, skin_ratio

    def _verify_isolated_component(
        self, cv_img: np.ndarray, gray: np.ndarray, hsv: np.ndarray, w: int, h: int, has_yolo_comp: bool, has_out_of_domain: bool = False, has_yolo_ic: bool = False
    ) -> Tuple[bool, bool, str, Dict[str, Any]]:
        """
        Scientifically verifies whether an isolated object photographed on a plain background
        is an authentic electronic component (resistor, inductor, IC, capacitor) vs arbitrary non-electronics.
        """
        # If image matches vehicle silhouette or COCO detected out-of-domain objects, reject immediately
        if has_out_of_domain or self._is_vehicle_profile(cv_img, gray, w, h):
            return False, False, "NONE", {}

        # Check border uniformity (plain studio background)
        border = np.vstack([
            cv_img[0:max(4, int(h * 0.04)), :].reshape(-1, 3),
            cv_img[min(h - 4, int(h * 0.96)):h, :].reshape(-1, 3),
            cv_img[:, 0:max(4, int(w * 0.04))].reshape(-1, 3),
            cv_img[:, min(w - 4, int(w * 0.96)):w].reshape(-1, 3),
        ])
        border_std = np.std(border, axis=0)
        border_mean = np.mean(border, axis=0)
        is_uniform_border = float(np.mean(border_std)) < 22.0

        diff_from_bg = np.linalg.norm(cv_img.astype(np.float32) - border_mean, axis=2)
        bg_mask = diff_from_bg < 35.0
        bg_ratio = float(np.count_nonzero(bg_mask)) / float(w * h)

        is_studio_bg = (is_uniform_border and bg_ratio > 0.40) or (bg_ratio > 0.55)
        if not is_studio_bg:
            return False, False, "NONE", {}

        fg_mask = cv2.bitwise_not((bg_mask * 255).astype(np.uint8))
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        fg_cleaned = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel)
        contours, hierarchy = cv2.findContours(fg_cleaned, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)

        valid_objects = []
        if contours:
            for idx, c in enumerate(contours):
                area = cv2.contourArea(c)
                if area > (w * h * 0.003):
                    x, y, bw, bh = cv2.boundingRect(c)
                    valid_objects.append((area, x, y, bw, bh, c, idx))

        if len(valid_objects) == 0:
            return True, False, "NONE", {"objectCount": 0}

        valid_objects.sort(key=lambda item: item[0], reverse=True)
        area, x, y, bw, bh, cnt, obj_idx = valid_objects[0]
        aspect = float(bw) / float(max(1, bh))
        crop = cv_img[y:y + bh, x:x + bw]

        # 1. Check for Axial Resistor:
        # Must have elongated aspect ratio and verified color bands or leads
        is_axial_ratio = aspect > 2.2 or aspect < 0.45
        has_color_bands = self._detect_resistor_bands_in_crop(crop)
        if is_axial_ratio and (has_color_bands or has_yolo_comp):
            return True, True, "AXIAL_RESISTOR", {"aspect": round(aspect, 2), "hasColorBands": True}

        # 2. Check for Toroidal Inductor (Doughnut core with enclosed center hole and copper wire turns)
        has_inner_hole = False
        if 0.70 < aspect < 1.45:
            # Doughnut hole check: must have enclosed inner hole using RETR_CCOMP hierarchy
            if hierarchy is not None and len(hierarchy) > 0 and obj_idx < len(hierarchy[0]):
                # hierarchy[0][obj_idx][2] is child contour
                if hierarchy[0][obj_idx][2] != -1:
                    child_idx = hierarchy[0][obj_idx][2]
                    child_area = cv2.contourArea(contours[child_idx])
                    if child_area > (area * 0.03):
                        has_inner_hole = True

            # Also check copper wire windings (reddish-brown hue ~ 8-24, sat > 60)
            crop_hsv = hsv[y:y + bh, x:x + bw]
            copper_mask = cv2.inRange(crop_hsv, np.array([8, 60, 40]), np.array([24, 255, 230]))
            copper_ratio = float(np.count_nonzero(copper_mask)) / float(bw * bh)

            if has_inner_hole and (copper_ratio > 0.12 or has_yolo_comp):
                return True, True, "TOROIDAL_INDUCTOR", {"aspect": round(aspect, 2), "hasInnerHole": True, "copperRatio": round(copper_ratio, 3)}

        # 3. Check for IC (Dual-In-Line or Quad Flat package with metallic pin tabs)
        mean_int = 255.0
        if 0.65 < aspect < 3.2:
            gray_crop = gray[y:y + bh, x:x + bw]
            mean_int = float(np.mean(gray_crop))
            # IC epoxy body is dark, pins are bright metallic, and confirmed by YOLO IC class
            if mean_int < 95 and has_yolo_ic:
                return True, True, "INTEGRATED_CIRCUIT", {"aspect": round(aspect, 2), "meanIntensity": round(mean_int, 1)}

        # 4. If YOLO fine-tuned model confirms an electronic component on this object
        # Must have plausible component geometry (axial resistor or toroidal hole)
        if has_yolo_comp and (is_axial_ratio or has_inner_hole):
            return True, True, "ELECTRONIC_COMPONENT", {"hasYoloDetections": True}

        # Otherwise: Arbitrary foreground object (face, car, table, fruit, etc.) on white background!
        return True, False, "NON_ELECTRONIC_OBJECT", {"objectCount": len(valid_objects), "aspect": round(aspect, 2)}

    def _detect_resistor_bands_in_crop(self, crop: np.ndarray) -> bool:
        """Checks for distinct parallel color stripes characteristic of axial resistors."""
        if crop is None or crop.size == 0:
            return False
        h, w = crop.shape[:2]
        if w > h:
            center_slice = crop[int(h * 0.35):int(h * 0.65), :]
            axis = 0
        else:
            center_slice = crop[:, int(w * 0.35):int(w * 0.65)]
            axis = 1

        profile = np.mean(center_slice, axis=axis)
        diff = np.abs(np.diff(profile, axis=0))
        # High-contrast color transitions along body axis
        transitions = np.count_nonzero(np.max(diff, axis=1) > 22)
        return transitions >= 6

    def _evaluate_document_profile(self, gray: np.ndarray, w: int, h: int) -> Tuple[bool, float]:
        """Detects printed documents containing regular lines of horizontal text."""
        mean_bright = float(np.mean(gray))
        if mean_bright < 180:
            return False, 0.0

        sobel_h = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        h_grad = np.abs(sobel_h)
        v_proj = np.mean(h_grad, axis=1)
        mean_proj = float(np.mean(v_proj))
        peaks = int(np.count_nonzero(v_proj > mean_proj * 1.6))

        # Documents have many periodic text lines (> 10)
        is_doc = peaks > 10
        score = min(1.0, float(peaks) / 25.0)
        return is_doc, score

    def _evaluate_organic_color_profile(self, hsv: np.ndarray, cv_img: np.ndarray, w: int, h: int) -> float:
        """Evaluates color clustering typical of food, dishes, and cooked organic matter."""
        warm_food_mask = cv2.inRange(hsv, np.array([10, 80, 50]), np.array([28, 255, 255]))
        warm_ratio = float(np.count_nonzero(warm_food_mask)) / float(w * h)

        crust_mask = cv2.inRange(hsv, np.array([12, 60, 40]), np.array([22, 190, 200]))
        crust_ratio = float(np.count_nonzero(crust_mask)) / float(w * h)

        sauce_mask = cv2.inRange(hsv, np.array([0, 110, 60]), np.array([8, 255, 240]))
        sauce_ratio = float(np.count_nonzero(sauce_mask)) / float(w * h)

        return min(1.0, (warm_ratio * 1.5) + (crust_ratio * 1.8) + (sauce_ratio * 2.0))

    def _evaluate_landscape_profile(self, hsv: np.ndarray, cv_img: np.ndarray, w: int, h: int) -> float:
        """Evaluates landscape characteristics such as open sky or dense natural foliage."""
        top_half = hsv[0:int(h * 0.45), :]
        sky_mask = cv2.inRange(top_half, np.array([98, 40, 120]), np.array([125, 200, 255]))
        sky_ratio = float(np.count_nonzero(sky_mask)) / float(top_half.shape[0] * w)

        bot_half = cv_img[int(h * 0.35):h, :].astype(np.float32)
        b, g, r = bot_half[:, :, 0], bot_half[:, :, 1], bot_half[:, :, 2]
        exg = 2 * g - r - b
        vegetation_ratio = float(np.count_nonzero(exg > 35)) / float(bot_half.shape[0] * w)

        return min(1.0, (sky_ratio * 1.6) + (vegetation_ratio * 1.4))

    def _is_animal_profile(self, cv_img: np.ndarray, gray: np.ndarray, w: int, h: int) -> bool:
        """Detects animal head / fur silhouette."""
        # Laplacian texture variance in mid-frequency fur range
        lap = cv2.Laplacian(gray, cv2.CV_64F)
        var = float(lap.var())
        return 40 < var < 180 and float(np.mean(gray)) < 170

    def _is_vehicle_profile(self, cv_img: np.ndarray, gray: np.ndarray, w: int, h: int) -> bool:
        """Detects vehicle characteristics (dark circular wheels along bottom with vehicle body)."""
        edges = cv2.Canny(gray, 40, 120)
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=50, minLineLength=40, maxLineGap=10)
        # Vehicles have few structural straight lines, unlike PCBs which have hundreds
        if lines is not None and len(lines) > 20:
            return False

        bot_third = gray[int(h * 0.55):h, :]
        try:
            circles = cv2.HoughCircles(
                bot_third, cv2.HOUGH_GRADIENT, dp=1.2, minDist=40,
                param1=100, param2=30, minRadius=15, maxRadius=int(h * 0.25)
            )
            return circles is not None and len(circles[0]) >= 2
        except Exception:
            return False

    def _is_portrait_profile(self, cv_img: np.ndarray, skin_mask: np.ndarray, w: int, h: int) -> bool:
        """Detects central oval head / portrait contour."""
        contours, _ = cv2.findContours(skin_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for c in contours:
            area = cv2.contourArea(c)
            if area > (w * h * 0.08):
                x, y, bw, bh = cv2.boundingRect(c)
                aspect = float(bh) / float(max(1, bw))
                if 1.1 < aspect < 2.0:  # Head vertical aspect ratio
                    return True
        return False

    def _is_furniture_profile(self, cv_img: np.ndarray, gray: np.ndarray, w: int, h: int) -> bool:
        """Detects furniture (horizontal tabletop with vertical legs)."""
        edges = cv2.Canny(gray, 40, 120)
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=50, minLineLength=50, maxLineGap=10)
        if lines is not None and len(lines) < 15:
            # Low line count with long straight structural edges
            return True
        return False

    def _localize_electronic_region(
        self, cv_img: np.ndarray, skin_mask: np.ndarray, w: int, h: int
    ) -> List[Dict[str, Any]]:
        """Isolates the electronic board area away from human hands and background."""
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
        non_skin = cv2.bitwise_not(skin_mask)
        masked_gray = cv2.bitwise_and(gray, gray, mask=non_skin)

        edges = cv2.Canny(masked_gray, 40, 120)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
        density_map = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
        contours, _ = cv2.findContours(density_map, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        regions = []
        for c in contours:
            area = cv2.contourArea(c)
            if area > (w * h * 0.05):
                x, y, bw, bh = cv2.boundingRect(c)
                regions.append({
                    "x": int(x),
                    "y": int(y),
                    "width": int(bw),
                    "height": int(bh),
                    "area": float(area),
                    "confidence": 0.88,
                })

        regions.sort(key=lambda r: r["area"], reverse=True)
        return regions[:2]

relevance_classifier = ImageRelevanceClassifier()
