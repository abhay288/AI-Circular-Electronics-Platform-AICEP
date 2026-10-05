# EcoIntel — Health Assessment & Remaining Useful Life (RUL) Prediction Engine

> **Critical Scientific Notice:**  
> Remaining Useful Life (RUL) predicted from optical RGB inspection of printed circuit boards is an **estimate** based on observable physical deterioration, visible anomalies, and physics-of-failure extrapolation. It must **not** be treated as a destructive laboratory reliability qualification (such as accelerated HALT/HASS, X-ray laminography, or acoustic micro-imaging).

---

## 1. What RUL Means in EcoIntel

**Remaining Useful Life (RUL)** is the estimated duration (in operating hours, duty cycles, and equivalent calendar years) before an electronic component or PCB assembly crosses an operational failure threshold. 

In circular electronics, RUL intelligence determines:
1. **Direct Reuse Feasibility:** Components with high RUL (>5 years, Health Grade A/B) can be desoldered and listed on circular component marketplaces.
2. **Refurbishment Candidates:** Subsystems with localized degradation (e.g., electrolytic capacitor drying, solder joint micro-cracking) are scheduled for precision rework.
3. **Hydrometallurgical Recycling:** Boards nearing end-of-life or severe thermal damage are routed directly to precious metal recovery (Phase 5).

Every output clearly distinguishes data provenance:
- **`MEASURED`:** Physical dimensions, camera sensor optical telemetry, board geometry.
- **`ESTIMATED`:** Physics-of-failure stress models (Arrhenius kinetics, Coffin-Manson cycle fatigue).
- **`INFERRED`:** Inferred hidden inter-layer traces, netlist topology relationships.
- **`PREDICTED`:** Machine learning regression outputs (XGBoost regression, survival curves).
- **`SIMULATED`:** Interactive what-if stress scenario simulations.

---

## 2. Required Input Data Contract

EcoIntel enforces strict type safety and completeness metrics via `RULInput`:

| Feature | Unit / Type | Provenance | Significance |
| :--- | :--- | :--- | :--- |
| `analysisId` | String | Measured | Foreign key linking Detection and PCB analysis |
| `visualHealthScore` | 0 – 100 | Measured (Phase 3) | Optical integrity score of board traces and substrate |
| `corrosionScore` | 0 – 100 | Measured (Phase 3) | Extent of visible electrolytic dendrite or oxide growth |
| `thermalDamageScore` | 0 – 100 | Measured (Phase 3) | Burnt traces, substrate discoloration, delamination |
| `physicalDamageScore` | 0 – 100 | Measured (Phase 3) | Scratches, substrate fractures, lifted pads |
| `componentAgeYears` | Years (float) | Inferred / Metadata | Elapsed calendar operating age since manufacturing date |
| `operatingHours` | Hours (int) | Measured / Telemetry | Logged active duty operating hours from system logs |
| `operatingCycles` | Cycles (int) | Measured / Telemetry | Power on/off thermal expansion cycles |
| `temperatureC` | Celsius (float) | Inferred / Telemetry | Average operating temperature of critical power rails |
| `voltageV` | Volts (float) | Inferred / Telemetry | Supply rail input voltage |
| `loadPercentage` | 0 – 100% | Inferred / Telemetry | Electrical duty load ratio |

### Missing Data & Scientific Honesty
If operational history (hours, cycles, temperature) is unavailable (e.g., an unpowered discarded PCB found in e-waste):
- The engine assigns status `INSUFFICIENT_DATA` or `PARTIAL`.
- The system returns an optical condition health assessment.
- **The system does NOT invent precise operational lifespans** (e.g. it refuses to fabricate claims like *"7.23 years remaining"* without telemetry).

---

## 3. Physics-of-Failure & ML Architecture

EcoIntel fuses empirical machine learning with classic electronic reliability physics:

### 1. Thermal Degradation (Arrhenius Equation)
Degradation rate $k(T)$ accelerates exponentially with operating temperature $T$:
$$AF_{\text{thermal}} = \exp\left[\frac{E_a}{k_B} \left(\frac{1}{T_{\text{nominal}}} - \frac{1}{T_{\text{operating}}}\right)\right]$$
where:
- $E_a = 0.7\text{ eV}$ (standard semiconductor activation energy),
- $k_B = 8.617 \times 10^{-5}\text{ eV/K}$ (Boltzmann constant),
- $T_{\text{nominal}} = 298.15\text{ K}$ (25°C baseline).

### 2. Solder Joint Thermal Fatigue (Coffin-Manson Model)
Mechanical stress from cyclic thermal expansion mismatch:
$$N_f = C \cdot (\Delta T)^{-\beta}$$
where $\Delta T = T_{\text{max}} - T_{\text{min}}$ and $\beta \approx 1.9 - 2.5$.

### 3. Voltage Stress (Inverse Power Law)
$$AF_{\text{voltage}} = \left(\frac{V_{\text{operating}}}{V_{\text{nominal}}}\right)^n$$
with stress exponent $n \approx 2.5$.

### 4. XGBoost Regression
The features are normalized and fed into an XGBoost regression model trained on reliability datasets:
```python
model = xgb.XGBRegressor(
    n_estimators=150,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.85,
    colsample_bytree=0.85
)
```

---

## 4. Uncertainty & Prediction Intervals

No point estimate is presented without statistical uncertainty bounds:
$$\text{RUL}_{\text{range}} = \left[\hat{y} - z \cdot \hat{\sigma},\; \hat{y} + z \cdot \hat{\sigma}\right]$$

Every prediction returns:
- `rulHours` and `rulYears` (Expected mean),
- `predictionInterval.lowerBoundHours` / `upperBoundHours` (95% confidence interval),
- `predictionInterval.lowerBoundYears` / `upperBoundYears`,
- `confidence` (Model confidence score: $0.0 - 1.0$),
- `uncertaintyHours` (Estimated standard error).

---

## 5. Health Assessment & Scoring Taxonomy

Before calculating remaining life, EcoIntel computes a normalized **Hardware Health Score (0–100)**:

| Score | Status | Description | Recommended Circular Action |
| :---: | :---: | :--- | :--- |
| **90 – 100** | `HEALTHY` | Pristine condition, zero observable trace or component damage | High-value direct reuse / marketplace listing |
| **75 – 89** | `GOOD` | Nominal aging, minimal wear, intact solder joints | Direct reuse / secondary circular deployment |
| **50 – 74** | `FAIR` | Moderate thermal or electrical wear, light oxidation | Preventative refurbishment or testing |
| **25 – 49** | `DEGRADED` | Significant corrosion, thermal discoloration, or trace fracture | Component harvesting or precision board repair |
| **0 – 24** | `CRITICAL` | Severe physical cracking, burnt substrate, open traces | Material recovery / hydrometallurgical extraction |

---

## 6. Provider Abstraction & Model Registry

The platform supports multiple interchangeable providers:
- **`MockRULProvider`**: Physics-informed deterministic calculation for demo samples and offline testing.
- **`XGBoostRULProvider`**: Production gradient-boosted decision tree model executed via the FastAPI AI microservice (`ai-service/rul/`).
- **`LightGBMRULProvider` / `LSTMRULProvider` / `PhysicsInformedRULProvider`**: Future capability interfaces for continuous temporal IoT sensor streams and FEA thermal strain simulations.

Configuration via `.env`:
```env
RUL_PROVIDER=mock      # Options: mock | xgboost
AI_SERVICE_URL=http://localhost:8001
AI_SERVICE_INTERNAL_KEY=eco-intel-internal-ai-key-2026
```

If `RUL_PROVIDER=xgboost` is selected and the model microservice is unreachable, the system raises an explicit `PROVIDER_UNAVAILABLE` error rather than silently faking results.

---

## 7. Interactive Scenario Simulation (What-If Analysis)

Users can tune operating conditions without altering baseline records:
- **Parameters:** Temperature (-10°C to +85°C), Voltage (3V to 24V), Electrical Load (10% to 100%), Operating Cycles (500 to 15,000).
- **Execution:** Invokes `POST /api/rul/:analysisId/scenario`.
- **Display:** Outputs are clearly labeled **`SIMULATION / WHAT-IF SCENARIO`** with the comparative delta (e.g., *"-1.6 Years RUL due to +15°C elevated thermal stress"*). Baseline MongoDB documents remain unmodified.

---

## 8. Verification & Test Suite

The RUL engine is verified by comprehensive end-to-end tests:
- `scripts/verify-phase4-rul.ts` (18 scenarios covering mock provider, XGBoost microservice, missing data handling, scenario simulation, database persistence, component health propagation, and session progression).
- Run verification: `npx tsx scripts/verify-phase4-rul.ts`.
