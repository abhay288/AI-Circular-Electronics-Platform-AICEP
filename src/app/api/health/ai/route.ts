import { NextResponse } from "next/server";

export async function GET() {
  const models = [
    {
      name: "YOLO Component Detector",
      task: "COMPONENT_DETECTION",
      framework: "YOLOv8",
      version: "v2.1.0",
      status: "ready",
      precision: "FP16",
    },
    {
      name: "PCB Reconstruction & Topology",
      task: "PCB_TOPOLOGY",
      framework: "OpenCV + ContourReconstruction",
      version: "v1.8.4",
      status: "ready",
      precision: "deterministic",
    },
    {
      name: "Remaining Useful Life (RUL) Predictor",
      task: "RUL_REGRESSION",
      framework: "Physics-Informed XGBoost",
      version: "v2.3.0",
      status: "ready",
      precision: "statistical_confidence_interval",
    },
    {
      name: "Material Spectrometry Index",
      task: "MATERIAL_RECOVERY",
      framework: "USGS/WEEE Material Matrix",
      version: "v2024.2",
      status: "ready",
      precision: "elemental_yield_matrix",
    },
  ];

  return NextResponse.json({
    status: "healthy",
    runtime: "node_hybrid_inference",
    models,
    timestamp: new Date().toISOString(),
  });
}
