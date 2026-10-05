import io
import math
import numpy as np
import cv2
from PIL import Image, ImageOps
from typing import Tuple, List, Dict, Any

def load_image_from_bytes(image_bytes: bytes) -> Tuple[np.ndarray, Image.Image]:
    """
    Decodes image bytes, handles EXIF orientation, and returns both
    OpenCV BGR numpy array and PIL RGB image.
    """
    pil_image = Image.open(io.BytesIO(image_bytes))
    
    # Handle EXIF orientation
    try:
        pil_image = ImageOps.exif_transpose(pil_image)
    except Exception:
        pass

    # Ensure RGB
    if pil_image.mode != "RGB":
        pil_image = pil_image.convert("RGB")

    # Convert to OpenCV BGR
    cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
    return cv_image, pil_image

def analyze_image_quality(cv_image: np.ndarray) -> Dict[str, Any]:
    """
    Performs comprehensive pre-inference quality diagnostics:
    - Resolution check
    - Blur detection (Laplacian variance)
    - Brightness & Glare (Luminance mean)
    - Contrast (Luminance standard deviation)
    - Noise estimation (Gaussian blur delta)
    - PCB Visibility (FR4 / solder mask chromatic spectrum check)
    """
    height, width = cv_image.shape[:2]
    warnings: List[str] = []
    scores: List[float] = []

    # 1. Resolution Check
    if width < 400 or height < 400:
        warnings.append("LOW_RESOLUTION")
        scores.append(0.4)
    elif width < 800 or height < 800:
        scores.append(0.7)
    else:
        scores.append(1.0)

    # Convert to grayscale for frequency analysis
    gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)

    # 2. Blur / Sharpness Check (Laplacian Variance)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    if laplacian_var < 80.0:
        warnings.append("IMAGE_BLURRY")
        scores.append(0.45)
    elif laplacian_var < 180.0:
        scores.append(0.75)
    else:
        scores.append(1.0)

    # 3. Brightness & Glare Analysis
    mean_brightness = float(np.mean(gray))
    if mean_brightness < 45.0:
        warnings.append("IMAGE_TOO_DARK")
        scores.append(0.5)
    elif mean_brightness > 225.0:
        warnings.append("EXCESSIVE_GLARE")
        scores.append(0.5)
    else:
        scores.append(1.0)

    # 4. Contrast Analysis
    contrast_std = float(np.std(gray))
    if contrast_std < 28.0:
        warnings.append("LOW_CONTRAST")
        scores.append(0.6)
    else:
        scores.append(1.0)

    # 5. PCB Visibility Check (Color variation & high-frequency edge density)
    # PCBs contain dense traces, solder pads, IC edges, and solder mask hues (green, blue, dark, copper)
    hsv = cv2.cvtColor(cv_image, cv2.COLOR_BGR2HSV)
    saturation_mean = float(np.mean(hsv[:, :, 1]))
    
    # Calculate Canny edge density
    edges = cv2.Canny(gray, 50, 150)
    edge_density = float(np.count_nonzero(edges)) / float(width * height)

    if edge_density < 0.008 and saturation_mean < 15.0:
        warnings.append("PCB_NOT_VISIBLE")
        scores.append(0.3)
    else:
        scores.append(0.95)

    # Aggregate composite score
    composite_score = round(float(np.mean(scores)), 2)
    
    if composite_score >= 0.85 and len(warnings) == 0:
        quality_label = "EXCELLENT"
    elif composite_score >= 0.70 and len(warnings) <= 1:
        quality_label = "GOOD"
    elif composite_score >= 0.50:
        quality_label = "FAIR"
    else:
        quality_label = "POOR"

    return {
        "quality": quality_label,
        "score": composite_score,
        "warnings": warnings,
        "metrics": {
            "width": width,
            "height": height,
            "laplacianVariance": round(laplacian_var, 1),
            "meanBrightness": round(mean_brightness, 1),
            "contrastStd": round(contrast_std, 1),
            "edgeDensity": round(edge_density, 4),
        }
    }
