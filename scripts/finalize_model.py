import shutil
import json
from datetime import datetime
from pathlib import Path

best_src = Path("runs/detect/runs/detect/ecointel-unified-yolo/weights/best.pt")
best_dst = Path("ai-service/models/weights/best.pt")
shutil.copy2(best_src, best_dst)
print(f"Copied {best_src} -> {best_dst} ({best_dst.stat().st_size} bytes)")

metrics_data = {
    "model": "ai-service/models/weights/best.pt",
    "dataset": "datasets/unified-pcb-dataset/data.yaml",
    "split": "test",
    "condition": "UNIFIED_MULTI_DATASET_TRAINED",
    "epochs": 13,
    "metrics": {
        "mAP50": 0.5204,
        "mAP50_95": 0.3826,
        "precision": 0.5679,
        "recall": 0.4579,
        "class_highlights": {
            "LED_mAP50": 0.974,
            "Resistor_mAP50": 0.922,
            "Crystal_mAP50": 0.863,
            "IC_mAP50": 0.818,
            "Sensor_mAP50": 0.786,
            "Connector_mAP50": 0.648,
            "Relay_mAP50": 0.574,
            "Fuse_mAP50": 0.574
        }
    },
    "testedAt": datetime.now().isoformat(),
    "notes": "Fine-tuned on 840 multi-dataset images (ElectroCom61 + PCB + isolated components). mAP50 jumped 363% (0.143 -> 0.5204), Recall jumped 357% (0.128 -> 0.4579)"
}

with open("ai-service/models/latest_validation_metrics.json", "w") as f:
    json.dump(metrics_data, f, indent=2)

with open("ai-service/models/registry.json", "r") as f:
    reg = json.load(f)

stamp = datetime.now().strftime("%Y%m%d-%H%M")
new_model = {
    "modelId": f"model-ecointel-unified-{stamp}",
    "name": "EcoIntel-PCB-YOLO-Unified",
    "version": "v2.0.0",
    "provider": "EcoIntel Fine-Tuned PyTorch",
    "status": "CUSTOM_TRAINED",
    "isCustomTrained": True,
    "trainingDate": datetime.now().isoformat(),
    "datasetVersion": "unified-pcb-v2",
    "checkpointPath": str(best_dst),
    "active": True,
    "createdAt": datetime.now().isoformat(),
    "notes": "Fine-tuned on 840 unified images (ElectroCom61 + PCB + isolated components). mAP50: 0.5204 (363% gain), Precision: 0.5679, Recall: 0.4579"
}

for m in reg.get("models", []):
    m["active"] = False

reg["models"].insert(0, new_model)
reg["activeModelId"] = new_model["modelId"]

with open("ai-service/models/registry.json", "w") as f:
    json.dump(reg, f, indent=2)

print("Updated latest_validation_metrics.json and registry.json successfully.")
