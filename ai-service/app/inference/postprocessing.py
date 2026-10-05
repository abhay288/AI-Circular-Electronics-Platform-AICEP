from typing import List, Dict, Any
from app.schemas import DetectionItem, BoundingBox, NormalizedBoundingBox
from app.config import settings

def process_detections(
    raw_boxes: List[Dict[str, Any]],
    original_width: int,
    original_height: int
) -> List[DetectionItem]:
    """
    Transforms raw model bounding boxes into canonical EcoIntel detection items.
    Handles coordinate clamping, dimension normalization, and class resolution.
    """
    items: List[DetectionItem] = []

    for box in raw_boxes:
        x1 = max(0.0, float(box.get("x1", 0.0)))
        y1 = max(0.0, float(box.get("y1", 0.0)))
        x2 = min(float(original_width), float(box.get("x2", 0.0)))
        y2 = min(float(original_height), float(box.get("y2", 0.0)))

        w = max(1.0, x2 - x1)
        h = max(1.0, y2 - y1)

        norm_x = round(x1 / original_width, 4)
        norm_y = round(y1 / original_height, 4)
        norm_w = round(w / original_width, 4)
        norm_h = round(h / original_height, 4)

        class_id = int(box.get("class_id", 0))
        class_name = box.get("class_name")
        if not class_name:
            if 0 <= class_id < len(settings.CLASSES):
                class_name = settings.CLASSES[class_id]
            else:
                class_name = "IC"

        confidence = round(float(box.get("confidence", 0.0)), 4)

        items.append(
            DetectionItem(
                classId=class_id,
                className=class_name,
                confidence=confidence,
                bbox=BoundingBox(
                    x=round(x1, 1),
                    y=round(y1, 1),
                    width=round(w, 1),
                    height=round(h, 1)
                ),
                normalizedBbox=NormalizedBoundingBox(
                    x=norm_x,
                    y=norm_y,
                    width=norm_w,
                    height=norm_h
                )
            )
        )

    # Sort descending by confidence
    items.sort(key=lambda d: d.confidence, reverse=True)
    return items
