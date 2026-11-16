# EcoIntel Platform Data Model & Graph

Detailed specification of the unified entity relational structure and lifecycle graph across all ten phases.

---

## 1. Enterprise Platform Lifecycle Graph

```
                               ┌───────────────────┐
                               │  AnalysisSession  │
                               └─────────┬─────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 │                       │                       │
      ┌──────────▼──────────┐ ┌──────────▼──────────┐ ┌──────────▼──────────┐
      │   DetectionResult   │ │     PCBAnalysis     │ │    RULPrediction    │
      └──────────┬──────────┘ └─────────────────────┘ └─────────────────────┘
                 │
      ┌──────────▼──────────┐
      │     Components      │
      └─────────────────────┘
                 │
                 ├───────────────────────┬───────────────────────┐
                 │                       │                       │
      ┌──────────▼──────────┐ ┌──────────▼──────────┐ ┌──────────▼──────────┐
      │  MaterialRecovery   │ │  RepairAssessment   │ │   DigitalPassport   │
      └─────────────────────┘ └──────────┬──────────┘ └──────────┬──────────┘
                                         │                       │
                              ┌──────────▼──────────┐ ┌──────────▼──────────┐
                              │ MarketplaceListing  │ │   PassportEvent     │
                              └──────────┬──────────┘ └─────────────────────┘
                                         │
                              ┌──────────▼──────────┐
                              │  CarbonImpact (ESG) │
                              └──────────┬──────────┘
                                         │
                              ┌──────────▼──────────┐
                              │    Report Dossier   │
                              └─────────────────────┘
```

---

## 2. Core Entity Schemas

### 2.1 `AnalysisSession`
Root entity representing an optical or technical inspection lifecycle.
- `analysisId`: Unique system identifier (`ANL-...`).
- `organizationId`: Owning tenant identifier.
- `status`: `PENDING`, `PROCESSING`, `ANALYZED`, `FAILED`, `COMPLETED`.
- `metadata`: Device model, serial number, manufacturer, date of manufacture, input image URLs.

### 2.2 `DetectionResult` & `Component`
- `detectionId`: Unique identifier (`DET-...`).
- `analysisId`: Foreign key to `AnalysisSession`.
- `totalDetected`: Total identified electronic parts.
- `components`: Array of localized components with bounding boxes (`x`, `y`, `width`, `height`), confidence (`0.0–1.0`), class (`IC`, `Capacitor`, `Resistor`, `MOSFET`, `Connector`), and physical dimensions.

### 2.3 `PCBAnalysis`
- `pcbId`: Unique identifier (`PCB-...`).
- `analysisId`: Foreign key to `AnalysisSession`.
- `boardDimensions`: Width, length, thickness, layer count.
- `topology`: Traces, vias, test pads, detected defects (burn marks, corrosion, trace fractures).
- `reconstructionConfidence`: Reconstruction quality metric.

### 2.4 `RULPrediction`
- `predictionId`: Unique identifier (`RUL-...`).
- `analysisId`: Foreign key to `AnalysisSession`.
- `healthScore`: Visual & structural health index (`0–100`).
- `rulYears`: Remaining useful life estimate in operational years.
- `confidenceInterval`: Lower and upper bounds (`minYears`, `maxYears`).
- `contributingFactors`: Thermal wear, mechanical stress, cycle count.

### 2.5 `MaterialRecovery`
- `recoveryId`: Unique identifier (`MAT-...`).
- `analysisId`: Foreign key to `AnalysisSession`.
- `boardMass`: Estimated board mass in grams.
- `materials`: Array of detected metals & alloys (`Gold`, `Silver`, `Copper`, `Palladium`, `Tantalum`).
- `totalRecoverableValueUsd`: Real-time commodity market recovery value.

### 2.6 `RepairAssessment`
- `repairId`: Unique identifier (`REP-...`).
- `analysisId`: Foreign key to `AnalysisSession`.
- `circularityDecision`: `REPAIR`, `REUSE`, `REFURBISH`, `HARVEST`, `RECYCLE`.
- `repairRecommendations`: Step-by-step guidance, required tooling, replacement component recommendations.

### 2.7 `DigitalPassport` & `PassportEvent`
- `passportId`: Unique tamper-evident passport ID (`DPP-...`).
- `assetId`: Physical serial or board identifier.
- `blockchain`: Network name, contract address, token ID, transaction hash.
- `status`: `ACTIVE`, `TRANSFERRED`, `REPAIRED`, `RECYCLED`.
- `events`: Array of cryptographic lifecycle milestones (`CREATED`, `INSPECTED`, `REPAIRED`, `LISTED`, `SOLD`).

### 2.8 `MarketplaceListing` & `MarketplaceTransaction`
- `listingId`: Listing identifier (`LST-...`).
- `sellerOrganizationId`: Selling tenant.
- `componentType`, `quantity`, `pricePerUnit`, `currency`.
- `status`: `ACTIVE`, `PENDING_ESCROW`, `COMPLETED`, `CANCELLED`.

### 2.9 `CarbonImpact`
- `impactId`: Impact record identifier (`CARB-...`).
- `analysisId`: Foreign key to `AnalysisSession`.
- `potentialAvoidedCo2eKg`: Gross emissions avoided if fully reused/repaired.
- `realizedAvoidedCo2eKg`: Net emissions avoided post-verified lifecycle transition.
- `methodology`: LCA standard applied (`GHG_PROTOCOL_SCOPE_3`, `ISO_14044`).

### 2.10 `Report` & `ReportShare`
- `reportId`: Unique identifier (`REP-...-vX-...`).
- `analysisId`: Foreign key to `AnalysisSession`.
- `reportType`: `ASSET`, `TECHNICAL`, `CIRCULARITY`, `ENVIRONMENTAL`, `EXECUTIVE`.
- `version`: Monotonically incrementing integer (`1`, `2`, `3`...).
- `status`: `DRAFT`, `GENERATING`, `READY`, `FAILED`, `ARCHIVED`.
- `completeness`: Percentage (`0–100%`).
- `sections`: Structured array of domain dossiers with `evidenceLevel`.
- `branding`: Company name, logo, custom notes.
- `isDemo`: Boolean indicating whether synthetic data was ingested.
