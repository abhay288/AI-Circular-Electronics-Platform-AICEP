# EcoIntel Phase 9: Carbon Impact, Circularity Metrics & ESG Intelligence

## 1. Executive Overview

EcoIntel Phase 9 implements an enterprise **Scope 3 Life-Cycle Assessment (LCA) and Circularity Accounting Engine** for electronics. Rather than generating simplistic or fabricated carbon avoidance claims, EcoIntel introduces an **auditable, double-counting protected, factor-based accounting ledger** that contrasts baseline linear pathways against circular pathways (Reuse, Repair, Refurbish, Remanufacture, and Material Recovery).

> **Important Disclosure & Boundary Notice:**
> "EcoIntel environmental impact values are engineering estimates based on configured methodologies, emission factors, and available asset data. They are not independently verified regulatory carbon-accounting certificates unless supported by an appropriate external verification process."

---

## 2. Carbon Accounting Architecture

```
                       +-----------------------------------+
                       |      Analysis Diagnostics         |
                       |  - Component Detection (Phase 2)  |
                       |  - RUL Reliability (Phase 4)      |
                       |  - Material Recovery (Phase 5)    |
                       |  - Repair Outcomes (Phase 6)      |
                       +-----------------+-----------------+
                                         |
                                         v
                       +-----------------------------------+
                       |      CarbonImpactProvider         |
                       |  - MockCarbonImpactProvider       |
                       |  - FactorBasedCarbonProvider      |
                       +-----------------+-----------------+
                                         |
             +---------------------------+---------------------------+
             |                                                       |
             v                                                       v
+-----------------------------+                         +-----------------------------+
| Material Emission Factors   |                         |  Scenario Accounting Model  |
| - Ecoinvent 3.9 Datasets    |                         |  - Baseline: DISCARD        |
| - USGS Mineral Yearbook     |                         |  - Circular: REPAIR/REUSE   |
| - IAI Aluminium / WGC Gold  |                         |  - Virgin Displacement     |
+--------------+--------------+                         +--------------+--------------+
               |                                                       |
               +---------------------------+---------------------------+
                                           |
                                           v
                       +-----------------------------------+
                       |    Auditable Impact Ledger        |
                       |  - Double-Counting Protection     |
                       |  - Exclusive Booking Records      |
                       |  - Potential vs Realized Tracking |
                       +-----------------+-----------------+
                                         |
                                         v
                       +-----------------------------------+
                       |         MongoDB Datastore         |
                       |  - CarbonImpact                   |
                       |  - ImpactLedgerEntry              |
                       |  - MaterialEmissionFactor         |
                       |  - ImpactMethodology              |
                       +-----------------+-----------------+
                                         |
          +------------------------------+------------------------------+
          |                              |                              |
          v                              v                              v
+-------------------+          +-------------------+          +-------------------+
| Asset Workspace   |          | Org ESG Dashboard |          | Digital Passport  |
| /console/results  |          | /impact           |          | Metadata & Events |
| (Waterfall & Sim) |          | (Trends & Export) |          | (Traceable Scope) |
+-------------------+          +-------------------+          +-------------------+
```

---

## 3. Impact Methodology: The Material Displacement Method

### 3.1 Mathematical Formulation

$$\text{Net Avoided } \text{CO}_2\text{e} = \text{Gross Avoided Emissions} - \text{Circular Process Emissions}$$

Where:
$$\text{Gross Avoided Emissions} = \sum_{i} \left( M_i \times D_i \times EF_i \right) + E_{\text{mfg,avoided}}$$
$$\text{Circular Process Emissions} = E_{\text{repair/test}} + E_{\text{transport}}$$

- $M_i$: Estimated recoverable mass of element $i$ (kg).
- $D_i$: Empirically bounded virgin displacement factor (fraction $< 1.0$, acknowledging that secondary materials do not achieve 100% substitution efficiency).
- $EF_i$: Primary mining/smelting emission factor for virgin element $i$ ($\text{kgCO}_2\text{e}/\text{kg}$).
- $E_{\text{mfg,avoided}}$: Embodied manufacturing footprint of avoided replacement component production.
- $E_{\text{repair/test}}$: Electrical and consumable overhead of diagnostic testing and rework.
- $E_{\text{transport}}$: Reverse logistics footprint (assumed at 12 g $\text{CO}_2\text{e}$/km-unit).

---

## 4. Empirical Displacement Factors

EcoIntel avoids the scientific fallacy of assuming 100% displacement of primary metals. Secondary metal recovery involves slag loss, hydrometallurgical reagents, and metallurgical downgrading:

| Material | Virgin Emission Factor ($EF$) | Displacement Ratio ($D$) | Primary Source |
|---|---|---|---|
| **Copper** | 4.5 $\text{kgCO}_2\text{e}/\text{kg}$ | 85% (0.85) | Ecoinvent 3.9 / Cut-off System Model |
| **Gold** | 12,500 $\text{kgCO}_2\text{e}/\text{kg}$ | 90% (0.90) | World Gold Council / USGS Minerals 2024 |
| **Aluminum** | 8.2 $\text{kgCO}_2\text{e}/\text{kg}$ | 80% (0.80) | International Aluminium Institute (IAI) |
| **Tin** | 16.8 $\text{kgCO}_2\text{e}/\text{kg}$ | 70% (0.70) | International Tin Association (ITA) |
| **Silicon** | 28.0 $\text{kgCO}_2\text{e}/\text{kg}$ | 60% (0.60) | Semiconductor Industry Association (SIA) |
| **Steel** | 1.85 $\text{kgCO}_2\text{e}/\text{kg}$ | 75% (0.75) | World Steel Association LCI |
| **FR-4 Epoxy** | 6.5 $\text{kgCO}_2\text{e}/\text{kg}$ | 50% (0.50) | IPC-1752A Association Standards |

---

## 5. Double-Counting Prevention via Impact Ledger

A core failure of naive sustainability platforms is double-counting. For example:
- **Flawed approach:** Crediting an organization for **reusing** an MCU (avoiding a new chip) and *simultaneously* crediting them for **extracting and selling the copper** inside that same MCU.
- **EcoIntel approach:** The `ImpactLedgerEntry` schema enforces `isExclusive: true`. When a component is routed to `REUSE`, its constituent elements are marked exclusive; subsequent material recovery claims on the same asset ID under the same scenario are rejected by the accounting engine.

---

## 6. Realized vs. Potential Impact

EcoIntel strictly segregates:
1. **POTENTIAL IMPACT:** Predicted environmental benefits based on diagnostic feasibility (e.g. board diagnosed as repairable).
2. **REALIZED IMPACT:** Actualized environmental savings recorded only when a verifiable circular event occurs:
   - Physical repair verified in Phase 6.
   - Component sold and transferred on the Phase 8 marketplace.
   - Refurbished hardware verified in Phase 7 Digital Product Passport.

---

## 7. Uncertainty & Data Quality Scoring

Every calculation reports:
- **Data Completeness (%):** Measures the fraction of diagnostic inputs available (optical scan, layer count, mass, RUL).
- **Confidence Rating:** `HIGH` (measured physical mass and authoritative factors), `MEDIUM` (database-derived component weights), `LOW` (generic board heuristics).
- **Uncertainty Bounds:** Explicit range (e.g. nominal $22.4 \text{ kg}$, min $19.0 \text{ kg}$, max $25.8 \text{ kg}$ at $\pm 15\%$).

---

## 8. API Endpoints Reference

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/carbon/analyze` | POST | Triggers synchronous or BullMQ queued carbon impact calculation. |
| `/api/carbon/:analysisId` | GET | Retrieves full `CarbonImpact` document for asset with org isolation. |
| `/api/carbon/:analysisId/breakdown` | GET | Returns step-by-step carbon waterfall (Credits vs Debits). |
| `/api/carbon/:analysisId/scenarios` | GET | Returns comparative scenario outcomes. |
| `/api/carbon/:analysisId/methodology` | GET | Returns mathematical formula, scope, and bibliographic sources. |
| `/api/carbon/:analysisId/ledger` | GET | Returns auditable ledger entries and exclusivity status. |
| `/api/carbon/:analysisId/data-quality` | GET | Returns data completeness, uncertainty range, and limitations. |
| `/api/impact/organization/summary` | GET | Aggregates organization-wide net avoided emissions and diversion. |
| `/api/impact/organization/trends` | GET | Generates daily/monthly/quarterly time-series trends. |
| `/api/impact/organization/esg` | GET | Generates audit-ready ESG reporting summary. |
| `/api/impact/scenario` | POST | What-if scenario comparative simulator. |
| `/api/carbon/factors` | GET / POST | Factor database listing and admin creation. |
| `/api/carbon/factors/:factorId` | PATCH | Factor status activation/deactivation. |

---

## 9. Regulatory & Standards Alignment

- **GHG Protocol Scope 3 Guidance:** Categorized under Category 1 (Purchased Goods and Services - cradle-to-gate avoidance) and Category 12 (End-of-Life Treatment of Sold Products).
- **EU Corporate Sustainability Due Diligence Directive (CSDDD):** Provides auditable primary data for electronics reuse.
- **EU Ecodesign for Sustainable Products Regulation (ESPR):** Directly linked to the Digital Product Passport (DPP).
