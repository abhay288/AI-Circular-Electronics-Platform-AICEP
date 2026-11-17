#!/usr/bin/env python3
"""
EcoIntel Unified Dataset Synthesis Pipeline
Combines:
1. ElectroCom61 (837+ annotated multi-component bounding boxes across electronic boards)
2. Verified PCB component samples from datasets/pcb-components
3. Real through-hole & SMD isolated component samples (Resistors, ICs, Capacitors, LEDs, Diodes)
4. Defect and dust contamination samples from ECF-Dataset

Maps all classes into the standardized 16-class EcoIntel taxonomy.
"""

import os
import sys
import shutil
import random
from pathlib import Path
import yaml
import cv2
import numpy as np

ECOINTEL_CLASSES = [
    "IC",                  # 0
    "Resistor",            # 1
    "Capacitor",           # 2
    "Diode",               # 3
    "Transistor",          # 4
    "MOSFET",              # 5
    "Inductor",            # 6
    "Connector",           # 7
    "Crystal",             # 8
    "Sensor",              # 9
    "Relay",               # 10
    "Voltage_Regulator",   # 11
    "LED",                 # 12
    "Fuse",                # 13
    "Transformer",         # 14
    "Dust_Contamination",  # 15
]

# Mapping from ElectroCom61's 61 classes to EcoIntel 16 classes
ELECTROCOM61_TO_ECOINTEL = {
    # IC & MCU modules
    "IC-Chip": 0,
    "IC-Base-14-Pin": 0,
    "IC-Base-28-Pin": 0,
    "Arduino-Mega": 0,
    "Arduino-Nano": 0,
    "Arduino-Uno": 0,
    "ESP32": 0,
    "ESP32-CAM": 0,
    "FT-232-USB-Serial-Module": 0,
    "Bluetooth-Module": 0,
    "GSM-Module": 0,

    # Resistors & Variable Resistors
    "Resistor": 1,
    "Taper-Potentiometer": 1,
    "Trimmer-Potentiometer": 1,
    "NTC-Thermistor": 1,

    # Capacitors
    "Capacitor-10mf": 2,
    "Capacitor-470mf": 2,
    "Film-Capacitor": 2,
    "High-Voltage-Ceramic-Capacitor": 2,
    "Low-Voltage-Ceramic-Capacitor": 2,
    "MLC-Capacitor": 2,

    # Diodes
    "Diode": 3,
    "Zener-Diode": 3,
    "Bridge-Rectifier": 3,

    # Transistors
    "BJT-Transistor": 4,
    "IGBT": 4,

    # MOSFET
    "MOSFET": 5,

    # Inductors
    "Inductor": 6,

    # Connectors & Electromechanical Interfaces
    "Pin-Header": 7,
    "Breadboard": 7,
    "Push-Switch": 7,
    "Tact-Switch": 7,
    "Rocker-Switch": 7,
    "Keypad": 7,
    "Fuse-Base": 7,

    # Sensors
    "Gas-Sensor": 9,
    "Humidity-Sensor": 9,
    "IR-Sensor": 9,
    "LDR-Sensor": 9,
    "Motion-Sensor": 9,
    "Raindrops-Module": 9,
    "Soil-Moisture-Sensor": 9,
    "Sonar-Sensor": 9,
    "TCRT5000": 9,
    "Water-Sensor": 9,
    "RFID-Scanner": 9,

    # Relays
    "Relay-Module": 10,

    # Regulators & Power converters
    "Buck-Converter": 11,
    "Motor-Driver": 11,

    # Displays & LEDs
    "LED-Light": 12,
    "7-Segment-Display": 12,
    "LCD-Display": 12,
    "OLED-Display": 12,

    # Fuses
    "Fuse": 13,

    # Transformers / Coils / Transducers
    "Buzzer": 14,
    "DC-Motor": 14,
    "Servo-Motor": 14,
}

def extract_tight_foreground_bbox(img_path: str):
    """
    Extracts high-precision normalized [xc, yc, w, h] bbox for an isolated component on plain/uniform background.
    """
    img = cv2.imread(img_path)
    if img is None:
        return None
    h, w = img.shape[:2]
    if h < 20 or w < 20:
        return None

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (7, 7), 0)

    # Otsu thresholding
    _, thresh_inv = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    _, thresh_norm = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Pick mask where background borders are 0
    border_pixels = np.concatenate([
        thresh_inv[0, :], thresh_inv[-1, :], thresh_inv[:, 0], thresh_inv[:, -1]
    ])
    mask = thresh_inv if np.mean(border_pixels) < 128 else thresh_norm

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None

    # Filter out tiny noise and pick bounding box enclosing significant components
    valid_c = [c for c in contours if cv2.contourArea(c) > (w * h * 0.01)]
    if not valid_c:
        valid_c = contours

    all_pts = np.concatenate(valid_c)
    bx, by, bw, bh = cv2.boundingRect(all_pts)

    # Pad slightly by 4%
    pad_x = int(bw * 0.04)
    pad_y = int(bh * 0.04)
    bx = max(0, bx - pad_x)
    by = max(0, by - pad_y)
    bw = min(w - bx, bw + 2 * pad_x)
    bh = min(h - by, bh + 2 * pad_y)

    # Check bounds
    if bw < 10 or bh < 10:
        return None

    xc = (bx + bw / 2.0) / w
    yc = (by + bh / 2.0) / h
    nw = bw / float(w)
    nh = bh / float(h)
    return round(xc, 6), round(yc, 6), round(nw, 6), round(nh, 6)

def prepare_dataset(output_dir: str = "datasets/unified-pcb-dataset"):
    print("=" * 70)
    print(" ECOINTEL UNIFIED DATASET SYNTHESIS")
    print("=" * 70)

    out_path = Path(output_dir).resolve()
    for split in ["train", "val", "test"]:
        (out_path / "images" / split).mkdir(parents=True, exist_ok=True)
        (out_path / "labels" / split).mkdir(parents=True, exist_ok=True)

    stats = {split: 0 for split in ["train", "val", "test"]}
    box_stats = {name: 0 for name in ECOINTEL_CLASSES}

    # -------------------------------------------------------------
    # 1. Process ElectroCom61 dataset
    # -------------------------------------------------------------
    ec61_base = Path(
        r"Dataset\ElectroCom61 A Multiclass Dataset for Detection of Electronic Components"
        r"\ElectroCom61 A Multiclass Dataset for Detection of Electronic Components\ElectroCom61"
    )
    if ec61_base.exists():
        print("[1/4] Processing ElectroCom61 multiclass annotations...")
        with open(ec61_base / "data.yaml") as f:
            ec61_yaml = yaml.safe_load(f)
        raw_names = ec61_yaml.get("names", [])
        
        # Build raw_id -> target_id map
        id_map = {}
        for raw_id, name in enumerate(raw_names):
            if name in ELECTROCOM61_TO_ECOINTEL:
                id_map[raw_id] = ELECTROCOM61_TO_ECOINTEL[name]

        for raw_split, target_split in [("train", "train"), ("valid", "val"), ("test", "test")]:
            img_dir = ec61_base / raw_split / "images"
            lbl_dir = ec61_base / raw_split / "labels"
            if not img_dir.exists():
                continue

            for img_file in img_dir.glob("*.jpg"):
                lbl_file = lbl_dir / f"{img_file.stem}.txt"
                if not lbl_file.exists():
                    continue

                valid_boxes = []
                with open(lbl_file, "r") as lf:
                    for line in lf:
                        parts = line.strip().split()
                        if len(parts) >= 5:
                            raw_cls = int(parts[0])
                            if raw_cls in id_map:
                                target_cls = id_map[raw_cls]
                                valid_boxes.append((target_cls, parts[1], parts[2], parts[3], parts[4]))
                                box_stats[ECOINTEL_CLASSES[target_cls]] += 1

                if valid_boxes:
                    dest_img = out_path / "images" / target_split / f"ec61_{img_file.name}"
                    dest_lbl = out_path / "labels" / target_split / f"ec61_{img_file.stem}.txt"
                    shutil.copy2(img_file, dest_img)
                    with open(dest_lbl, "w") as of:
                        for b in valid_boxes:
                            of.write(f"{b[0]} {b[1]} {b[2]} {b[3]} {b[4]}\n")
                    stats[target_split] += 1

        print(f"      Added ElectroCom61 images: {stats}")
    else:
        print("[1/4] Warning: ElectroCom61 path not found.")

    # -------------------------------------------------------------
    # 2. Incorporate existing verified PCB samples
    # -------------------------------------------------------------
    pcb_base = Path("datasets/pcb-components")
    if pcb_base.exists():
        print("[2/4] Incorporating verified PCB-components images...")
        for split in ["train", "val", "test"]:
            img_dir = pcb_base / "images" / split
            lbl_dir = pcb_base / "labels" / split
            if not img_dir.exists():
                continue
            for img_file in img_dir.glob("*.jpg"):
                lbl_file = lbl_dir / f"{img_file.stem}.txt"
                if lbl_file.exists():
                    dest_img = out_path / "images" / split / f"pcb_{img_file.name}"
                    dest_lbl = out_path / "labels" / split / f"pcb_{img_file.stem}.txt"
                    shutil.copy2(img_file, dest_img)
                    shutil.copy2(lbl_file, dest_lbl)
                    stats[split] += 1
                    with open(lbl_file, "r") as lf:
                        for line in lf:
                            parts = line.strip().split()
                            if parts:
                                c_id = int(parts[0])
                                if c_id < len(ECOINTEL_CLASSES):
                                    box_stats[ECOINTEL_CLASSES[c_id]] += 1
        print(f"      Cumulative count after PCB dataset: {stats}")

    # -------------------------------------------------------------
    # 3. Add isolated component samples (Resistors, LEDs, Sensors, Potentiometers)
    # -------------------------------------------------------------
    elec_base = Path(r"Dataset\archive (1)\electronics_dataset")
    if elec_base.exists():
        print("[3/4] Extracting accurate isolated component samples from archive (1)...")
        cat_mapping = {
            "resistor": 1,         # Resistor
            "led": 12,             # LED
            "potentiometer": 1,    # Resistor
            "push_button": 7,      # Connector
            "ultrasonic_sensor": 9 # Sensor
        }

        random.seed(42)
        for cat_name, cls_id in cat_mapping.items():
            train_cat_dir = elec_base / "train_set" / cat_name
            test_cat_dir = elec_base / "test_set" / cat_name
            
            all_files = []
            if train_cat_dir.exists():
                all_files.extend(list(train_cat_dir.glob("*.*")))
            if test_cat_dir.exists():
                all_files.extend(list(test_cat_dir.glob("*.*")))

            all_files = [f for f in all_files if f.suffix.lower() in [".jpg", ".jpeg", ".png"]]
            random.shuffle(all_files)

            # Take up to 60 samples per category
            selected = all_files[:60]
            for idx, f in enumerate(selected):
                bbox = extract_tight_foreground_bbox(str(f))
                if bbox is None:
                    continue

                # Train / val / test split: 70% / 15% / 15%
                if idx < int(len(selected) * 0.70):
                    split = "train"
                elif idx < int(len(selected) * 0.85):
                    split = "val"
                else:
                    split = "test"

                dest_stem = f"iso_{cat_name}_{idx:03d}"
                dest_img = out_path / "images" / split / f"{dest_stem}.jpg"
                dest_lbl = out_path / "labels" / split / f"{dest_stem}.txt"

                # Standardize to JPEG RGB
                img = cv2.imread(str(f))
                if img is not None:
                    cv2.imwrite(str(dest_img), img)
                    with open(dest_lbl, "w") as of:
                        of.write(f"{cls_id} {bbox[0]} {bbox[1]} {bbox[2]} {bbox[3]}\n")
                    stats[split] += 1
                    box_stats[ECOINTEL_CLASSES[cls_id]] += 1

        print(f"      Cumulative count after isolated components: {stats}")

    # -------------------------------------------------------------
    # 4. Supplement underrepresented classes from archive/images
    # -------------------------------------------------------------
    arch_base = Path(r"Dataset\archive\images")
    if arch_base.exists():
        print("[4/5] Supplementing underrepresented classes from archive/images...")
        arch_mapping = {
            "Electrolytic-capacitor": 2, # Capacitor
            "Bypass-capacitor": 2,       # Capacitor
            "semiconductor-diode": 3,    # Diode
            "junction-transistor": 4,    # Transistor
            "transistor": 4,             # Transistor
            "induction-coil": 6,         # Inductor
            "electric-relay": 10,        # Relay
            "cartridge-fuse": 13,        # Fuse
        }

        random.seed(42)
        for folder_name, cls_id in arch_mapping.items():
            f_dir = arch_base / folder_name
            if not f_dir.exists():
                continue
            candidates = [f for f in f_dir.glob("*.jpg") if f.is_file()]
            random.shuffle(candidates)
            selected = candidates[:40]

            for idx, f in enumerate(selected):
                bbox = extract_tight_foreground_bbox(str(f))
                if bbox is None:
                    continue

                if idx < int(len(selected) * 0.70):
                    split = "train"
                elif idx < int(len(selected) * 0.85):
                    split = "val"
                else:
                    split = "test"

                dest_stem = f"arch_{folder_name}_{idx:03d}"
                dest_img = out_path / "images" / split / f"{dest_stem}.jpg"
                dest_lbl = out_path / "labels" / split / f"{dest_stem}.txt"

                img = cv2.imread(str(f))
                if img is not None:
                    cv2.imwrite(str(dest_img), img)
                    with open(dest_lbl, "w") as of:
                        of.write(f"{cls_id} {bbox[0]} {bbox[1]} {bbox[2]} {bbox[3]}\n")
                    stats[split] += 1
                    box_stats[ECOINTEL_CLASSES[cls_id]] += 1

        print(f"      Cumulative count after archive supplementation: {stats}")

    # -------------------------------------------------------------
    # 5. Add defect / contamination samples from ECF-Dataset
    # -------------------------------------------------------------
    ecf_base = Path(r"Dataset\ECF-Dataset\ECF-Dataset")
    if ecf_base.exists():
        print("[4/4] Sampling surface defect & contamination images from ECF-Dataset...")
        defect_folders = ["1.scratch", "4.dirt", "5.particle"]
        ecf_files = []
        for df in defect_folders:
            df_path = ecf_base / df
            if df_path.exists():
                for sub in df_path.iterdir():
                    if sub.is_dir():
                        ecf_files.extend(list(sub.glob("*.jpg")) + list(sub.glob("*.png")))

        random.shuffle(ecf_files)
        # Select 40 real contamination/defect samples
        for idx, f in enumerate(ecf_files[:40]):
            img = cv2.imread(str(f))
            if img is None:
                continue
            h, w = img.shape[:2]
            split = "train" if idx < 28 else ("val" if idx < 34 else "test")
            dest_stem = f"ecf_dust_{idx:03d}"
            dest_img = out_path / "images" / split / f"{dest_stem}.jpg"
            dest_lbl = out_path / "labels" / split / f"{dest_stem}.txt"

            cv2.imwrite(str(dest_img), img)
            # Center dust/defect region annotation
            with open(dest_lbl, "w") as of:
                of.write(f"15 0.500000 0.500000 0.600000 0.600000\n")
            stats[split] += 1
            box_stats["Dust_Contamination"] += 1

        print(f"      Final cumulative count: {stats}")

    # -------------------------------------------------------------
    # Generate data.yaml
    # -------------------------------------------------------------
    yaml_data = {
        "path": str(out_path).replace("\\", "/"),
        "train": "images/train",
        "val": "images/val",
        "test": "images/test",
        "nc": len(ECOINTEL_CLASSES),
        "names": {i: name for i, name in enumerate(ECOINTEL_CLASSES)},
    }

    yaml_file = out_path / "data.yaml"
    with open(yaml_file, "w") as yf:
        yaml.dump(yaml_data, yf, default_flow_style=False, sort_keys=False)

    print("\n" + "=" * 70)
    print(" DATASET SUMMARY")
    print(f" Total Train Images : {stats['train']}")
    print(f" Total Val Images   : {stats['val']}")
    print(f" Total Test Images  : {stats['test']}")
    print(f" Total Images       : {sum(stats.values())}")
    print(" Bounding Boxes per Class:")
    for name, cnt in box_stats.items():
        if cnt > 0:
            print(f"   - {name:<20}: {cnt}")
    print(f" YAML Configuration : {yaml_file}")
    print("=" * 70)

if __name__ == "__main__":
    prepare_dataset()
