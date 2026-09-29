# TerraGuard AI - Project State

## Current Overview
TerraGuard AI is an autonomous, global AI-powered natural-disaster intelligence, forecasting, risk-assessment, and early-warning platform.

## Operational Status (Milestones 1 & 2 Complete + Universal Global Geocoding)
- **Universal Global City Risk Engine**:
  - OpenStreetMap Nominatim live geocoding search on [location/page.tsx](file:///c:/Users/aryan/Projects/DisasterPredictionAI/apps/web/src/app/location/page.tsx).
  - Evaluates calibrated disaster risk scores for **ANY city or coordinate globally** (e.g., Ahmedabad, Chicago, Tokyo, London, Mumbai, Nairobi, Santiago, Manila, etc.).
- **Continuous AI Disaster Risk Prediction Engine**:
  - Module: [services/risk_engine/predictive_pipeline.py](file:///c:/Users/aryan/Projects/DisasterPredictionAI/services/risk_engine/predictive_pipeline.py)
  - Trained Models: XGBoost, LightGBM, Random Forest with Platt sigmoid calibration.
  - Multi-Horizon Forecast Windows: Explicit `6h`, `12h`, `24h`, and `72h` prediction windows.
  - API Endpoints: `GET /api/v1/predictions` & `POST /api/v1/predictions/train` ([predictions.py](file:///c:/Users/aryan/Projects/DisasterPredictionAI/apps/api/routers/predictions.py)).

## Test Suite & Verification Results
- **Pytest Suite**: 14/14 tests passing (100% success rate).
