import crypto from "crypto";

export function generateAnalysisId(): string {
  const year = new Date().getFullYear();
  // 4-digit human-friendly code
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `ECI-${year}-${randomNum}`;
}

export function generatePassportId(suffix?: string): string {
  const year = new Date().getFullYear();
  const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
  // Support both DPP-ECI-XXXX-XXX and ECP-DPP-YYYY-XXXXXX formats
  if (suffix) {
    const cleanSuffix = suffix.replace(/^(ECI-|PASS-)/, "");
    return `DPP-ECI-${cleanSuffix}-${randomHex.slice(0, 3)}`;
  }
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `ECP-DPP-${year}-${randomNum}`;
}

export function generateEventId(): string {
  const year = new Date().getFullYear();
  const randomStr = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `EVT-DPP-${year}-${randomStr}`;
}

export function generateAssetId(prefix?: string): string {
  const year = new Date().getFullYear();
  const randomStr = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix || "AST"}-${year}-${randomStr}`;
}

export function generateDocumentId(): string {
  const year = new Date().getFullYear();
  const randomStr = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `DOC-DPP-${year}-${randomStr}`;
}

export function generateReportId(analysisId?: string, version?: number): string {
  const year = new Date().getFullYear();
  const randomSuffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  const vPart = version !== undefined ? `-v${version}` : "";
  const idPart = analysisId ? analysisId.replace(/^ECI-/, "") : `${year}-${Math.floor(1000 + Math.random() * 9000)}`;
  return `REP-${idPart}${vPart}-${randomSuffix}`;
}

export function generateListingId(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `LST-${year}-${randomNum}`;
}

