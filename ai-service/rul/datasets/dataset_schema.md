# EcoIntel RUL Dataset Schema & Physics-Informed Degradation Specification

## 1. Objective & Scientific Framework
Predicting Remaining Useful Life (RUL) of printed circuit boards and electronic components requires integrating physics-of-failure stress models with empirical regression trees. Visual inspection alone only yields surface degradation anomalies (discoloration, dendritic corrosion, broken traces). True RUL modeling synthesizes:

1. **Arrhenius Thermal Acceleration Model**:
   $$AF_T = \exp\left[\frac{E_a}{k_B} \left(\frac{1}{T_{use}} - \frac{1}{T_{stress}}\right)\right]$$
   where $E_a \approx 0.7\text{ eV}$ for silicon junction gate oxide degradation.

2. **Inverse Power Law for Voltage Overstress**:
   $$AF_V = \left(\frac{V_{stress}}{V_{nominal}}\right)^\beta \quad (\beta \approx 2.5 - 3.5)$$

3. **Coffin-Manson Thermal Cycle Solder Fatigue**:
   $$N_f = C \cdot (\Delta T)^{-\gamma} \quad (\gamma \approx 1.9 - 2.5\text{ for SAC305 lead-free solder})$$

---

## 2. Dataset Feature Schema

| Field Name | Type | Unit | Range | Description |
| :--- | :--- | :--- | :--- | :--- |
| `component_type` | Categorical | - | IC, Capacitor, Resistor, Inductor, Switch, Diode | Component physical taxonomy |
| `component_age_years` | Float | Years | 0.0 - 25.0 | Calendar age since assembly / wafer date code |
| `operating_hours` | Float | Hours | 0 - 150,000 | Active duty operating uptime |
| `operating_cycles` | Integer | Cycles | 0 - 1,000,000 | Power-on / thermal power cycle transitions |
| `temperature_c` | Float | °C | -20.0 - 125.0 | Sustained junction / board ambient temperature |
| `voltage_v` | Float | Volts | 0.5 - 48.0 | Input rail voltage |
| `current_a` | Float | Amperes | 0.01 - 30.0 | Steady-state current draw |
| `load_percentage` | Float | % | 0 - 100 | Rated dynamic utilization load |
| `visual_damage_score` | Float | % | 0.0 - 100.0 | Visual surface anomaly penalty from Phase 3 vision |
| `corrosion_severity` | Float | Score | 0.0 - 1.0 | Visual dendrite / oxidation severity index |
| `thermal_stress_score`| Float | Score | 0.0 - 1.0 | Solder mask discoloration / heat dissipation penalty |
| `pcb_integrity_score` | Float | % | 0.0 - 100.0 | Overall PCB structural substrate integrity score |
| `maintenance_count` | Integer | Count | 0 - 20 | Historical repair / rework interventions |
| `remaining_hours` | Float | Hours | 0 - 100,000 | **Target variable**: Ground-truth remaining lifetime |

---

## 3. Synthetic vs. Production Calibration Notice
When training on synthetic physics simulations:
- The model serves as an educational and proof-of-concept degradation estimator.
- **Production Validation Requirement**: Actual mission-critical hardware deployment requires Weibull life test data, accelerated life testing (ALT / HALT), and telemetry logging from deployed field units.
