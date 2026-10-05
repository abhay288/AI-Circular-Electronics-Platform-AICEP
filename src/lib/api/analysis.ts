/**
 * EcoIntel Client API — Analysis Session SDK
 */

export async function createAnalysis(data: {
  deviceName: string;
  deviceType: string;
  sourceType?: string;
  mode?: string;
  sampleId?: string;
  imageUrl?: string;
}) {
  const res = await fetch("/api/analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getAnalysis(analysisId: string) {
  const res = await fetch(`/api/analysis/${analysisId}`);
  return res.json();
}

export async function getAnalysisStatus(analysisId: string) {
  const res = await fetch(`/api/analysis/${analysisId}/status`);
  return res.json();
}

export async function attachSampleToAnalysis(analysisId: string, sampleId: string) {
  const res = await fetch(`/api/analysis/${analysisId}/sample`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sampleId }),
  });
  return res.json();
}

export async function uploadAnalysisImage(analysisId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`/api/analysis/${analysisId}/upload`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

export async function startAnalysis(analysisId: string) {
  const res = await fetch(`/api/analysis/${analysisId}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}
