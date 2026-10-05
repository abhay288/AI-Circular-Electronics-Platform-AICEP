import { SAMPLE_DATASETS } from "@/lib/data/sampleDatasets";

export interface PCBInput {
  analysisId: string;
  sampleId?: string;
  componentsCount?: number;
}

export interface PCBOutput {
  boardType: string;
  layerCount: number;
  boardDimensions: { widthMm: number; heightMm: number; areaCm2: number };
  componentCount: number;
  traceCount: number;
  traceContinuity: number;
  boardIntegrity: number;
  damagedRegions: Array<{ region: string; severity: string; x: number; y: number; width: number; height: number }>;
  reconstructedRegions: Array<{ region: string; repairedTraces: number; confidence: number }>;
  topology: { nodesCount: number; edgesCount: number; netlistPreview?: string };
  confidence: number;
  status: "RECONSTRUCTED" | "PARTIAL" | "FAILED";
  model: string;
  version: string;
  provider: "MOCK" | "OPENCV" | "GGNT";
  schematics?: {
    kicadFileUrl?: string;
    gerberZipUrl?: string;
    netlistRaw?: string;
  };
}

export interface PCBProvider {
  analyze(input: PCBInput): Promise<PCBOutput>;
}

export class MockPCBProvider implements PCBProvider {
  async analyze(input: PCBInput): Promise<PCBOutput> {
    const sample = (input.sampleId && SAMPLE_DATASETS[input.sampleId]) || SAMPLE_DATASETS["router-board"];
    const recon = sample.reconstruction;

    return {
      boardType: `${sample.hardwareSpecs.layers}-Layer ${sample.hardwareSpecs.substrate}`,
      layerCount: sample.hardwareSpecs.layers,
      boardDimensions: { widthMm: 120, heightMm: 85, areaCm2: 102 },
      componentCount: sample.componentCount,
      traceCount: 184,
      traceContinuity: recon.traceIntegrityPercent,
      boardIntegrity: +(recon.reconstructionConfidence * 100).toFixed(1),
      damagedRegions: [
        { region: "VRM Phase 2", severity: "Medium", x: 45, y: 30, width: 25, height: 18 },
      ],
      reconstructedRegions: [
        { region: "GND Return Loop (Layer 2)", repairedTraces: recon.severedTracesRepaired || 3, confidence: 0.96 },
      ],
      topology: {
        nodesCount: 54,
        edgesCount: 88,
        netlistPreview: recon.schematics?.netlistRaw?.substring(0, 120) || "NETLIST_AUTO_GENERATED",
      },
      confidence: +(recon.reconstructionConfidence).toFixed(2),
      status: "RECONSTRUCTED",
      model: "NeuroPCB-Reconstruct (Mock Provider)",
      version: "1.8.2",
      provider: "MOCK",
      schematics: recon.schematics,
    };
  }
}
