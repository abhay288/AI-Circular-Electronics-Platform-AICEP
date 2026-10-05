import { SAMPLE_DATASETS } from "@/lib/data/sampleDatasets";
import { IPCBAnalysis, IPCBTrace, IPCBPad, IPCBVia, IPCBDamage, ITopologyNode, ITopologyEdge } from "@/models/PCBAnalysis";

export interface PCBInput {
  analysisId: string;
  sampleId?: string;
  imageUrl?: string;
  detections?: any[];
  componentsCount?: number;
}

export type PCBOutput = Partial<IPCBAnalysis> & {
  analysisId: string;
  provider: "MOCK" | "VISION" | "GERBER" | "CAD" | "XRAY" | "OPENCV" | "GGNT";
  status: "COMPLETED" | "PARTIAL" | "FAILED" | "RECONSTRUCTED";
};

export interface PCBProvider {
  analyze(input: PCBInput): Promise<PCBOutput>;
}

export class MockPCBProvider implements PCBProvider {
  async analyze(input: PCBInput): Promise<PCBOutput> {
    const sample = (input.sampleId && SAMPLE_DATASETS[input.sampleId]) || SAMPLE_DATASETS["router-board"];
    const recon = sample.reconstruction;
    const prefix = input.analysisId.slice(-4).toUpperCase();

    // 1. Board Geometry
    const boardWidth = 1600;
    const boardHeight = 1000;
    const polygon = [
      { x: 40, y: 30 },
      { x: boardWidth - 40, y: 30 },
      { x: boardWidth - 40, y: boardHeight - 30 },
      { x: 40, y: boardHeight - 30 },
    ];

    // 2. Visible Traces
    const traces: IPCBTrace[] = [
      {
        traceId: `TR-ECI-${prefix}-001`,
        points: [{ x: 120, y: 150 }, { x: 300, y: 150 }, { x: 420, y: 220 }],
        widthPixels: 3.5,
        confidence: 0.94,
        layer: "VISIBLE_TOP",
        status: "DETECTED",
        source: "DETECTED",
        connectedComponentIds: [`CMP-ECI-${prefix}-001`, `CMP-ECI-${prefix}-002`],
        lengthEstimate: 334.8,
      },
      {
        traceId: `TR-ECI-${prefix}-002`,
        points: [{ x: 450, y: 240 }, { x: 620, y: 240 }, { x: 700, y: 380 }],
        widthPixels: 4.0,
        confidence: 0.91,
        layer: "VISIBLE_TOP",
        status: "DETECTED",
        source: "DETECTED",
        connectedComponentIds: [`CMP-ECI-${prefix}-002`, `CMP-ECI-${prefix}-003`],
        lengthEstimate: 326.5,
      },
      {
        traceId: `TR-ECI-${prefix}-003`,
        points: [{ x: 740, y: 400 }, { x: 920, y: 400 }, { x: 1050, y: 520 }],
        widthPixels: 3.0,
        confidence: 0.88,
        layer: "VISIBLE_TOP",
        status: "DETECTED",
        source: "DETECTED",
        connectedComponentIds: [`CMP-ECI-${prefix}-003`, `CMP-ECI-${prefix}-004`],
        lengthEstimate: 341.2,
      },
      {
        traceId: `TR-ECI-${prefix}-004`,
        points: [{ x: 500, y: 600 }, { x: 750, y: 600 }, { x: 880, y: 680 }],
        widthPixels: 2.8,
        confidence: 0.86,
        layer: "VISIBLE_TOP",
        status: "DETECTED",
        source: "DETECTED",
        connectedComponentIds: [`CMP-ECI-${prefix}-004`],
        lengthEstimate: 395.0,
      },
      {
        traceId: `TR-ECI-${prefix}-005`,
        points: [{ x: 300, y: 750 }, { x: 550, y: 750 }, { x: 720, y: 820 }],
        widthPixels: 3.2,
        confidence: 0.89,
        layer: "VISIBLE_TOP",
        status: "DETECTED",
        source: "DETECTED",
        connectedComponentIds: [`CMP-ECI-${prefix}-001`, `CMP-ECI-${prefix}-005`],
        lengthEstimate: 432.1,
      },
    ];

    // 3. Pads
    const pads: IPCBPad[] = [
      {
        padId: `PAD-ECI-${prefix}-001`,
        componentId: `CMP-ECI-${prefix}-001`,
        position: { x: 120, y: 150 },
        shape: "RECTANGULAR",
        size: { width: 14, height: 24 },
        confidence: 0.96,
        source: "DETECTED",
      },
      {
        padId: `PAD-ECI-${prefix}-002`,
        componentId: `CMP-ECI-${prefix}-002`,
        position: { x: 420, y: 220 },
        shape: "CIRCULAR",
        size: { width: 18, height: 18 },
        confidence: 0.94,
        source: "DETECTED",
      },
      {
        padId: `PAD-ECI-${prefix}-003`,
        componentId: `CMP-ECI-${prefix}-003`,
        position: { x: 700, y: 380 },
        shape: "RECTANGULAR",
        size: { width: 16, height: 28 },
        confidence: 0.95,
        source: "DETECTED",
      },
      {
        padId: `PAD-ECI-${prefix}-004`,
        componentId: `CMP-ECI-${prefix}-004`,
        position: { x: 1050, y: 520 },
        shape: "RECTANGULAR",
        size: { width: 12, height: 20 },
        confidence: 0.93,
        source: "DETECTED",
      },
    ];

    // 4. Vias
    const vias: IPCBVia[] = [
      {
        viaId: `VIA-ECI-${prefix}-001`,
        position: { x: 320, y: 180 },
        type: "VISIBLE_VIA",
        diameterPixels: 8,
        confidence: 0.92,
        source: "DETECTED",
      },
      {
        viaId: `VIA-ECI-${prefix}-002`,
        position: { x: 640, y: 260 },
        type: "VISIBLE_VIA",
        diameterPixels: 8,
        confidence: 0.89,
        source: "DETECTED",
      },
      {
        viaId: `VIA-ECI-${prefix}-003`,
        position: { x: 960, y: 440 },
        type: "POSSIBLE_VIA",
        diameterPixels: 6,
        confidence: 0.78,
        source: "INFERRED",
      },
      {
        viaId: `VIA-ECI-${prefix}-004`,
        position: { x: 1480, y: 120 },
        type: "MOUNTING_HOLE",
        diameterPixels: 32,
        confidence: 0.99,
        source: "DETECTED",
      },
    ];

    // 5. Damaged Regions
    const damagedRegions: IPCBDamage[] = [
      {
        damageId: `DMG-ECI-${prefix}-001`,
        type: "burn_mark",
        boundingBox: { x: 440, y: 220, width: 60, height: 40 },
        severity: "MEDIUM",
        confidence: 0.89,
        visualEvidence: "Thermal discoloration and localized solder mask degradation near power regulation stage.",
        affectedComponentIds: [`CMP-ECI-${prefix}-002`],
        affectedTraceIds: [`TR-ECI-${prefix}-001`, `TR-ECI-${prefix}-002`],
        status: "UNRESOLVED",
        source: "DETECTED",
      },
    ];

    // 6. Components with association
    const components = (input.detections && input.detections.length > 0)
      ? input.detections.map((d, idx) => {
          const compId = d.componentId || d.id || d.serialNumber || `CMP-ECI-${prefix}-${String(idx + 1).padStart(3, "0")}`;
          return {
            componentId: compId,
            type: d.type || d.className || "IC",
            name: d.name || d.partNumber || `IC-${idx + 1}`,
            confidence: d.confidence || 0.94,
            connectedTraceIds: traces.filter(t => t.connectedComponentIds?.includes(compId)).map(t => t.traceId),
            connectedPadIds: pads.filter(p => p.componentId === compId).map(p => p.padId),
            source: "DETECTED" as const,
          };
        })
      : [
          {
            componentId: `CMP-ECI-${prefix}-001`,
            type: "Microcontroller / SoC",
            name: "Broadcom BCM4709",
            confidence: 0.98,
            connectedTraceIds: [`TR-ECI-${prefix}-001`, `TR-ECI-${prefix}-005`],
            connectedPadIds: [`PAD-ECI-${prefix}-001`],
            source: "DETECTED" as const,
          },
          {
            componentId: `CMP-ECI-${prefix}-002`,
            type: "Voltage Regulator",
            name: "TI TPS54331",
            confidence: 0.95,
            connectedTraceIds: [`TR-ECI-${prefix}-001`, `TR-ECI-${prefix}-002`],
            connectedPadIds: [`PAD-ECI-${prefix}-002`],
            source: "DETECTED" as const,
          },
          {
            componentId: `CMP-ECI-${prefix}-003`,
            type: "DRAM Memory",
            name: "Winbond W971GG6SB",
            confidence: 0.96,
            connectedTraceIds: [`TR-ECI-${prefix}-002`, `TR-ECI-${prefix}-003`],
            connectedPadIds: [`PAD-ECI-${prefix}-003`],
            source: "DETECTED" as const,
          },
          {
            componentId: `CMP-ECI-${prefix}-004`,
            type: "Flash Storage",
            name: "Macronix MX25L12835F",
            confidence: 0.92,
            connectedTraceIds: [`TR-ECI-${prefix}-003`, `TR-ECI-${prefix}-004`],
            connectedPadIds: [`PAD-ECI-${prefix}-004`],
            source: "DETECTED" as const,
          },
          {
            componentId: `CMP-ECI-${prefix}-005`,
            type: "Gigabit Ethernet Switch",
            name: "Realtek RTL8367RB",
            confidence: 0.94,
            connectedTraceIds: [`TR-ECI-${prefix}-005`],
            connectedPadIds: [],
            source: "DETECTED" as const,
          },
        ];

    // 7. Topology Graph
    const nodes: ITopologyNode[] = [
      ...components.map(c => ({
        id: c.componentId,
        label: `${c.type} (${c.name || c.componentId})`,
        type: "COMPONENT" as const,
      })),
      ...pads.map(p => ({
        id: p.padId,
        label: p.padId,
        type: "PAD" as const,
        position: p.position,
      })),
      ...vias.map(v => ({
        id: v.viaId,
        label: v.viaId,
        type: "VIA" as const,
        position: v.position,
      })),
    ];

    const edges: ITopologyEdge[] = [
      {
        source: `CMP-ECI-${prefix}-001`,
        target: `CMP-ECI-${prefix}-002`,
        type: "VISIBLE_TRACE",
        confidence: 0.93,
        traceId: `TR-ECI-${prefix}-001`,
      },
      {
        source: `CMP-ECI-${prefix}-002`,
        target: `CMP-ECI-${prefix}-003`,
        type: "VISIBLE_TRACE",
        confidence: 0.91,
        traceId: `TR-ECI-${prefix}-002`,
      },
      {
        source: `CMP-ECI-${prefix}-003`,
        target: `CMP-ECI-${prefix}-004`,
        type: "VISIBLE_TRACE",
        confidence: 0.88,
        traceId: `TR-ECI-${prefix}-003`,
      },
      {
        source: `CMP-ECI-${prefix}-001`,
        target: `CMP-ECI-${prefix}-005`,
        type: "VISIBLE_TRACE",
        confidence: 0.89,
        traceId: `TR-ECI-${prefix}-005`,
      },
      {
        source: `CMP-ECI-${prefix}-001`,
        target: `PAD-ECI-${prefix}-001`,
        type: "PAD_CONNECTION",
        confidence: 0.98,
      },
      {
        source: `CMP-ECI-${prefix}-002`,
        target: `PAD-ECI-${prefix}-002`,
        type: "PAD_CONNECTION",
        confidence: 0.98,
      },
      {
        source: `CMP-ECI-${prefix}-002`,
        target: `CMP-ECI-${prefix}-003`,
        type: "INFERRED_CONNECTION",
        confidence: 0.82,
        traceId: `INFERRED-TR-${prefix}-001`,
      },
    ];

    // 8. Inferred reconstruction for severed trace
    const inferredTraces = [
      {
        traceId: `INFERRED-TR-${prefix}-001`,
        source: "INFERRED" as const,
        status: "INFERRED" as const,
        points: [{ x: 430, y: 230 }, { x: 470, y: 230 }],
        confidence: 0.84,
        description: "Inferred copper path bypassing surface thermal oxidation.",
        connectedComponentIds: [`CMP-ECI-${prefix}-002`, `CMP-ECI-${prefix}-003`],
      },
    ];

    const visualIntegrity = +(recon.reconstructionConfidence * 100).toFixed(1);

    return {
      analysisId: input.analysisId,
      provider: "MOCK",
      modelName: "EcoIntel-PCB-Topology-Engine (Deterministic Mock Provider)",
      modelVersion: "1.0.0",
      status: "COMPLETED",

      board: {
        widthPixels: boardWidth,
        heightPixels: boardHeight,
        aspectRatio: +(boardWidth / boardHeight).toFixed(2),
        polygon,
        estimatedPhysicalWidthMm: 120,
        estimatedPhysicalHeightMm: 85,
        physicalDimensionsAvailable: true,
        confidence: 0.94,
      },

      layers: {
        estimatedCount: sample.hardwareSpecs.layers || 2,
        confidence: 0.78,
        method: "Visual surface trace density & via hole geometry estimation",
        notes: "Single-side optical inspection. Buried planes and inner stripline traces cannot be directly confirmed without X-ray or destructive cross-sectioning.",
      },

      components,
      traces,
      pads,
      vias,
      damagedRegions,

      topology: {
        nodes,
        edges,
        nodesCount: nodes.length,
        edgesCount: edges.length,
        netlistPreview: `# Netlist (Visual Inference Preview)\nNET 'NET_VCC_3V3' ${components[0]?.componentId || `CMP-ECI-${prefix}-001`}:PIN_1 ${components[1]?.componentId || `CMP-ECI-${prefix}-002`}:PIN_2\nNET 'NET_GND' ${components[0]?.componentId || `CMP-ECI-${prefix}-001`}:PIN_GND ${components[2]?.componentId || `CMP-ECI-${prefix}-003`}:PIN_GND\nNET 'NET_DRAM_CLK' ${components[0]?.componentId || `CMP-ECI-${prefix}-001`}:PIN_CLK ${components[2]?.componentId || `CMP-ECI-${prefix}-003`}:PIN_CLK`,
      },

      reconstruction: {
        boardGeometry: { widthPixels: boardWidth, heightPixels: boardHeight, polygon },
        components,
        traces,
        pads,
        vias,
        inferredTraces,
        confidence: 0.89,
        overallReconstructionConfidence: 86,
        confidenceBreakdown: {
          componentConfidence: 96,
          traceConfidence: 88,
          topologyConfidence: 84,
          damageConfidence: 89,
          imageQuality: 92,
        },
        visualIntegrityEstimate: visualIntegrity,
        limitations: [
          "Single-side optical imaging cannot observe buried inner layers (e.g. power & ground planes).",
          "Traces running under large BGA / QFP packages are visually occluded and treated as inferred.",
          "Visual trace continuity does not substitute for four-wire Kelvin electrical continuity testing.",
        ],
      },

      metrics: {
        componentsDetected: components.length,
        visibleTraces: traces.length,
        padsDetected: pads.length,
        viasDetected: vias.length,
        potentialConnections: edges.length,
        damageRegionsCount: damagedRegions.length,
        visualIntegrityScore: visualIntegrity,
        topologyConfidence: 85,
      },

      warnings: [
        "Thermal discoloration detected near power regulation stage.",
        "Internal inner-layer traces cannot be verified from 2D optical photography alone.",
      ],

      // Legacy compatibility
      boardType: `${sample.hardwareSpecs.layers}-Layer ${sample.hardwareSpecs.substrate}`,
      layerCount: sample.hardwareSpecs.layers,
      componentCount: components.length,
      traceCount: traces.length + 180,
      traceContinuity: recon.traceIntegrityPercent,
      boardIntegrity: visualIntegrity,
      reconstructedRegions: [
        { region: "GND Return Loop (Layer 2)", repairedTraces: recon.severedTracesRepaired || 3, confidence: 0.96 },
      ],
      schematics: recon.schematics,
    };
  }
}

export class VisionPCBProvider implements PCBProvider {
  private aiServiceUrl: string;
  private apiKey: string;

  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8001";
    this.apiKey = process.env.AI_SERVICE_API_KEY || "eco-intel-internal-ai-key-2026";
  }

  async analyze(input: PCBInput): Promise<PCBOutput> {
    if (!input.imageUrl) {
      throw new Error("VisionPCBProvider requires imageUrl or valid image buffer.");
    }

    try {
      const response = await fetch(`${this.aiServiceUrl}/pcb-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          analysisId: input.analysisId,
          imageUrl: input.imageUrl,
          detections: input.detections || [],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI Service PCB analysis failed HTTP ${response.status}: ${errorText}`);
      }

      const resJson = await response.json();
      if (!resJson.success || !resJson.data) {
        throw new Error(resJson.error?.message || "AI Service returned invalid PCB analysis format.");
      }

      const pcb = resJson.data;

      return {
        analysisId: input.analysisId,
        provider: "VISION",
        modelName: pcb.modelName || "EcoIntel OpenCV + Vision Topology Engine",
        modelVersion: pcb.modelVersion || "v1.0.0",
        status: "COMPLETED",

        board: pcb.board,
        layers: pcb.layers,
        components: pcb.components || [],
        traces: pcb.traces || [],
        pads: pcb.pads || [],
        vias: pcb.vias || [],
        damagedRegions: pcb.damagedRegions || [],
        topology: pcb.topology || { nodes: [], edges: [], nodesCount: 0, edgesCount: 0 },
        reconstruction: pcb.reconstruction || {},
        metrics: pcb.metrics || {},
        warnings: pcb.warnings || [],

        // Legacy compatibility
        boardType: pcb.boardType || "Multi-layer FR-4 Substrate",
        layerCount: pcb.layers?.estimatedCount || 2,
        componentCount: pcb.components?.length || 0,
        traceCount: pcb.traces?.length || 0,
        traceContinuity: pcb.metrics?.visualIntegrityScore || 85,
        boardIntegrity: pcb.metrics?.visualIntegrityScore || 85,
        reconstructedRegions: pcb.reconstruction?.inferredTraces?.map((it: any) => ({
          region: it.traceId,
          repairedTraces: 1,
          confidence: it.confidence,
        })) || [],
      };
    } catch (err: any) {
      console.error("[VisionPCBProvider] Analysis error:", err.message);
      throw err;
    }
  }
}

export class GerberPCBProvider implements PCBProvider {
  async analyze(): Promise<PCBOutput> {
    throw new Error("GerberPCBProvider is a future capability and requires RS-274X CAM archive.");
  }
}

export class CADPCBProvider implements PCBProvider {
  async analyze(): Promise<PCBOutput> {
    throw new Error("CADPCBProvider is a future capability and requires native STEP/KiCad PCB geometry.");
  }
}

export class XRayPCBProvider implements PCBProvider {
  async analyze(): Promise<PCBOutput> {
    throw new Error("XRayPCBProvider is a future capability and requires computed tomography volumetric slices.");
  }
}

export class PCBAnalysisService {
  private mockProvider = new MockPCBProvider();
  private visionProvider = new VisionPCBProvider();

  async analyze(input: PCBInput): Promise<PCBOutput> {
    const configuredProvider = (process.env.PCB_PROVIDER || "mock").toLowerCase();

    // If it's a sample dataset and not explicitly forced to vision, use mock
    if (input.sampleId && configuredProvider !== "vision") {
      return this.mockProvider.analyze(input);
    }

    if (configuredProvider === "vision") {
      try {
        return await this.visionProvider.analyze(input);
      } catch (err: any) {
        console.warn(`[PCBAnalysisService] Vision analysis failed (${err.message}). Falling back to mock for demo stability.`);
        return this.mockProvider.analyze(input);
      }
    }

    return this.mockProvider.analyze(input);
  }
}

export const pcbAnalysisService = new PCBAnalysisService();
