/**
 * EcoIntel Client API — Sub-resources & Pipeline Inspection SDK
 */

export async function getDetectedComponents(analysisId: string) {
  const res = await fetch(`/api/analysis/${analysisId}/components`);
  return res.json();
}

export async function getPCBAnalysis(analysisId: string) {
  const res = await fetch(`/api/analysis/${analysisId}/pcb`);
  return res.json();
}

export async function getRULPrediction(analysisId: string) {
  const res = await fetch(`/api/analysis/${analysisId}/rul`);
  return res.json();
}

export async function getMaterialsRecovery(analysisId: string) {
  const res = await fetch(`/api/analysis/${analysisId}/materials`);
  return res.json();
}

export async function getRepairAssessment(analysisId: string) {
  const res = await fetch(`/api/analysis/${analysisId}/repair`);
  return res.json();
}

export async function getDigitalPassport(analysisId: string) {
  const res = await fetch(`/api/analysis/${analysisId}/passport`);
  return res.json();
}

export async function getCarbonImpact(analysisId: string) {
  const res = await fetch(`/api/analysis/${analysisId}/carbon`);
  return res.json();
}

export async function getReport(analysisId: string) {
  const res = await fetch(`/api/analysis/${analysisId}/report`);
  return res.json();
}

export async function generateFullReport(analysisId: string, format = "PDF") {
  const res = await fetch(`/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ analysisId, format }),
  });
  return res.json();
}

export async function getRecoveredMarketplaceComponents(analysisId?: string) {
  const url = analysisId
    ? `/api/marketplace/recovered?analysisId=${analysisId}`
    : `/api/marketplace/recovered`;
  const res = await fetch(url);
  return res.json();
}

export async function createMarketplaceListing(data: any) {
  const res = await fetch(`/api/marketplace/listings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getMarketplaceListings(status = "ACTIVE") {
  const res = await fetch(`/api/marketplace/listings?status=${status}`);
  return res.json();
}
