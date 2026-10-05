from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    x: float = Field(..., description="Top-left X coordinate in original image pixels")
    y: float = Field(..., description="Top-left Y coordinate in original image pixels")
    width: float = Field(..., description="Box width in pixels")
    height: float = Field(..., description="Box height in pixels")

class NormalizedBoundingBox(BaseModel):
    x: float = Field(..., description="Normalized top-left X coordinate [0.0 - 1.0]")
    y: float = Field(..., description="Normalized top-left Y coordinate [0.0 - 1.0]")
    width: float = Field(..., description="Normalized box width [0.0 - 1.0]")
    height: float = Field(..., description="Normalized box height [0.0 - 1.0]")

class DetectionItem(BaseModel):
    classId: int
    className: str
    confidence: float
    bbox: BoundingBox
    normalizedBbox: NormalizedBoundingBox

class ModelMetadata(BaseModel):
    name: str = "EcoIntel YOLO"
    version: str = "1.0.0"
    isCustomTrained: bool = False
    status: str = "PRETRAINED_BASE"

class ImageMetadata(BaseModel):
    width: int
    height: int

class ImageQualityCheck(BaseModel):
    quality: str = "GOOD"  # EXCELLENT, GOOD, FAIR, POOR
    score: float = 0.9
    warnings: List[str] = []

class DetectionResponse(BaseModel):
    success: bool = True
    model: ModelMetadata
    image: ImageMetadata
    quality: ImageQualityCheck
    detections: List[DetectionItem] = []
    totalDetected: int = 0
    confidenceAverage: float = 0.0
    processingTimeMs: float = 0.0
    warnings: List[str] = []

class DetectionRequest(BaseModel):
    analysisId: Optional[str] = None
    imageUrl: Optional[str] = None

class HealthResponse(BaseModel):
    status: str = "ok"
    modelLoaded: bool = True
    modelName: str
    modelVersion: str
    device: str
    isCustomTrained: bool = False
