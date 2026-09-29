# System Limitations - TerraGuard AI

## 1. Physical & Data Boundaries

### 1.1 Earthquakes
- **Deterministic Prediction**: Strictly impossible. Seismic predictions are limited to statistical hazard estimations, aftershock decay models (Omori law), and live shaking propagation (MMI/PGA).

### 1.2 Global Precipitation & Microclimates
- Global satellite precipitation (NASA GPM IMERG) provides spatial resolution down to 0.1° (~10km). Local micro-bursts or hyper-local urban drainage failures below this scale may be undetected without local gauge telemetry.

### 1.3 Radar Coverage Constraints
- Severe convective weather algorithms rely on global numerical weather parameters (CAPE, shear, CIN). High-resolution Doppler radar availability varies by nation.

### 1.4 Bathymetric Resolution for Tsunamis
- Initial tsunami risk evaluation is based on seismic parameters and geographic proximity. High-fidelity shallow-water bathymetric wave propagation requires heavy hydrodynamic modeling engines.
