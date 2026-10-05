# EcoIntel Phase 3 — PCB Intelligence, Topology & Reconstruction Engine

## 1. Overview & Objective
EcoIntel Phase 3 elevates raw component bounding-box detection into a structured, physical, and topological understanding of printed circuit boards. It analyzes board boundary geometry, visible copper traces, component solder pads, through-hole and surface vias, component-trace connectivity associations, visual physical damage, and generates a structured topological reconstruction estimate.

```
PCB Image
    ↓
YOLO Component Detection
    ↓
Board Geometry & Boundary Extraction
    ↓
Visible Copper Trace Detection
    ↓
Pad & Via Detection
    ↓
Component-Trace Proximity Association
    ↓
Topology Graph Construction
    ↓
Damage Anomaly Analysis
    ↓
Reconstruction Estimation & Classification
    ↓
Interactive 2D & 3D PCB Intelligence Visualizer
    ↓
RUL Stage Queued (Phase 4 Ready)
```

---

## 2. Scientific Honesty & Provenance Classification
A standard optical RGB photograph can only inspect top surface copper and silkscreen layers. It cannot observe internal power or ground copper planes, buried blind vias, or traces running beneath large BGA / QFP integrated circuits without computed tomography (X-ray) or destructive physical cross-sectioning. 

To maintain scientific integrity for research and industrial circular electronics applications, every object in Phase 3 carries an explicit provenance tag:

| Classification | Meaning | Example |
| :--- | :--- | :--- |
| **`DETECTED`** | Directly observed in optical pixel data via computer vision / YOLO | Top copper trace, IC package bounding box, burn mark |
| **`INFERRED`** | Deducted from adjacent topology or severed trace endpoints | Severed copper repair jumper path, unobserved trace under solder mask |
| **`ESTIMATED`** | Approximated from geometric heuristics or known package taxonomy | Board physical dimensions (when calibrated reference exists), component height |
| **`RECONSTRUCTED`**| Synthesized circuit layout netlist graph | Multi-node net connection graph |
| **`SIMULATED`** | Synthesized degradation or stress response curves | Thermal Arrhenius stress predictions (Phase 4) |

> [!IMPORTANT]
> Visual trace continuity does NOT confirm electrical conductivity. All health metrics in Phase 3 are strictly designated as **Visual Integrity Estimate** and **Reconstruction Confidence**, never claimed as factory electrical test netlists.

---

## 3. Provider Architecture
Phase 3 implements an extensible provider interface (`PCBProvider`) allowing seamless routing between local deterministic datasets, OpenCV optical vision models, and future CAD/CAM formats:

```
                      PCBAnalysisService
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
 MockPCBProvider       VisionPCBProvider    GerberPCBProvider (Future)
 (Deterministic)       (OpenCV + FastAPI)   CADPCBProvider (Future)
                                            XRayPCBProvider (Future)
```

Configuration via environment variables:
```bash
PCB_PROVIDER=vision  # or 'mock'
AI_SERVICE_URL=http://localhost:8001
AI_SERVICE_API_KEY=eco-intel-internal-ai-key-2026
PCB_VISION_CONFIDENCE=0.4
```

---

## 4. Database Schema: `PCBAnalysis`
Collection: `pcbanalyses`

```typescript
{
  analysisId: string;
  provider: "MOCK" | "VISION" | "GERBER" | "CAD" | "XRAY";
  modelName: string;
  modelVersion: string;
  status: "COMPLETED" | "PARTIAL" | "FAILED" | "PCB_ANALYSIS_UNAVAILABLE";

  board: {
    widthPixels: number;
    heightPixels: number;
    aspectRatio: number;
    polygon: [{ x: number, y: number }];
    estimatedPhysicalWidthMm: number | null;
    estimatedPhysicalHeightMm: number | null;
    physicalDimensionsAvailable: boolean;
    confidence: number;
  };

  layers: {
    estimatedCount: number;
    confidence: number;
    method: string;
    notes: string;
  };

  components: [{
    componentId: string;
    type: string;
    name: string;
    confidence: number;
    connectedTraceIds: string[];
    connectedPadIds: string[];
    source: "DETECTED";
  }];

  traces: [{
    traceId: string;
    points: [{ x: number, y: number }];
    widthPixels: number;
    confidence: number;
    layer: "VISIBLE_TOP";
    status: "DETECTED" | "INFERRED";
    source: "DETECTED" | "INFERRED";
  }];

  pads: [{
    padId: string;
    componentId?: string;
    position: { x: number, y: number };
    shape: "RECTANGULAR" | "CIRCULAR";
    confidence: number;
    source: "DETECTED";
  }];

  vias: [{
    viaId: string;
    position: { x: number, y: number };
    type: "VISIBLE_VIA" | "POSSIBLE_VIA" | "MOUNTING_HOLE";
    confidence: number;
    source: "DETECTED" | "INFERRED";
  }];

  damagedRegions: [{
    damageId: string;
    type: "burn_mark" | "corrosion" | "crack" | "scratched_trace" | "lifted_pad" | "broken_trace";
    boundingBox: { x: number, y: number, width: number, height: number };
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    confidence: number;
    visualEvidence: string;
    affectedComponentIds: string[];
    affectedTraceIds: string[];
    status: "UNRESOLVED" | "REPAIRED";
  }];

  topology: {
    nodes: [{ id: string, label: string, type: "COMPONENT" | "PAD" | "VIA" }];
    edges: [{ source: string, target: string, type: "VISIBLE_TRACE" | "PAD_CONNECTION" | "INFERRED_CONNECTION", confidence: number }];
    nodesCount: number;
    edgesCount: number;
    netlistPreview: string;
  };

  reconstruction: {
    boardGeometry: object;
    components: array;
    traces: array;
    inferredTraces: array;
    overallReconstructionConfidence: number;
    visualIntegrityEstimate: number;
    confidenceBreakdown: {
      componentConfidence: number;
      traceConfidence: number;
      topologyConfidence: number;
      damageConfidence: number;
      imageQuality: number;
    };
    limitations: string[];
  };

  metrics: {
    componentsDetected: number;
    visibleTraces: number;
    padsDetected: number;
    viasDetected: number;
    potentialConnections: number;
    damageRegionsCount: number;
    visualIntegrityScore: number;
    topologyConfidence: number;
  };
}
```

---

## 5. REST API Endpoints
All responses conform to the standard structure `{ success: boolean, data?: any, error?: { code, message } }`:

- `POST /api/reconstruction` — Enqueues or re-triggers PCB analysis for an `analysisId`.
- `GET /api/analysis/:analysisId/pcb` — Complete PCB analysis document, metrics, and reconstruction metadata.
- `GET /api/analysis/:analysisId/topology` — Topology nodes, edges, connectivity types, and netlist representation.
- `GET /api/analysis/:analysisId/traces` — Visible copper traces, polyline points, pads, and vias.
- `GET /api/analysis/:analysisId/damage` — Visual anomalies, burn marks, corrosion regions, severity, and integrity penalty.
- `GET /api/analysis/:analysisId/reconstruction` — Full reconstructed board model, inferred traces, confidence breakdown, and scientific limitations.

---

## 6. BullMQ Asynchronous Pipeline
- **Queue**: `pcb-queue` (`src/queues/pcb.queue.ts`)
- **Worker**: `pcb-worker` (`src/queues/pcb.worker.ts`)
- **Idempotency Key**: `${analysisId}-pcb-analysis`
- **State Transition**:
  - `status: "PCB_ANALYSIS_PROCESSING"`
  - `status: "PCB_COMPLETE"`
  - `currentStage: "RUL"` (RUL is queued for Phase 4, NOT prematurely completed).
- **Audit Logs Recorded**:
  - `PCB_ANALYSIS_STARTED`
  - `PCB_GEOMETRY_DETECTED`
  - `TRACE_ANALYSIS_COMPLETED`
  - `TOPOLOGY_GENERATED`
  - `DAMAGE_ANALYSIS_COMPLETED`
  - `RECONSTRUCTION_COMPLETED`
  - `PCB_ANALYSIS_FAILED`

---

## 7. Interactive 2D & 3D Workspace
The frontend at `/console/results?tab=pcb` renders `PcbIntelligenceWorkspace.tsx`:
1. **Original View**: High-resolution optical scan with zoom, pan, and coordinate tracking.
2. **Detected View**: Component bounding boxes with confidence levels and pin density.
3. **Topology View**: Node-edge interactive graph with filters for visible traces, inferred connections, and confidence thresholds.
4. **Reconstruction View**: Reconstructed substrate with inferred missing trace paths and split comparison slider.
5. **Damage View**: Anomaly detector highlighting burn marks and corrosion with severity ratings.
6. **3D Digital Twin**: WebGL spatial reconstruction with real trace tubes, component package extrusions, and substrate layers.
7. **Export Options**: Structured export as JSON, CSV, SVG, and netlist reconstruction package.
