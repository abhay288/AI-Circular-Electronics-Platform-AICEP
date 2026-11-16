import crypto from "crypto";

/**
 * Recursively sort object keys deterministically to produce a stable JSON representation.
 * Primitive values, arrays (ordered as-is, with elements canonicalized), and nulls are preserved.
 * Transient / volatile fields (database IDs, timestamps of verification, etc.) are excluded.
 */
const EXCLUDED_CANONICAL_KEYS = new Set([
  "_id",
  "__v",
  "updatedAt",
  "lastVerifiedAt",
  "verificationStatus",
  "currentVersionHash", // The hash container itself is excluded from hashing
  "contentHash", // Stored hash field itself is excluded when re-hashing
]);

export function sortKeysDeterministically(input: any): any {
  if (input === null || typeof input !== "object") {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(sortKeysDeterministically);
  }

  // Handle Mongoose documents or plain objects
  const plainObj = typeof input.toObject === "function" ? input.toObject() : input;
  const sortedKeys = Object.keys(plainObj)
    .filter((k) => !EXCLUDED_CANONICAL_KEYS.has(k))
    .sort();

  const result: Record<string, any> = {};
  for (const key of sortedKeys) {
    const val = plainObj[key];
    if (val !== undefined) {
      result[key] = sortKeysDeterministically(val);
    }
  }

  return result;
}

/**
 * Returns deterministic JSON string of the input data
 */
export function canonicalizeData(input: any): string {
  const sorted = sortKeysDeterministically(input);
  return JSON.stringify(sorted);
}

/**
 * Calculates SHA-256 hash of canonicalized JSON
 */
export function calculateContentHash(input: any): string {
  const canonicalJson = canonicalizeData(input);
  return crypto.createHash("sha256").update(canonicalJson, "utf8").digest("hex");
}

/**
 * Canonicalizes and hashes a Passport Lifecycle Event
 */
export function hashLifecycleEvent(event: {
  eventId: string;
  passportId: string;
  eventType: string;
  actor: string;
  organization: string;
  timestamp: Date | string;
  description: string;
  evidence?: string;
  metadata?: any;
}): string {
  const stableEvent = {
    eventId: event.eventId,
    passportId: event.passportId,
    eventType: event.eventType,
    actor: event.actor,
    organization: event.organization,
    timestamp: new Date(event.timestamp).toISOString(),
    description: event.description,
    evidence: event.evidence || "",
    metadata: event.metadata || {},
  };
  return calculateContentHash(stableEvent);
}

/**
 * Computes SHA-256 hash of document buffer or string
 */
export function hashDocumentBuffer(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export function hashDocumentString(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

/**
 * Compares current recalculated hash with expected hash
 */
export function verifyHashMatch(data: any, expectedHash: string): boolean {
  if (!expectedHash) return false;
  const computedHash = calculateContentHash(data);
  return computedHash.toLowerCase() === expectedHash.toLowerCase();
}
