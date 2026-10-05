import pytest
import io
import numpy as np
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings
from app.inference.preprocessing import analyze_image_quality
from app.inference.postprocessing import process_detections

client = TestClient(app)

def create_synthetic_pcb_image(width=800, height=600):
    """Generates a synthetic green PCB image with IC pads for testing."""
    arr = np.zeros((height, width, 3), dtype=np.uint8)
    # FR4 green solder mask background
    arr[:, :] = [20, 80, 30]
    # Add copper traces / rectangles
    arr[200:350, 250:450] = [180, 180, 180]  # IC chip package
    arr[400:460, 100:180] = [200, 150, 50]   # Copper pad
    
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["modelLoaded"] is True
    assert "EcoIntel" in data["modelName"]
    assert data["isCustomTrained"] is False  # Honest base checkpoint reporting

def test_auth_unauthorized():
    response = client.post("/detection")
    # Should reject missing Authorization header
    assert response.status_code in [401, 403]

def test_quality_analysis():
    img_bytes = create_synthetic_pcb_image(800, 600)
    arr = np.frombuffer(img_bytes, dtype=np.uint8)
    import cv2
    cv_img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    
    quality = analyze_image_quality(cv_img)
    assert quality["quality"] in ["EXCELLENT", "GOOD", "FAIR", "POOR"]
    assert 0.0 <= quality["score"] <= 1.0
    assert "metrics" in quality

def test_postprocessing_coordinates():
    raw_boxes = [
        {"x1": 100, "y1": 50, "x2": 250, "y2": 150, "confidence": 0.94, "class_id": 0}
    ]
    detections = process_detections(raw_boxes, 1000, 800)
    assert len(detections) == 1
    d = detections[0]
    assert d.className == "IC"
    assert d.bbox.width == 150
    assert d.bbox.height == 100
    assert d.normalizedBbox.x == 0.1
    assert d.normalizedBbox.y == 0.0625

def test_detection_endpoint_with_image():
    img_bytes = create_synthetic_pcb_image(800, 600)
    headers = {"Authorization": f"Bearer {settings.AI_SERVICE_API_KEY}"}
    files = {"file": ("test_pcb.jpg", img_bytes, "image/jpeg")}
    
    response = client.post("/detection", headers=headers, files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["image"]["width"] == 800
    assert data["image"]["height"] == 600
    assert "detections" in data
    assert "quality" in data
    assert data["model"]["isCustomTrained"] is False
