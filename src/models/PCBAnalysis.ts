import mongoose, { Schema, Model } from "mongoose";

export interface IPCBPoint {
  x: number;
  y: number;
}

export interface IPCBTrace {
  traceId: string;
  points: IPCBPoint[];
  widthPixels: number;
  confidence: number;
  layer: "VISIBLE_TOP";
  status: "DETECTED" | "INFERRED";
  source: "DETECTED" | "INFERRED";
  connectedComponentIds?: string[];
  lengthEstimate?: number;
}

export interface IPCBPad {
  padId: string;
  componentId?: string;
  position: IPCBPoint;
  shape: "RECTANGULAR" | "CIRCULAR";
  size: { width: number; height: number };
  confidence: number;
  source: "DETECTED" | "INFERRED";
}

export interface IPCBDamage {
  damageId: string;
  type:
    | "burn_mark"
    | "corrosion"
    | "crack"
    | "scratched_trace"
    | "lifted_pad"
    | "broken_trace"
    | "discoloration"
    | "physical_damage";
  boundingBox: { x: number; y: number; width: number; height: number };
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  visualEvidence: string;
  affectedComponentIds?: string[];
  affectedTraceIds?: string[];
  status: "UNRESOLVED" | "REPAIRED";
  source: "DETECTED";
}

export interface IPCBVia {
  viaId: string;
  position: IPCBPoint;
  type: "VISIBLE_VIA" | "POSSIBLE_VIA" | "MOUNTING_HOLE";
  diameterPixels: number;
  confidence: number;
  source: "DETECTED" | "INFERRED";
}

export interface ITopologyNode {
  id: string;
  label: string;
  type: "COMPONENT" | "PAD" | "VIA" | "ENDPOINT";
  position?: IPCBPoint;
}

export interface ITopologyEdge {
  source: string;
  target: string;
  type: "VISIBLE_TRACE" | "PAD_CONNECTION" | "PROBABLE_CONNECTION" | "INFERRED_CONNECTION";
  confidence: number;
  traceId?: string;
}

export interface IPCBAnalysis {
  analysisId: string;
  provider: "MOCK" | "VISION" | "GERBER" | "CAD" | "XRAY" | "OPENCV" | "GGNT";
  modelName: string;
  modelVersion: string;
  status: "COMPLETED" | "PARTIAL" | "FAILED" | "RECONSTRUCTED";

  board: {
    widthPixels: number;
    heightPixels: number;
    aspectRatio: number;
    polygon?: IPCBPoint[];
    estimatedPhysicalWidthMm?: number | null;
    estimatedPhysicalHeightMm?: number | null;
    physicalDimensionsAvailable: boolean;
    confidence: number;
  };

  layers: {
    estimatedCount: number;
    confidence: number;
    method: string;
    notes: string;
  };

  components: Array<{
    componentId: string;
    type: string;
    name?: string;
    confidence: number;
    connectedTraceIds: string[];
    connectedPadIds: string[];
    source: "DETECTED";
  }>;

  traces: IPCBTrace[];
  pads: IPCBPad[];
  vias: IPCBVia[];
  damagedRegions: IPCBDamage[];

  topology: {
    nodes: ITopologyNode[];
    edges: ITopologyEdge[];
    nodesCount: number;
    edgesCount: number;
    netlistPreview?: string;
  };

  reconstruction: {
    boardGeometry?: any;
    components?: any[];
    traces?: any[];
    pads?: any[];
    vias?: any[];
    inferredTraces?: any[];
    confidence: number;
    overallReconstructionConfidence: number;
    confidenceBreakdown: {
      componentConfidence: number;
      traceConfidence: number;
      topologyConfidence: number;
      damageConfidence: number;
      imageQuality: number;
    };
    visualIntegrityEstimate: number;
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

  warnings: string[];

  // Legacy field aliases for UI backwards compatibility
  boardType?: string;
  layerCount?: number;
  traceCount?: number;
  componentCount?: number;
  traceContinuity?: number;
  boardIntegrity?: number;
  reconstructedRegions?: Array<{ region: string; repairedTraces: number; confidence: number }>;
  schematics?: {
    kicadFileUrl?: string;
    gerberZipUrl?: string;
    netlistRaw?: string;
  };

  createdAt?: Date;
  updatedAt?: Date;
}

const PCBAnalysisSchema = new Schema<IPCBAnalysis>(
  {
    analysisId: { type: String, required: true, unique: true, index: true },
    provider: {
      type: String,
      enum: ["MOCK", "VISION", "GERBER", "CAD", "XRAY", "OPENCV", "GGNT"],
      default: "MOCK",
      index: true,
    },
    modelName: { type: String, default: "EcoIntel-PCB-Topology-Engine" },
    modelVersion: { type: String, default: "v1.0.0" },
    status: {
      type: String,
      enum: ["COMPLETED", "PARTIAL", "FAILED", "RECONSTRUCTED"],
      default: "COMPLETED",
      index: true,
    },

    board: {
      widthPixels: { type: Number, default: 1920 },
      heightPixels: { type: Number, default: 1080 },
      aspectRatio: { type: Number, default: 1.77 },
      polygon: { type: Schema.Types.Mixed, default: [] },
      estimatedPhysicalWidthMm: { type: Number, default: null },
      estimatedPhysicalHeightMm: { type: Number, default: null },
      physicalDimensionsAvailable: { type: Boolean, default: false },
      confidence: { type: Number, default: 0.92 },
    },

    layers: {
      estimatedCount: { type: Number, default: 2 },
      confidence: { type: Number, default: 0.75 },
      method: { type: String, default: "Visual single-side surface inspection" },
      notes: {
        type: String,
        default:
          "Single-side surface optical analysis. Multilayer internal substrate planes cannot be determined from optical photography.",
      },
    },

    components: { type: Schema.Types.Mixed, default: [] },
    traces: { type: Schema.Types.Mixed, default: [] },
    pads: { type: Schema.Types.Mixed, default: [] },
    vias: { type: Schema.Types.Mixed, default: [] },
    damagedRegions: { type: Schema.Types.Mixed, default: [] },

    topology: {
      nodes: { type: Schema.Types.Mixed, default: [] },
      edges: { type: Schema.Types.Mixed, default: [] },
      nodesCount: { type: Number, default: 0 },
      edgesCount: { type: Number, default: 0 },
      netlistPreview: { type: String, default: "" },
    },

    reconstruction: {
      boardGeometry: { type: Schema.Types.Mixed, default: {} },
      components: { type: Schema.Types.Mixed, default: [] },
      traces: { type: Schema.Types.Mixed, default: [] },
      pads: { type: Schema.Types.Mixed, default: [] },
      vias: { type: Schema.Types.Mixed, default: [] },
      inferredTraces: { type: Schema.Types.Mixed, default: [] },
      confidence: { type: Number, default: 0.88 },
      overallReconstructionConfidence: { type: Number, default: 85 },
      confidenceBreakdown: {
        type: Schema.Types.Mixed,
        default: {
          componentConfidence: 94,
          traceConfidence: 86,
          topologyConfidence: 82,
          damageConfidence: 90,
          imageQuality: 92,
        },
      },
      visualIntegrityEstimate: { type: Number, default: 91 },
      limitations: {
        type: [String],
        default: [
          "Single-side optical imaging cannot observe buried inner layers (e.g. power & ground planes).",
          "Traces running under large BGA / QFP packages are visually occluded and treated as inferred.",
          "Visual trace continuity does not substitute for four-wire Kelvin electrical continuity testing.",
        ],
      },
    },

    metrics: {
      componentsDetected: { type: Number, default: 0 },
      visibleTraces: { type: Number, default: 0 },
      padsDetected: { type: Number, default: 0 },
      viasDetected: { type: Number, default: 0 },
      potentialConnections: { type: Number, default: 0 },
      damageRegionsCount: { type: Number, default: 0 },
      visualIntegrityScore: { type: Number, default: 90 },
      topologyConfidence: { type: Number, default: 85 },
    },

    warnings: { type: [String], default: [] },

    // Legacy compatibility fields
    boardType: { type: String, default: "Multi-layer FR-4 Substrate" },
    layerCount: { type: Number, default: 4 },
    traceCount: { type: Number, default: 184 },
    componentCount: { type: Number, default: 24 },
    traceContinuity: { type: Number, default: 94.5 },
    boardIntegrity: { type: Number, default: 92.0 },
    reconstructedRegions: { type: Schema.Types.Mixed, default: [] },
    schematics: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

PCBAnalysisSchema.index({ analysisId: 1, status: 1 });
PCBAnalysisSchema.index({ analysisId: 1, provider: 1 });
PCBAnalysisSchema.index({ createdAt: -1 });

export const PCBAnalysis: Model<IPCBAnalysis> =
  mongoose.models.PCBAnalysis ||
  mongoose.model<IPCBAnalysis>("PCBAnalysis", PCBAnalysisSchema);

export default PCBAnalysis;
