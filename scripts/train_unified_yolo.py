#!/usr/bin/env python3
"""
EcoIntel Unified YOLO Training & Evaluation Pipeline
Trains Ultralytics YOLOv11 on the comprehensive EcoIntel Unified Dataset (840 images, 2100+ component annotations).
Evaluates precision, recall, mAP50, and updates model registry.
"""

import os
import sys
import json
import shutil
import time
from pathlib import Path
from datetime import datetime
import torch

def train_unified_model(
    data_yaml: str = "datasets/unified-pcb-dataset/data.yaml",
    base_model: str = "yolo11n.pt",
    epochs: int = 25,
    imgsz: int = 512,
    batch: int = 16,
    device: str = "cpu",
    workers: int = 8,
):
    print("=" * 70)
    print(" ECOINTEL YOLOv11 UNIFIED COMPONENT TRAINING PIPELINE")
    print("=" * 70)
    print(f" Dataset YAML : {data_yaml}")
    print(f" Base Model   : {base_model}")
    print(f" Epochs       : {epochs}")
    print(f" Image Size   : {imgsz}")
    print(f" Batch Size   : {batch}")
    print(f" Device       : {device}")
    print(f" Workers      : {workers}")
    print("=" * 70)

    from ultralytics import YOLO

    if not os.path.exists(data_yaml):
        print(f"[ERROR] Dataset configuration '{data_yaml}' not found.")
        sys.exit(1)

    print(f"\nInitializing model with base weights: {base_model}...")
    model = YOLO(base_model)

    start_time = time.time()
    print("\nStarting training loop...")
    results = model.train(
        data=data_yaml,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        device=device,
        workers=workers,
        project="runs/detect",
        name="ecointel-unified-yolo",
        exist_ok=True,
        verbose=True,
        plots=True,
        save=True,
    )
    elapsed = round(time.time() - start_time, 2)

    save_dir = Path(getattr(results, "save_dir", "runs/detect/ecointel-unified-yolo"))
    best_weight = save_dir / "weights" / "best.pt"
    if not best_weight.exists():
        best_weight = Path("runs/detect/ecointel-unified-yolo/weights/best.pt")
    if not best_weight.exists():
        best_weight = save_dir / "weights" / "last.pt"

    print("\n" + "=" * 70)
    print(" TRAINING COMPLETE")
    print(f" Elapsed Time : {elapsed} seconds")
    print(f" Best Weights : {best_weight}")
    print("=" * 70)

    # Copy to production weights
    prod_weight_path = Path("ai-service/models/weights/best.pt")
    prod_weight_path.parent.mkdir(parents=True, exist_ok=True)
    if best_weight.exists():
        shutil.copy2(best_weight, prod_weight_path)
        print(f"[Production] Copied best weights to {prod_weight_path} ({os.path.getsize(prod_weight_path)} bytes)")

    # Evaluate on test split
    print("\nEvaluating model on unseen test split...")
    eval_model = YOLO(str(prod_weight_path))
    val_metrics = eval_model.val(data=data_yaml, split="test", imgsz=imgsz, device=device)

    map50 = float(val_metrics.box.map50)
    map50_95 = float(val_metrics.box.map)
    precision = float(val_metrics.box.mp)
    recall = float(val_metrics.box.mr)

    print("\n" + "=" * 70)
    print(" VALIDATION & TEST METRICS")
    print(f" Precision (mP) : {precision:.4f}")
    print(f" Recall (mR)    : {recall:.4f}")
    print(f" mAP@0.50       : {map50:.4f}")
    print(f" mAP@0.50:0.95  : {map50_95:.4f}")
    print("=" * 70)

    # Save latest validation metrics
    metrics_record = {
        "model": str(prod_weight_path),
        "dataset": data_yaml,
        "split": "test",
        "condition": "UNIFIED_MULTI_DATASET_TRAINED",
        "epochs": epochs,
        "metrics": {
            "mAP50": round(map50, 4),
            "mAP50_95": round(map50_95, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
        },
        "testedAt": datetime.now().isoformat(),
        "trainingDurationSeconds": elapsed,
    }

    metrics_file = Path("ai-service/models/latest_validation_metrics.json")
    with open(metrics_file, "w") as mf:
        json.dump(metrics_record, mf, indent=2)
    print(f"[Metrics] Saved validation metrics to {metrics_file}")

    # Update registry
    registry_file = Path("ai-service/models/registry.json")
    if registry_file.exists():
        try:
            with open(registry_file, "r") as rf:
                reg = json.load(rf)

            new_model = {
                "modelId": f"model-ecointel-unified-{datetime.now().strftime('%Y%m%d-%H%M')}",
                "name": "EcoIntel-PCB-YOLO-Unified",
                "version": "v2.0.0",
                "provider": "EcoIntel Fine-Tuned PyTorch",
                "status": "CUSTOM_TRAINED",
                "isCustomTrained": True,
                "trainingDate": datetime.now().isoformat(),
                "datasetVersion": "unified-pcb-v2",
                "checkpointPath": str(prod_weight_path),
                "active": True,
                "createdAt": datetime.now().isoformat(),
                "notes": f"Trained {epochs} epochs on 840 multi-dataset images (ElectroCom61 + PCB + isolated components). mAP50: {map50:.4f}, Precision: {precision:.4f}",
            }

            for m in reg.get("models", []):
                m["active"] = False

            reg["models"].insert(0, new_model)
            reg["activeModelId"] = new_model["modelId"]

            with open(registry_file, "w") as rf:
                json.dump(reg, rf, indent=2)
            print(f"[Registry] Updated model registry with active model {new_model['name']}.")
        except Exception as e:
            print(f"[Warning] Failed to update registry: {e}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Train EcoIntel YOLO on Unified Dataset")
    parser.add_argument("--epochs", type=int, default=20, help="Epochs to train")
    parser.add_argument("--imgsz", type=int, default=512, help="Image size")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    args = parser.parse_args()

    train_unified_model(epochs=args.epochs, imgsz=args.imgsz, batch=args.batch)
