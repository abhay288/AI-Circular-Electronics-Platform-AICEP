#!/usr/bin/env python3
"""
EcoIntel PCB Component Detection — YOLO Training Pipeline
Trains Ultralytics YOLO on custom circular electronics PCB component datasets.
"""

import os
import sys
import argparse
import json
from pathlib import Path
from datetime import datetime

def parse_args():
    parser = argparse.ArgumentParser(description="Train YOLO on EcoIntel PCB Component Dataset")
    parser.add_argument(
        "--data",
        type=str,
        default="datasets/pcb-components/data.yaml",
        help="Path to dataset YAML file",
    )
    parser.add_argument(
        "--model",
        type=str,
        default=os.getenv("MODEL", "yolo11n.pt"),
        help="Initial model checkpoint (e.g. yolo11n.pt, yolo11s.pt, yolo8n.pt)",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=int(os.getenv("EPOCHS", "100")),
        help="Number of training epochs",
    )
    parser.add_argument(
        "--imgsz",
        type=int,
        default=int(os.getenv("IMG_SIZE", "1024")),
        help="Input image resolution (e.g. 640, 1024)",
    )
    parser.add_argument(
        "--batch",
        type=int,
        default=int(os.getenv("BATCH", "16")),
        help="Batch size",
    )
    parser.add_argument(
        "--device",
        type=str,
        default=os.getenv("DEVICE", "cpu"),
        help="Compute device: 'cpu', '0', '0,1', or 'mps'",
    )
    parser.add_argument(
        "--project",
        type=str,
        default="runs/detect",
        help="Directory to save training runs",
    )
    parser.add_argument(
        "--name",
        type=str,
        default="ecointel-pcb-yolo",
        help="Name of the training run",
    )
    return parser.parse_args()

def main():
    args = parse_args()
    print("=" * 60)
    print(" ECOINTEL PCB COMPONENT YOLO TRAINING PIPELINE")
    print("=" * 60)
    print(f" Dataset YAML : {args.data}")
    print(f" Base Model   : {args.model}")
    print(f" Epochs       : {args.epochs}")
    print(f" Image Size   : {args.imgsz}")
    print(f" Batch Size   : {args.batch}")
    print(f" Device       : {args.device}")
    print(f" Output Run   : {args.project}/{args.name}")
    print("=" * 60)

    # Verify dataset exists
    if not os.path.exists(args.data):
        print(f"[ERROR] Dataset configuration not found at '{args.data}'.")
        print("Please ensure datasets/pcb-components/data.yaml exists.")
        sys.exit(1)

    try:
        from ultralytics import YOLO
    except ImportError:
        print("[ERROR] 'ultralytics' is not installed in the current Python environment.")
        print("Install it with: pip install ultralytics")
        sys.exit(1)

    print(f"Loading initial model weights: {args.model}...")
    model = YOLO(args.model)

    print("Beginning training run...")
    results = model.train(
        data=args.data,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device,
        project=args.project,
        name=args.name,
        exist_ok=True,
    )

    best_weight_path = Path(args.project) / args.name / "weights" / "best.pt"
    print("\n" + "=" * 60)
    print(" TRAINING COMPLETE")
    print(f" Best Weights Saved: {best_weight_path}")
    print("=" * 60)

    # Update registry if registry file exists
    registry_path = Path("ai-service/models/registry.json")
    if registry_path.exists() and best_weight_path.exists():
        try:
            with open(registry_path, "r") as f:
                registry = json.load(f)

            # Update entry
            new_model_entry = {
                "modelId": f"model-ecointel-{datetime.now().strftime('%Y%m%d-%H%M')}",
                "name": "EcoIntel-PCB-YOLO-Trained",
                "version": "v1.0.0",
                "provider": "EcoIntel Fine-Tuned PyTorch",
                "status": "CUSTOM_TRAINED",
                "isCustomTrained": True,
                "trainingDate": datetime.now().isoformat(),
                "datasetVersion": "pcb-components-v1",
                "checkpointPath": str(best_weight_path),
                "active": True,
                "createdAt": datetime.now().isoformat(),
                "notes": f"Trained with {args.epochs} epochs on {args.data}",
            }
            # Set all others to active=False
            for m in registry.get("models", []):
                m["active"] = False

            registry["models"].insert(0, new_model_entry)
            registry["activeModelId"] = new_model_entry["modelId"]

            with open(registry_path, "w") as f:
                json.dump(registry, f, indent=2)
            print(f"[Registry] Updated {registry_path} with active custom model.")
        except Exception as e:
            print(f"[Warning] Could not update model registry: {e}")

if __name__ == "__main__":
    main()
