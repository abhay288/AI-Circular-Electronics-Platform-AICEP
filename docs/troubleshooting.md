# EcoIntel Troubleshooting & Failure Recovery Guide

Diagnosing, debugging, and resolving common errors, degraded states, and integrity anomalies across EcoIntel.

---

## 1. Common Issues & Resolutions

### 1.1 Report Generation Fails (`STATUS: FAILED`)
- **Symptoms**: Report record remains in `FAILED` state; user receives an error alert in Notification Center.
- **Root Causes**:
  - Missing dependent analysis models (e.g. attempting to generate an Asset Report before detection is saved).
  - Memory exhaustion during large PDF rendering with massive component tables.
- **Resolution**:
  1. Inspect the error log via `GET /api/reports/:reportId`.
  2. Run the integrity checker: `GET /api/integrity/analysis/:analysisId`.
  3. Retry generation using `POST /api/reports/generate`.

### 1.2 Cross-Phase Data Inconsistency (`INTEGRITY WARNING/ERROR`)
- **Symptoms**: Dashboard displays conflicting values (e.g., Passport lists asset as RECYCLED, but Marketplace listing remains ACTIVE).
- **Diagnostics**:
  - Query the integrity endpoint: `GET /api/integrity/analysis/:analysisId`.
  - Check returned issue codes:
    - `PASSPORT_REPAIR_MISMATCH`: Passport recorded repair, but RepairAssessment was only a recommendation.
    - `REALIZED_CARBON_WITHOUT_EVENT`: Realized carbon claimed without verified DPP lifecycle transition.
    - `MASS_ANOMALY`: Total recoverable metals exceed estimated gross board mass.
- **Resolution**:
  - Update the affected record or trigger state machine realignment.

### 1.3 Redis Connection Dropped / BullMQ Offline
- **Symptoms**: Reports or background tasks take longer or log Redis connection warnings.
- **Diagnostics**:
  - Query `GET /api/health/queues`.
- **Resolution**:
  - EcoIntel includes automatic fallback to synchronous in-memory execution when Redis is unreachable. Check Redis network status and `REDIS_URL` in `.env`.

### 1.4 AI Vision Microservice Unavailable
- **Symptoms**: New scans fail during `PROCESSING` stage.
- **Diagnostics**:
  - Query `GET /api/health/ai`.
  - Confirm whether the YOLO / FastAPI service is running on port 8000 or external endpoint.
- **Resolution**:
  - In development, activate DEMO mode or verify the AI container status via `docker compose ps ai-service`.

---

## 2. Standard Diagnostics Runbook

When filing an incident ticket or triaging platform alerts:
1. Note the safe `errorId` returned in API response headers or JSON body.
2. Check recent logs for that `errorId`.
3. Check `GET /api/health` to identify degraded subsystems.
4. Review recent tenant activities in the Activity Center (`/activity`).
