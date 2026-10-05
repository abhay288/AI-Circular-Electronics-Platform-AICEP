import time
import requests
from fastapi import FastAPI, Depends, HTTPException, Header, UploadFile, File, Form, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List, Dict, Any

from app.config import settings
from app.schemas import (
    DetectionResponse,
    HealthResponse,
    DetectionRequest,
)
from app.inference.preprocessing import load_image_from_bytes
from app.inference.detector import detector

app = FastAPI(
    title="EcoIntel AI Component Detection Service",
    description="Production-grade AI vision pipeline for PCB component classification and spatial localization.",
    version="1.0.0",
)

# Enable CORS for internal microservice communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def verify_api_key(authorization: Optional[str] = Header(None)):
    """
    Validates internal service-to-service API key.
    """
    expected_key = settings.AI_SERVICE_API_KEY
    if not expected_key:
        return True  # If no key configured in dev, allow

    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or token != expected_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or unauthorized API key",
        )
    return True

@app.get("/health", response_model=HealthResponse)
def health_check():
    """
    Health diagnostic endpoint returning model readiness, hardware device, and training status.
    """
    return HealthResponse(
        status="ok",
        modelLoaded=True,
        modelName=detector.model_name,
        modelVersion=detector.model_version,
        device=detector.device,
        isCustomTrained=detector.is_custom_trained,
    )

@app.post("/detection")
async def detect_components(
    request: Request,
    file: Optional[UploadFile] = File(None),
    analysisId: Optional[str] = Form(None),
    authorized: bool = Depends(verify_api_key)
):
    """
    Accepts either multipart file upload or JSON payload containing imageUrl.
    Executes pre-inference quality diagnostics, YOLO inference, and bounding box normalization.
    """
    image_bytes: Optional[bytes] = None

    try:
        content_type = request.headers.get("content-type", "")

        # 1. Handle multipart file upload
        if file is not None:
            image_bytes = await file.read()
        elif "application/json" in content_type:
            # 2. Handle JSON request with imageUrl
            body = await request.json()
            image_url = body.get("imageUrl")
            if not image_url:
                raise HTTPException(status_code=400, detail="Missing imageUrl in JSON payload")

            # Fetch image from URL or data URI
            if image_url.startswith("data:image"):
                import base64
                header, encoded = image_url.split(",", 1)
                image_bytes = base64.b64decode(encoded)
            else:
                resp = requests.get(image_url, timeout=10)
                if resp.status_code != 200:
                    raise HTTPException(status_code=400, detail=f"Failed to fetch image from URL: {resp.status_code}")
                image_bytes = resp.content

        if not image_bytes or len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="No valid image data provided for inference.")

        # Decode image and handle EXIF orientation
        cv_img, _ = load_image_from_bytes(image_bytes)

        # Execute component detection
        result = detector.detect(cv_img)
        return result.model_dump()

    except HTTPException:
        raise
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "code": "DETECTION_FAILED",
                    "message": "Component detection could not be completed.",
                },
            },
        )

@app.post("/pcb-analysis")
async def analyze_pcb(
    request: Request,
    file: Optional[UploadFile] = File(None),
    analysisId: Optional[str] = Form(None),
    authorized: bool = Depends(verify_api_key)
):
    """
    Analyzes board geometry, traces, pads, vias, component associations,
    visual damage regions, topology graph, and reconstruction estimate.
    """
    image_bytes: Optional[bytes] = None
    detections: List[Dict[str, Any]] = []
    current_analysis_id = analysisId or "ECI-PCB"

    try:
        content_type = request.headers.get("content-type", "")

        if file is not None:
            image_bytes = await file.read()
        elif "application/json" in content_type:
            body = await request.json()
            image_url = body.get("imageUrl")
            current_analysis_id = body.get("analysisId", current_analysis_id)
            detections = body.get("detections", [])

            if image_url:
                if image_url.startswith("data:image"):
                    import base64
                    header, encoded = image_url.split(",", 1)
                    image_bytes = base64.b64decode(encoded)
                else:
                    resp = requests.get(image_url, timeout=10)
                    if resp.status_code != 200:
                        raise HTTPException(status_code=400, detail=f"Failed to fetch image: {resp.status_code}")
                    image_bytes = resp.content

        if not image_bytes or len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="No valid image data provided for PCB analysis.")

        from app.inference.pcb_analyzer import pcb_analyzer
        cv_img, _ = load_image_from_bytes(image_bytes)

        # If detections weren't passed in, run detector first
        if not detections:
            det_result = detector.detect(cv_img)
            detections = [d.model_dump() for d in det_result.detections]

        analysis_result = pcb_analyzer.analyze(cv_img, detections, current_analysis_id)

        return {
            "success": True,
            "data": analysis_result
        }

    except HTTPException:
        raise
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "code": "PCB_ANALYSIS_UNAVAILABLE",
                    "message": f"PCB analysis could not be completed: {str(exc)}",
                },
            },
        )

