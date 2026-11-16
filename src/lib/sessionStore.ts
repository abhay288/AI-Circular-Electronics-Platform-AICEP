import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/**
 * Resilient In-Memory + Disk Backed Session Store for EcoIntel.
 * Ensures zero-latency status polling, cross-process worker sync,
 * and survives server restarts and external database drops.
 */

export interface SessionData {
  analysisId: string;
  sessionId?: string;
  userId?: any;
  organizationId?: any;
  sourceType?: string;
  mode?: string;
  deviceName?: string;
  deviceType?: string;
  imageUrl?: string;
  imageFilePath?: string;
  status: string;
  progress: number;
  currentStage: string;
  stageStatuses: Record<string, string>;
  detectionResult?: any;
  pcbAnalysisId?: any;
  reconstructionResult?: any;
  qualityResult?: any;
  ocrResult?: any;
  evidenceSummary?: any;
  error?: any;
  updatedAt: Date | string;
  createdAt: Date | string;
  [key: string]: any;
}

const SESSIONS_DIR = path.join(process.cwd(), ".eco_sessions");

function ensureSessionsDir() {
  try {
    if (!fs.existsSync(SESSIONS_DIR)) {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    }
  } catch (_) {}
}

function getSessionFilePath(id: string): string {
  const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(SESSIONS_DIR, `${cleanId}.json`);
}

function persistToDisk(session: SessionData) {
  try {
    ensureSessionsDir();
    const filePath = getSessionFilePath(session.analysisId);
    fs.writeFileSync(filePath, JSON.stringify(session, null, 2), "utf-8");
  } catch (err: any) {
    console.warn("[SessionStore Disk Write Warning]:", err.message);
  }
}

function loadFromDisk(id: string): SessionData | null {
  try {
    const filePath = getSessionFilePath(id);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) as SessionData;
    }
  } catch (err: any) {
    console.warn("[SessionStore Disk Read Warning]:", err.message);
  }
  return null;
}

// Global persistent cache surviving HMR
const globalSessionCache = global as unknown as {
  __ecoIntelSessionStore?: Map<string, SessionData>;
};

if (!globalSessionCache.__ecoIntelSessionStore) {
  globalSessionCache.__ecoIntelSessionStore = new Map<string, SessionData>();
}

export const memoryStore = globalSessionCache.__ecoIntelSessionStore;

export class SessionStore {
  static set(analysisId: string, session: Partial<SessionData>): SessionData {
    const existing = this.get(analysisId) || ({} as Partial<SessionData>);
    const merged: SessionData = {
      ...existing,
      ...session,
      analysisId,
      sessionId: session.sessionId || analysisId,
      status: session.status || existing.status || "READY",
      progress: session.progress ?? existing.progress ?? 0,
      currentStage: session.currentStage || existing.currentStage || "INITIALIZATION",
      stageStatuses: {
        ...(existing.stageStatuses || {
          quality: "completed",
          detection: "pending",
          pcb: "pending",
          damage: "pending",
          ocr: "pending",
          summary: "pending",
        }),
        ...(session.stageStatuses || {}),
      },
      updatedAt: new Date().toISOString(),
      createdAt: existing.createdAt || session.createdAt || new Date().toISOString(),
    };

    memoryStore.set(analysisId, merged);
    if (merged.sessionId && merged.sessionId !== analysisId) {
      memoryStore.set(merged.sessionId, merged);
    }

    persistToDisk(merged);
    return merged;
  }

  static get(analysisId: string): SessionData | undefined {
    let session = memoryStore.get(analysisId);
    if (!session) {
      const fromDisk = loadFromDisk(analysisId);
      if (fromDisk) {
        memoryStore.set(analysisId, fromDisk);
        if (fromDisk.sessionId && fromDisk.sessionId !== analysisId) {
          memoryStore.set(fromDisk.sessionId, fromDisk);
        }
        return fromDisk;
      }
    }
    return session;
  }

  static update(analysisId: string, partial: Partial<SessionData>): SessionData | undefined {
    const existing = this.get(analysisId);
    if (!existing) {
      return this.set(analysisId, partial);
    }
    const updated: SessionData = {
      ...existing,
      ...partial,
      stageStatuses: {
        ...(existing.stageStatuses || {}),
        ...(partial.stageStatuses || {}),
      },
      updatedAt: new Date().toISOString(),
    };
    memoryStore.set(analysisId, updated);
    if (updated.sessionId && updated.sessionId !== analysisId) {
      memoryStore.set(updated.sessionId, updated);
    }

    persistToDisk(updated);
    return updated;
  }

  static list(limit = 20): SessionData[] {
    const map = new Map<string, SessionData>();

    // 1. Check memory store
    for (const s of memoryStore.values()) {
      map.set(s.analysisId, s);
    }

    // 2. Scan disk store for any from other workers
    try {
      ensureSessionsDir();
      const files = fs.readdirSync(SESSIONS_DIR);
      for (const file of files) {
        if (file.endsWith(".json")) {
          const id = file.replace(".json", "");
          if (!map.has(id)) {
            const loaded = loadFromDisk(id);
            if (loaded) {
              map.set(loaded.analysisId, loaded);
              memoryStore.set(loaded.analysisId, loaded);
            }
          }
        }
      }
    } catch (_) {}

    return Array.from(map.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }
}
