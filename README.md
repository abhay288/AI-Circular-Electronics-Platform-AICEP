# ♻️ EcoIntel — Enterprise AI Platform for Circular Electronics Intelligence

> **Transforming Electronic Waste into Verifiable Circular Value & ESG Intelligence**

EcoIntel is an enterprise-grade AI, computer vision, digital twin, and blockchain traceability platform designed to accelerate circularity in the electronics industry. Rather than consigning discarded printed circuit boards (PCBs) and electronics to landfills, EcoIntel orchestrates an end-to-end intelligence pipeline: automatically detecting reusable components, predicting remaining useful life (RUL), analyzing PCB topology, estimating recoverable precious metals, minting blockchain-backed Digital Product Passports (DPP), facilitating circular marketplace trade, quantifying Scope 3 avoided carbon emissions, and generating executive audit-grade intelligence dossiers.

---

## 1. 🏗️ Complete Platform Architecture

EcoIntel operates across ten tightly integrated lifecycle phases:

```
                                      ECOINTEL
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        │                                │                                │
     ANALYZE                          ASSESS                            TRACE
        │                                │                                │
  Phase 1 & 2: YOLO/AI            Phase 4: Health & RUL            Phase 7: Digital Passport
  Component Detection             Survival Analysis (XGBoost)      Blockchain Traceability
        │                                │                                │
  Phase 3: PCB Topology           Phase 5: Material Recovery       Phase 8: Circular Marketplace
  Trace/Pad Reconstruction        Precious Metal Estimation        Component Exchange
        │                                │                                │
        └────────────────────────────────┼────────────────────────────────┘
                                         │
                                    CIRCULARITY
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                  REPAIR                REUSE               RECYCLE
                    │                    │                    │
            Phase 6: Repair Decision Engine & Step-by-Step Instructions
                    │                    │                    │
                    └────────────────────┼────────────────────┘
                                         │
                                Phase 9: CARBON / ESG
                                Avoided Scope 3 Emissions & MCI
                                         │
                              Phase 10: ENTERPRISE DOSSIERS
                                Executive Analytics & PDF Reports
```

---

## 2. ⚡ Key Capabilities & Phase Map

- **Phase 1 — Foundation & Analysis Session**: Multi-tenant session state machine, asset telemetry, and raw scan ingestion.
- **Phase 2 — AI Component Detection**: High-precision visual detection using YOLO, identifying ICs, MOSFETs, capacitors, resistors, and edge connectors.
- **Phase 3 — PCB Intelligence & Topology**: 2D/3D PCB reconstruction, layer estimation, trace routing, defect isolation, and synthetic Gerber generation.
- **Phase 4 — Health & Remaining Useful Life (RUL)**: Multi-factor health scoring (0–100) and Weibull/XGBoost operational lifespan prediction.
- **Phase 5 — Material Recovery & Precious Metals**: Estimation of recoverable Gold, Silver, Copper, Palladium, and Tantalum with real-time commodity pricing.
- **Phase 6 — Repair Intelligence & Circular Decision Engine**: Automated triage into `REUSE`, `REPAIR`, `REFURBISH`, `HARVEST`, or `RECYCLE` with guided procedures.
- **Phase 7 — Digital Product Passport (DPP)**: Tamper-evident lifecycle tracking, on-chain minting, and public QR verification gateways.
- **Phase 8 — Circular Marketplace**: B2B secondary exchange connecting component sellers and buyers with escrow workflows.
- **Phase 9 — Carbon Impact & ESG Intelligence**: Quantification of potential and realized avoided CO2e emissions (GHG Protocol Scope 3) and Material Circularity Indicators (MCI).
- **Phase 10 — Enterprise Reporting & Executive Analytics**: Executive KPI dashboards, real-time portfolio health/RUL distributions, automated PDF/JSON/CSV dossier generation, cross-phase data integrity audits, and unified global search.

---

## 3. 🛠️ Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Vanilla CSS Design System, Lucide Icons, Three.js (3D Viewer) |
| **Backend & APIs** | Next.js Server Components, Route Handlers, Node.js 20, REST API architecture |
| **Database & Cache** | MongoDB Atlas (Mongoose ORM with multi-tenant isolation), Redis 7 |
| **Background Queues** | BullMQ with automated synchronous in-memory development fallback |
| **Reporting & Export** | Server-side jsPDF with branded industrial design, CSV streaming, JSON schemas |
| **AI / Machine Learning** | YOLOv11 / RT-DETR for detection, OpenCV for topology, XGBoost / Weibull for RUL |
| **Blockchain** | EVM-compatible smart contracts, ethers.js / viem, immutable passport events |

---

## 4. 🧭 Scientific Honesty & Evidence Badging

EcoIntel strictly distinguishes verified physical facts from mathematical inferences. Every metric in reports and dashboards carries an explicit evidence tag:

- `MEASURED`: Physical laboratory measurements (e.g. scale-weighed mass, multi-meter readings).
- `KNOWN`: Official manufacturer datasheet specifications or IPC design rules.
- `VERIFIED`: Cryptographically signed on-chain passport events or technician sign-offs.
- `DATABASE-DERIVED`: Statistical averages from peer-reviewed LCA inventories (e.g. Ecoinvent).
- `ESTIMATED`: Algorithmic or geometric approximations (e.g. volumetric density calculation).
- `PREDICTED`: Machine learning survival model forecasts (e.g. XGBoost RUL years).
- `INFERRED`: Optical circuit trace heuristics.
- `SIMULATED`: Scenario modeling (e.g. hypothetical avoided emissions).
- `DEMO`: Explicitly marked synthetic datasets created for sandbox testing.

No synthetic data is ever presented as verified production evidence.

---

## 5. 💻 Installation & Quickstart

### Prerequisites
- Node.js 20 LTS or higher
- MongoDB 6.0+ (Local or MongoDB Atlas)
- Redis 7+ (Optional; development fallback provided)

### 1. Clone & Install
```bash
git clone https://github.com/abhay288/AI-Circular-Electronics-Platform-AICEP.git
cd AI-Circular-Electronics-Platform-AICEP
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```
Update database connection strings and secret keys in `.env.local`.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. 🧪 Testing & Verification

EcoIntel includes comprehensive verification scripts ensuring all enterprise features function cleanly:

```bash
# Verify Phase 10 Enterprise Suite (48 automated assertions)
npm run verify:phase10

# Typecheck the entire codebase
npm run typecheck

# Execute unit and integration tests
npm test
```

---

## 7. 🔐 Environment Variables Summary

Key configuration groups defined in `.env.example`:
- **DATABASE**: `MONGODB_URI`
- **REDIS**: `REDIS_URL`, `REDIS_HOST`, `REDIS_PORT`
- **AUTH**: `JWT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- **STORAGE**: `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
- **BLOCKCHAIN**: `BLOCKCHAIN_RPC_URL`, `PASSPORT_CONTRACT_ADDRESS`
- **AI**: `AI_VISION_URL`, `RUL_MODEL_PATH`
- **REPORTING**: `REPORT_MAX_PAGES`, `DEFAULT_CURRENCY`

---

## 8. 🚢 Production Deployment

For enterprise containerized deployment, consult the comprehensive runbooks:
- [System Architecture](file:///docs/architecture.md)
- [REST API Reference](file:///docs/api.md)
- [Production Deployment Guide](file:///docs/deployment.md)
- [Security & RBAC](file:///docs/security.md)
- [Enterprise Reporting Engine](file:///docs/reporting.md)
- [Operations & Runbooks](file:///docs/operations.md)
- [Troubleshooting & Diagnostics](file:///docs/troubleshooting.md)

---

## 📄 License
EcoIntel is open-source software licensed under the MIT License.
