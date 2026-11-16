# EcoIntel REST API Documentation

Comprehensive specification for EcoIntel's enterprise backend API.

---

## 1. Authentication & Security Headers

All protected endpoints require an Authorization header with a valid Bearer token or session cookie:

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

Role-Based Access Control (RBAC):
- `PLATFORM_ADMIN`: Global administrative access across all organizations.
- `ORG_ADMIN`: Full administrative control within the user's organization.
- `ENGINEER`: Analysis creation, inspection, and technical report generation.
- `TECHNICIAN`: Repair intake, logging, and component disposition.
- `AUDITOR`: Read-only access to audit logs, passports, and ESG reports.
- `PUBLIC`: Unauthenticated access restricted to public passport verification and shared reports.

Rate Limiting:
- Authenticated: 120 requests / min
- Public / Unauthenticated: 30 requests / min

---

## 2. API Endpoints

### 2.1 Reports (`/api/reports`)

#### `POST /api/reports/generate`
Queues or synchronously generates an enterprise dossier.
- **Request Body:**
  ```json
  {
    "reportType": "ASSET" | "TECHNICAL" | "CIRCULARITY" | "ENVIRONMENTAL" | "EXECUTIVE",
    "analysisId": "ANL-XXXXX",
    "title": "Comprehensive Asset Audit v1",
    "branding": {
      "companyName": "Circular Dynamics Inc.",
      "logoUrl": "https://...",
      "footerNote": "Proprietary & Confidential"
    }
  }
  ```
- **Response (202 Accepted or 200 OK):**
  ```json
  {
    "success": true,
    "reportId": "REP-ANL-XXXXX-v1-a1b2c3",
    "version": 1,
    "status": "READY",
    "completeness": 94,
    "report": { ... }
  }
  ```

#### `GET /api/reports/:reportId`
Fetches report metadata and full dossier structure.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "report": {
      "reportId": "REP-ANL-XXXXX-v1-a1b2c3",
      "analysisId": "ANL-XXXXX",
      "reportType": "ASSET",
      "version": 1,
      "status": "READY",
      "completeness": 94,
      "sections": [
        {
          "id": "technical",
          "title": "Technical PCB Architecture",
          "data": { ... },
          "evidenceLevel": "MEASURED",
          "completeness": 100
        }
      ]
    }
  }
  ```

#### `GET /api/reports/:reportId/status`
Polls background report generation status.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "status": "READY",
    "completeness": 94
  }
  ```

#### `GET /api/reports/:reportId/sections`
Returns only individual report sections.

#### `GET /api/reports/:reportId/versions`
Lists all historic versions associated with this report's root identifier or analysis ID.

#### `GET /api/reports/:reportId/download?format=pdf|json|csv`
Streams the formatted report payload:
- `pdf`: Application/pdf binary document generated via jsPDF.
- `json`: Application/json structured dossier export.
- `csv`: Text/csv tabular flatten of components, materials, and carbon metrics.

#### `POST /api/reports/:reportId/share`
Generates a time-bound, cryptographically signed share link.
- **Request Body:**
  ```json
  {
    "expiresInDays": 7,
    "permissions": "VIEW" | "DOWNLOAD"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "shareUrl": "/reports/shared/a1b2c3d4e5...",
    "shareToken": "a1b2c3d4e5...",
    "expiresAt": "2026-10-14T22:00:00.000Z"
  }
  ```

#### `GET /api/reports/shared/:token`
Public tokenized access to an authorized shared report.

#### `POST /api/reports/:reportId/archive`
Soft-archives an existing report.

---

### 2.2 Executive Dashboard (`/api/dashboard`)

#### `GET /api/dashboard/summary?timeRange=30D&organizationId=...`
Returns real-time database aggregations for executive KPI cards and portfolio distributions.
- **Query Parameters:**
  - `timeRange`: `TODAY`, `7D`, `30D`, `90D`, `6M`, `1Y`, `ALL`, or `CUSTOM`
  - `organizationId`: Optional organization filter (enforced by user session)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "kpis": {
      "totalAssetsAnalyzed": 42,
      "componentsDetected": 512,
      "assetsRepaired": 18,
      "assetsReused": 12,
      "assetsRefurbished": 8,
      "materialsRecoveredKg": 142.5,
      "wasteDivertedKg": 320.1,
      "co2eAvoidedKg": 1890.4,
      "activeListings": 15,
      "verifiedPassports": 38
    },
    "healthDistribution": {
      "Healthy": 14,
      "Good": 16,
      "Fair": 8,
      "Degraded": 3,
      "Critical": 1,
      "Unknown": 0
    },
    "rulDistribution": {
      "< 6 months": 2,
      "6-12 months": 5,
      "1-3 years": 15,
      "3-5 years": 12,
      "> 5 years": 8,
      "Unknown": 0
    }
  }
  ```

#### `GET /api/dashboard/portfolio?page=1&limit=20&search=...&status=...`
Paginated asset portfolio listing joining analysis sessions with passports, RUL predictions, and carbon impact records.

#### `GET /api/dashboard/risk`
Surfaces critical alerts across high-risk components, severe PCB degradation, low RUL, and data anomalies.

---

### 2.3 Cross-Phase Data Integrity (`/api/integrity`)

#### `GET /api/integrity/analysis/:analysisId`
Cross-references every phase record (`AnalysisSession`, `DetectionResult`, `PCBAnalysis`, `RULPrediction`, `MaterialRecovery`, `RepairAssessment`, `DigitalPassport`, `MarketplaceListing`, `CarbonImpact`, `Report`) to detect discrepancies.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "analysisId": "ANL-1001",
    "status": "VALID" | "WARNING" | "INCONSISTENT",
    "checkedAt": "2026-10-07T22:30:00.000Z",
    "issues": [
      {
        "severity": "WARNING",
        "phase": "MaterialRecovery",
        "code": "MASS_ANOMALY",
        "message": "Recoverable mass exceeds estimated board mass",
        "action": "Recalculate board dimensions or density factors."
      }
    ]
  }
  ```

---

### 2.4 Unified Global Search (`/api/search`)

#### `GET /api/search?q=XYZ`
Searches across 6 primary entity domains:
- Assets & Analyses
- Digital Passports
- Hardware Components
- Marketplace Listings
- Generated Reports
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "query": "MCU-STM32",
    "total": 3,
    "results": [
      {
        "entityType": "COMPONENT",
        "id": "CMP-0042",
        "title": "STM32F407VGT6 Microcontroller",
        "subtitle": "STMicroelectronics • QFP-100",
        "status": "DETECTED",
        "url": "/console/ANL-1001",
        "timestamp": "2026-10-07T12:00:00Z"
      }
    ]
  }
  ```

---

### 2.5 Notifications (`/api/notifications`)

- `GET /api/notifications?page=1&limit=20&unreadOnly=true`: List notifications for current user/organization.
- `POST /api/notifications/:id/read`: Mark single notification as read.
- `POST /api/notifications/read-all`: Mark all notifications as read.

---

### 2.6 System Observability & Health (`/api/health`)

- `GET /api/health`: Unified platform health index and uptime.
- `GET /api/health/database`: MongoDB ping and connection pool latency.
- `GET /api/health/queues`: Redis / BullMQ worker and queue readiness.
- `GET /api/health/ai`: AI inference provider availability (YOLO, PCB Vision, XGBoost RUL).
- `GET /api/health/storage`: S3 / MinIO object storage reachability.

---

## 3. Error Contract

All API error responses adhere to the unified safe error format:

```json
{
  "success": false,
  "errorId": "err_c0192a83f1",
  "service": "ReportService",
  "operation": "generateTechnicalReport",
  "safeMessage": "Analysis session not found or access denied",
  "timestamp": "2026-10-07T22:35:00.000Z"
}
```
Stack traces and private infrastructure details are sanitized from all client-facing responses.
