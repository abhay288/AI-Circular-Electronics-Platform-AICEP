import crypto from "crypto";

export function generateAnalysisId(): string {
  const year = new Date().getFullYear();
  // 4-digit human-friendly code
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `ECI-${year}-${randomNum}`;
}

export function generatePassportId(suffix?: string): string {
  const year = new Date().getFullYear();
  const randomStr = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `PASS-${year}-${suffix || randomStr}`;
}

export function generateReportId(analysisId?: string): string {
  const year = new Date().getFullYear();
  const idPart = analysisId ? analysisId.replace(/^ECI-/, "") : `${year}-${Math.floor(1000 + Math.random() * 9000)}`;
  return `REP-${idPart}`;
}

export function generateListingId(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `LST-${year}-${randomNum}`;
}
