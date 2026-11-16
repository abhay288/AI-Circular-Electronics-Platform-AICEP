# EcoIntel Enterprise Reporting Engine

The EcoIntel Enterprise Reporting Engine provides verifiable, audit-grade intelligence dossiers across all ten phases of the circular electronics lifecycle.

---

## 1. Reporting Philosophy & Integrity Guardrails

1. **Zero Synthetic Numbers in Production**: Every metric originates from verified MongoDB collections, validated inference engines, or documented LCA conversion factors.
2. **Scientific Honesty & Evidence Badging**: Every analytical section is tagged with an explicit `evidenceLevel`:
   - `MEASURED`: Physical measurements (e.g., scale-weighed mass, multi-meter readings).
   - `KNOWN`: Manufacturer datasheet specifications or official IPC standards.
   - `VERIFIED`: Cryptographic on-chain passport signatures or physical inspection sign-offs.
   - `DATABASE-DERIVED`: Statistical averages from official lifecycle inventories (e.g., Ecoinvent, GaBi).
   - `ESTIMATED`: Machine learning or algorithmic predictions (e.g., volumetric mass estimation).
   - `PREDICTED`: Survival and degradation models (e.g., XGBoost / Weibull RUL).
   - `INFERRED`: Topology or netlist heuristics derived from optical tracing.
   - `SIMULATED`: Scenario modeling (e.g., hypothetical avoided emissions).
   - `DEMO`: Explicit synthetic datasets created for testing or demonstrator sandbox environments.
3. **Completeness Scoring**: Prior to publishing, `ReportService` computes completeness (0–100%) across all 6 core lifecycle pillars:
   - Technical PCB (20%)
   - Health & RUL (20%)
   - Material Recovery (20%)
   - Repair & Circularity (15%)
   - Digital Passport (15%)
   - Environmental Carbon (10%)
   Missing sections are identified explicitly in the report metadata. Missing data is rendered as `"Data unavailable"` rather than interpolated with hallucinated values.
4. **Immutable Versioning**: When asset conditions change (e.g., post-repair, new RUL test), a new immutable version is minted (`v1`, `v2`, `v3`). Previous versions remain preserved.

---

## 2. Dossier Typology

| Report Type | Target Audience | Primary Focus |
| :--- | :--- | :--- |
| **ASSET** | Operations & Plant Managers | Complete 360° asset dossier joining physical detection, health, materials, circularity, passport, and carbon footprint. |
| **TECHNICAL** | Hardware Engineers & R&D | Detailed PCB topology, component packages, trace widths, pad/via metrics, defect annotations, and reconstruction nets. |
| **CIRCULARITY** | Remanufacturers & Technicians | Disassembly feasibility, repair recommendations, test logs, recovery yield, and circular decision tree outcomes. |
| **ENVIRONMENTAL** | Chief Sustainability Officers & ESG Auditors | Scope 3 avoided carbon (kg CO2e), critical raw material displacement, circularity scores (MCI), and LCA methodology. |
| **EXECUTIVE** | C-Suite & Enterprise Leadership | Executive summary, portfolio health distribution, risk highlights, financial recovery potential, and ESG scorecard. |

---

## 3. Server-Side PDF Generation

PDF generation is performed server-side via `pdfGenerator.ts` using `jsPDF`.

### Key Features:
- **Clean Industrial Visual Style**: High-contrast typography, formal headers/footers, and clean tabular layouts.
- **Enterprise Branding**: Dynamic injection of company logo, legal name, and custom disclaimer notes configured under `/organization/settings`.
- **Watermark Enforcement**: If an analysis or dataset contains synthetic or demo records, a diagonal semi-transparent **`DEMO DATASET`** watermark is stamped across every page.
- **Verification QR & Digital Fingerprint**: Every PDF includes the report's SHA-256 content hash and a direct verification URI to EcoIntel's public verification gateway.

---

## 4. Asynchronous Queue Architecture

Report generation uses BullMQ via Redis with an automatic synchronous in-memory fallback for lightweight or standalone test runs:

```
[User / API Request]
         ↓
[POST /api/reports/generate]
         ↓
[report-generation Queue (BullMQ)]
         ↓
[report.worker.ts] ─── (Collect All Phase Models)
         ↓
[calculateCompleteness()]
         ↓
[generateStructuredSections()]
         ↓
[pdfGenerator.ts] ─── (Render Clean PDF Buffer)
         ↓
[MongoDB Report Record] ─── Status: READY
         ↓
[Notification Dispatched] ─── "Report REP-... is ready"
```

---

## 5. Security & Sharing

- **Role-Based Downloads**: Only authenticated users belonging to the asset's organization or authorized platform auditors can download raw PDFs or CSV datasets.
- **Tokenized Sharing (`ReportShare`)**: Users can generate time-limited (1–30 days) cryptographically random share tokens with granular permissions (`VIEW` or `DOWNLOAD`).
- **Audit Logging**: Every report generation, view, download, and share event is logged to `AuditLog` with IP address, user ID, and timestamp.
