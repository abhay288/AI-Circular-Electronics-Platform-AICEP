# EcoIntel Material Recovery Intelligence & Precious Metal Estimation Engine

## Overview & Scientific Foundation

Phase 5 introduces **Material Recovery Intelligence** to the EcoIntel circular electronics platform. The objective of this engine is to estimate recoverable base metals, precious metals, and critical raw materials from printed circuit boards (PCBs) and electronic components without fabricating laboratory measurements.

> **CRITICAL SCIENTIFIC PRINCIPLE:**
> Normal RGB computer vision imagery can reliably identify component types, packages, connectors, exposed plating, component density, and board geometry. **RGB imagery cannot directly measure chemical concentrations or parts-per-million (ppm) alloy purities.**
>
> Therefore, **EcoIntel's material recovery estimates are not a substitute for laboratory assay, XRF (X-ray Fluorescence), ICP-OES (Inductively Coupled Plasma Optical Emission Spectrometry), manufacturer certified composition data, or physical industrial recovery testing.**

---

## 1. Material Taxonomy & Categories

EcoIntel classifies recoverable materials into four canonical categories:

| Category | Supported Elements | Common Electronic Applications |
| :--- | :--- | :--- |
| **Precious Metals** | Gold (`Au`), Silver (`Ag`), Palladium (`Pd`), Platinum (`Pt`) | Connector pin mating surfaces, thermosonic wire bonds, conductive epoxy die attach, MLCC electrode layers |
| **Base Metals** | Copper (`Cu`), Aluminum (`Al`), Tin (`Sn`), Nickel (`Ni`), Iron (`Fe`), Zinc (`Zn`), Lead (`Pb`) | Substrate ground/power planes, component leadframes, heatsinks, electrolytic canisters, solder joints (SAC305/SnPb), shielding cans |
| **Critical Raw Materials** | Tantalum (`Ta`), Cobalt (`Co`), Lithium (`Li`), Neodymium (`Nd`) | Porous tantalum capacitor pellets, rechargeable backup coin cells, speaker/motor magnets |
| **Other Materials** | Silicon (`Si`), Fiberglass/Epoxy (FR-4) | IC dies, structural substrate |

---

## 2. Mass Estimation Priority Hierarchy

Material recovery calculations require a solid mass basis ($m_{\text{board}}$). EcoIntel enforces a strict 5-tier priority hierarchy:

```
MEASURED  (Actual scale weight in grams, e.g., user entered or IoT bench scale)
   ↓
KNOWN     (Documented manufacturer product weight)
   ↓
DATASHEET (Summed component package weights from manufacturer datasheets)
   ↓
DATABASE  (Substrate volume [area × thickness × FR-4 density] + component database weights)
   ↓
ESTIMATED (Rough optical bounding box and component density heuristics)
```

Every record stores:
- `massValue`: Numerical mass in grams
- `massUnit`: `"g"` | `"kg"` | `"mg"`
- `massSource`: `"MEASURED"` | `"KNOWN"` | `"DATASHEET"` | `"DATABASE"` | `"ESTIMATED"`
- `massConfidence`: Floating point score from 0.0 to 1.0

---

## 3. Component-to-Material Composition Database

Electronic composition is modeled as a statistical range `[minFraction, typicalFraction, maxFraction]` based on published metallurgical and WEEE recovery literature:

### Literature & Benchmark Citations
1. **UNEP E-Waste Metallurgy (2023):** Characterization of printed circuit boards and connector pin gold plating thicknesses.
2. **IPC-4101 Standard:** Base materials for rigid and multilayer printed boards ($1\text{ oz/ft}^2 = 305\text{ g/m}^2 = 0.0305\text{ g/cm}^2$ per copper foil layer).
3. **European Journal of Mineral Processing:** Precious metal recovery from multi-layer ceramic capacitors (MLCCs).
4. **Critical Raw Materials Alliance (CRM):** Tantalum recycling yields from spent consumer and industrial electronics.
5. **JEDEC Packaging Standards:** Leadframe metallurgy (C194 copper-iron alloys) and thermosonic bond wire diameters ($25\ \mu\text{m}$).

### Selected Component Composition Benchmarks

| Component Type | Matched Packages | Key Recoverable Materials | Typical Mass Fraction |
| :--- | :--- | :--- | :--- |
| **Connector** | RJ45, USB, Header, Terminal | Copper (78%), Nickel (2.8%), Gold (0.045%), Tin (3.5%), Iron (5.0%) | 2.5 g |
| **Integrated Circuit (IC)** | BGA, QFP, SOIC, DIP, QFN | Copper (34%), Gold (0.042%), Silver (0.11%), Tin (4.5%) | 1.8 g |
| **Ceramic MLCC** | 0805, 0603, 1206 SMD | Silver (1.8%), Palladium (0.35%), Nickel (4.2%), Tin (3.0%), Copper (2.5%) | 0.04 g |
| **Electrolytic Canister** | Radial Can, Axial | Aluminum (44%), Tin (1.8%), Iron (4.5%) | 3.2 g |
| **Tantalum Capacitor** | SMD Case A/B/C/D | Tantalum (31%), Silver (0.6%), Nickel (3.5%) | 0.22 g |
| **Inductor / Choke** | Toroid, SMD Inductor | Copper (52%), Ferrite/Iron (38%) | 4.5 g |
| **PCB Substrate (FR-4)** | Multi-layer 1.6mm board | Copper Foil (0.0305 g/cm² · layer · 55% coverage), ENIG Gold flash (0.015 mg/cm²) | Area × 0.296 g/cm² |

---

## 4. Multi-Scenario Recovery Model

EcoIntel strictly separates **Material Present** from **Material Recoverable**. The platform supports three empirical scenarios representing different downstream processing routes:

| Scenario | Operational Process | Average Efficiency | Key Characteristics |
| :--- | :--- | :---: | :--- |
| **Conservative** | Bulk mechanical shredding + pyrometallurgical smelting | **~70%** | Higher slag losses, lower fine metal capture, unselective smelting |
| **Typical** | Automated component desoldering + closed-loop hydrometallurgical leaching | **~85%** | Industry standard commercial hydrometallurgical recovery with acid leaching |
| **Optimistic** | Robotic selective disassembly + concentrated pin stripping + bioleaching | **~94%** | Clean-tech pilot recovery with minimal tailing losses |

---

## 5. Evidence & Provenance Model

Every material prediction is stamped with an explicit evidence level:

- `MEASURED`: Confirmed via physical scale or direct spectrometry.
- `KNOWN`: Sourced from certified OEM documentation.
- `DATABASE_DERIVED`: Extrapolated from the EcoIntel Component Composition Knowledge Base.
- `ESTIMATED`: Calculated from optical bounding boxes and standard area density.
- `INFERRED`: Derived from neighboring topology and board classification.
- `SIMULATED`: Benchmark synthetic values for demo boards.
- `UNKNOWN`: Insufficient evidence to derive composition.

---

## 6. Circular Component Prioritization

Components are tagged with a Circular Recovery Priority:
- **`HIGH` Priority**: Components with high value density (e.g., gold-flashed connectors, BGA microprocessors, large copper toroidal inductors). Recommended for selective desoldering.
- **`MEDIUM` Priority**: Ceramic MLCC arrays (Palladium/Silver), Tantalum capacitors, discrete power transistors.
- **`LOW` Priority**: Low-value discrete chip resistors and bypass capacitors where chemical recovery is only viable in bulk shredding.

Components with `HIGH` and `MEDIUM` priority are automatically marked as `marketplaceEligible: true` for the circular marketplace.

---

## 7. Architecture & REST APIs

### Background BullMQ Queue Workflow
```
RUL_COMPLETE
    ↓
MATERIALS_QUEUED (Idempotency Key: ${analysisId}-material-analysis)
    ↓
BullMQ: material-analysis queue
    ↓
material.worker.ts (runMaterialWorkerJob)
    ↓
Load DetectionResult + Component records + PCBAnalysis
    ↓
materialRecoveryService.estimate()
    ↓
Persist MaterialRecovery in MongoDB
    ↓
Update Component.materialProfile & recoveryPriority
    ↓
Update AnalysisSession (status: MATERIAL_COMPLETE, currentStage: REPAIR)
    ↓
AuditLog: MATERIAL_ANALYSIS_COMPLETED
```

### Endpoints
- `POST /api/materials/analyze`: Trigger material recovery estimation.
- `GET /api/materials/:analysisId`: Retrieve complete `MaterialRecovery` record.
- `GET /api/materials/:analysisId/summary`: High-level summary metrics.
- `GET /api/materials/:analysisId/precious-metals`: Granular precious metals analysis.
- `GET /api/materials/:analysisId/components`: Component-level material contributions with priority filters.
- `GET /api/materials/:analysisId/sources`: Attributions, literature citations, and limitations.
- `GET /api/materials/:analysisId/scenarios`: Scenario parameter models.
- `GET /api/materials/:analysisId/model-info`: Provider methodology and disclaimers.

---

## 8. Future Integration Interfaces

EcoIntel defines extensible contracts for Phase 6+ and industrial integrations:
- `XRFMaterialProvider`: For portable and inline benchtop X-ray Fluorescence spectrometers.
- `CommodityPriceProvider`: For real-time London Metal Exchange (LME) and LBMA price feed ingestion.
- `BOMMaterialProvider`: For IPC-1752A / IEC 62474 material declaration XML/BOM parsing.
- `LabAssayMaterialProvider`: For physical fire assay certificate verification.
