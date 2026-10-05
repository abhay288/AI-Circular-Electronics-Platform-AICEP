#!/usr/bin/env python3
"""
EcoIntel PCB Component Detection — Validation & Metrics Benchmark
Generates mAP50, mAP50-95, precision, recall, and per-class performance metrics.
"""

import os
import sys
import argparse
import json
from pathlib import Path

def parse_args():
    parser = argparse.ArgumentParser(description="Validate YOLO PCB Component Detection Model")
    parser.add_argument(
        "--model",
        type=str,
        default="yolo11n.pt",
        help="Model checkpoint path to evaluate",
    )
    parser.add_argument(
        "--data",
        type=str,
        default="datasets/pcb-components/data.yaml",
        help="Path to dataset YAML",
    )
    parser.add_argument(
        "--imgsz",
        type=int,
        default=1024,
        help="Image resolution",
    )
    parser.add_argument(
        "--split",
        type=str,
        default="val",
        choices=["val", "test"],
        help="Dataset split to evaluate on",
    )
    parser.add_argument(
        "--device",
        type=str,
        default="cpu",
        help="Compute device: 'cpu' or '0'",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="ai-service/models/latest_validation_metrics.json",
        help="Output metrics path",
    )
    return parser.parse_args()

def main():
    args = parse_args()
    print("=" * 60)
    print(" ECOINTEL PCB COMPONENT VALIDATION & BENCHMARKING")
    print("=" * 60)
    print(f" Model Checkpoint : {args.model}")
    print(f" Dataset YAML     : {args.data}")
    print(f" Evaluation Split : {args.split}")
    print(f" Device           : {args.device}")
    print("=" * 60)

    try:
        from ultralytics import YOLO
    except ImportError:
        print("[ERROR] 'ultralytics' is not installed in the current Python environment.")
        sys.exit(1)

    if not os.path.exists(args.data):
        print(f"[ERROR] Dataset configuration '{args.data}' does not exist.")
        sys.exit(1)

    print(f"Loading checkpoint: {args.model}...")
    model = YOLO(args.model)

    print("Running validation metrics evaluation...")
    metrics = model.val(
        data=args.data,
        split=args.split,
        imgsz=args.imgsz,
        device=args.device,
        verbose=True,
    )

    # Extract official metrics
    map50 = float(metrics.box.map50)
    map50_95 = float(metrics.box.map)
    mp = float(metrics.box.mp)
    mr = float(metrics.box.mr)

    print("\n" + "=" * 60)
    print(" VALIDATION RESULTS SUMMARY")
    print("=" * 60)
    print(f" mAP@0.50       : {map50:.4f}")
    print(f" mAP@0.50:0.95  : {map50_95:.4f}")
    print(f" Precision      : {mp:.4f}")
    print(f" Recall         : {mr:.4f}")
    print("=" * 60)

    output_data = {
        "model": args.model,
        "dataset": args.data,
        "split": args.split,
        "metrics": {
            "mAP50": round(map50, 4),
            "mAP50_95": round(map50_95, 4),
            "precision": round(mp, 4),
            "recall": round(mr, 4),
        },
    }

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(output_data, f, indent=2)

    print(f"Saved validation metrics to: {args.output}")

if __name__ == "__main__":
    main()
