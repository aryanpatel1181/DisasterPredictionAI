# TerraGuard AI 🌍⚡

> Autonomous, Global AI-Powered Natural-Disaster Intelligence, Forecasting, Risk-Assessment & Early-Warning Command Center.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.11+-green.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)
![MapLibre](https://img.shields.io/badge/MapLibre_GL-4.0+-blue.svg)

---

## 📌 Executive Summary

**TerraGuard AI** is a production-grade, global decision-support engine designed to ingest near-real-time environmental telemetry, numerical weather predictions, seismic feeds, and satellite observations to compute calibrated probabilistic natural disaster risk assessments with transparent SHAP explanations.

### Supported Disaster Categories
1. 🌊 **Flood Risk & River Inundation** (Milestone 2 - Multi-horizon forecasting)
2. 🌋 **Earthquake Monitoring, Hazard & Aftershock Probability** (Live USGS/GDACS feeds)
3. 🌊 **Tsunami Risk Evaluation** (Seismic & tectonic triggers + bathymetric context)
4. 🌪️ **Severe Convective Weather** (CAPE, CIN, helicity, shear favorable conditions)
5. 🌀 **Tropical Cyclones** (Track forecasts, maximum sustained winds, central pressure)

---

## 🏗 Architecture Overview

TerraGuard AI is structured as a high-performance monorepo:

```
.
├── apps/
│   ├── api/             # FastAPI Backend Service (REST, WebSockets, OpenAPI)
│   └── web/             # Next.js 14 Command-Center Frontend (MapLibre GL, Recharts)
├── services/
│   ├── ingestion/       # Adapter network (USGS, GDACS, WMO/CAP, NASA GPM, GloFAS)
│   ├── feature-engine/ # Geospatial & atmospheric feature processing pipeline
│   ├── risk_engine/    # Probabilistic risk normalization & model execution
│   ├── explanation-engine/ # Structured SHAP & deterministic explanation synthesis
│   └── alert-engine/   # Official emergency warnings mapper (WMO CAP / GDACS)
├── ml/                  # Disaster specific ML models, pipelines & model registry
│   ├── flood/
│   ├── earthquake/
│   ├── tsunami/
│   ├── severe-weather/
│   └── cyclone/
├── packages/
│   ├── shared/          # Core models, validation rules & domain constants
│   ├── schemas/         # Pydantic v2 & GeoJSON schema definitions
│   └── geo/             # Spatial indexing, distance, clustering & bounding box math
├── infrastructure/      # Docker Compose, PostGIS, Redis & Nginx deployment scripts
└── docs/                # Comprehensive engineering and scientific documentation
```

---

## 🚀 Quickstart Guide

### Prerequisites
- Docker & Docker Compose (v2.20+)
- Python 3.11+
- Node.js 20+

### Local Setup
```bash
# 1. Clone repository
git clone https://github.com/terraguard-ai/terraguard.git
cd terraguard

# 2. Copy environment template
cp .env.example .env

# 3. Spin up full Docker stack (Database, Redis, API, Frontend, Ingestion Workers)
docker compose up -d

# Access services:
# Web Dashboard: http://localhost:3000
# OpenAPI Specs: http://localhost:8000/docs
# Health Endpoint: http://localhost:8000/api/v1/health
```

---

## 🧪 Running Tests

```bash
# Run backend pytest suite (unit, integration, adapters, geospatial)
pytest

# Run frontend vitest suite
cd apps/web && npm test
```

---

## 📜 Documentation Index

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Data Source Adapters](docs/DATA_SOURCES.md)
- [Machine Learning & Risk Pipeline](docs/ML.md)
- [REST & WebSocket API Specs](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Security & Compliance](docs/SECURITY.md)
- [System Limitations](docs/LIMITATIONS.md)
- [Scientific Integrity Guidelines](docs/SCIENTIFIC_INTEGRITY.md)

---

## ⚖️ Scientific Integrity Notice

TerraGuard AI is an **experimental decision-support platform** and NOT a substitute for national emergency management authorities. Earthquake forecasting capability focuses strictly on live monitoring, aftershock statistical probability, population exposure, and shaking estimates. **Deterministic prediction of exact earthquake timing and magnitude is scientifically impossible and never claimed.**
