import os
from pydantic import BaseModel

class Settings(BaseModel):
    PORT: int = int(os.getenv("PORT", "8001"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    AI_SERVICE_API_KEY: str = os.getenv("AI_SERVICE_API_KEY", "eco-intel-internal-ai-key-2026")
    
    YOLO_MODEL_PATH: str = os.getenv("YOLO_MODEL_PATH", "")
    YOLO_CONFIDENCE: float = float(os.getenv("YOLO_CONFIDENCE", "0.35"))
    YOLO_IOU: float = float(os.getenv("YOLO_IOU", "0.45"))
    DEVICE: str = os.getenv("DEVICE", "cpu")
    
    MAX_IMAGE_WIDTH: int = int(os.getenv("MAX_IMAGE_WIDTH", "4096"))
    MAX_IMAGE_HEIGHT: int = int(os.getenv("MAX_IMAGE_HEIGHT", "4096"))
    
    # 15 Canonical PCB classes
    CLASSES: list[str] = [
        "IC",
        "Resistor",
        "Capacitor",
        "Diode",
        "Transistor",
        "MOSFET",
        "Inductor",
        "Connector",
        "Crystal",
        "Sensor",
        "Relay",
        "Voltage_Regulator",
        "LED",
        "Fuse",
        "Transformer"
    ]

settings = Settings()
