# EcoIntel AI Component Detection Microservice

Production-grade AI vision microservice built with **FastAPI**, **Ultralytics YOLO**, and **OpenCV** for automated electronic component detection and spatial bounding box localization on printed circuit boards (PCBs).

---

## 1. Architecture Overview

```
PCB Image (Optical / X-Ray)
           │
           ▼
[FastAPI /detection] ──── Authentication: Bearer <AI_SERVICE_API_KEY>
           │
           ▼
[Preprocessing & Quality Inspection]
  ├── EXIF Orientation Correction
  ├── Resolution Validation
  ├── Laplacian Blur Variance Check
  ├── Luminance & Glare Analysis
  ├── Contrast Standard Deviation
  └── PCB Mask / FR4 Spectrum Verification
           │
           ▼
[YOLO Component Detector]
  ├── Ultralytics YOLO11 / Custom Checkpoint
  ├── Configurable Confidence (YOLO_CONFIDENCE=0.35)
  ├── Non-Maximum Suppression (YOLO_IOU=0.45)
  └── Adaptive Morphology Fallback (when weights downloading is offline)
           │
           ▼
[Postprocessing & Normalization]
  ├── Coordinate Re-scaling to Original Image Dimensions
  ├── Normalized Bounding Boxes [0.0 - 1.0]
  └── 15-Class Canonical EcoIntel Taxonomy Mapping
           │
           ▼
[JSON Response] ──► Next.js Backend ──► MongoDB Atlas ──► 2D / 3D Inspector
```

---

## 2. Supported Component Classes

The pipeline standardizes detections into 15 canonical electronic hardware classes:

| Class ID | Canonical Name | Description |
|---|---|---|
| `0` | `IC` | Microcontrollers, Processors, BGA, SOP, QFP chips |
| `1` | `Resistor` | SMD chips, power resistors, shunt arrays |
| `2` | `Capacitor` | Solid polymer, ceramic SMD, tantalum electrolytic cans |
| `3` | `Diode` | Rectifiers, Schottky, Zener protection diodes |
| `4` | `Transistor` | Bipolar junction transistors (SOT-23, TO-92) |
| `5` | `MOSFET` | Power switches, high-side/low-side FETs (TO-220, D2PAK) |
| `6` | `Inductor` | SMD ferrite beads, power chokes, toroidal coils |
| `7` | `Connector` | USB-C, RJ-45, pin headers, terminal blocks |
| `8` | `Crystal` | Quartz oscillators, timing crystals, resonators |
| `9` | `Sensor` | Thermistors, accelerometers, Hall-effect sensors |
| `10` | `Relay` | Electromechanical and solid-state relays |
| `11` | `Voltage_Regulator`| LDOs, DC-DC buck/boost converters, PMICs |
| `12` | `LED` | Status indicators, optocouplers, illuminators |
| `13` | `Fuse` | Polyfuses, ceramic Cartridge, SMD overcurrent protectors |
| `14` | `Transformer` | LAN magnetics, flyback isolation transformers |

---

## 3. Local Development

### Prerequisites
- Python 3.10 or 3.11
- pip / venv

### Setup & Run
```bash
# 1. Navigate to AI service directory
cd ai-service

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # Or on Windows: .\venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start FastAPI server with live reload
uvicorn app.main:app --reload --port 8001
```

The service will be live at: `http://localhost:8001`
- Swagger UI Documentation: `http://localhost:8001/docs`
- Health check: `http://localhost:8001/health`

---

## 4. Model Training & Validation

> **Note on Model Status**:
> If no custom dataset has been gathered yet, the service runs in `PRETRAINED_BASE` mode using base checkpoints (`yolo11n.pt`). To train a domain-specific model for your PCB batch:

### Train on Custom PCB Dataset
```bash
python scripts/train_detector.py \
  --data datasets/pcb-components/data.yaml \
  --model yolo11n.pt \
  --epochs 100 \
  --imgsz 1024 \
  --batch 16 \
  --device cpu
```

### Validate Trained Checkpoint
```bash
python scripts/validate_detector.py \
  --model ai-service/models/weights/best.pt \
  --data datasets/pcb-components/data.yaml \
  --device cpu
```

---

## 5. Docker Deployment

```bash
cd ai-service
docker build -t ecointel-yolo-service:1.0 .
docker run -p 8001:8001 -e AI_SERVICE_API_KEY="eco-intel-internal-ai-key-2026" ecointel-yolo-service:1.0
```
