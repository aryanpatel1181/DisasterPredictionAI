# TerraGuard AI

A full-stack environmental intelligence portfolio: explore global hazard records, inspect evidence, and discuss preparedness through an optional AI assistant.

## What you can demonstrate

- Responsive observatory with an interactive MapLibre map, location search, category filters, and event evidence.
- Separate observation and research views, plus filtered JSON export.
- Source status with explicit unavailable and demo states.
- FastAPI provider adapters, normalized schemas, two-minute ingestion cache, and source provenance.
- Flood model experiments using synthetic training data, explicitly labelled as research.
- Conversational assistant using a server-side OpenRouter integration, with a knowledge fallback.
- A project notes page explaining architecture, limitations, and next engineering steps.
- Weather Atlas at `/weather`: globe-to-city exploration, Open-Meteo current model conditions, location search, and illustrative rain, snow, cloud, fog, heat and clear-sky effects.

## Run locally

Requirements: Docker Desktop with its Linux engine running.

From this repository, create a settings file only if one does not exist:

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
docker compose up --build
```

Open http://localhost:3000. API documentation: http://localhost:8000/docs.
The browser sends requests through Next.js; `API_INTERNAL_URL` points Next.js at FastAPI.
For development without Docker, start FastAPI at port 8000 and run `npm run dev` from `apps/web`.
The Weather Atlas uses Next.js server routes directly and does not require FastAPI. It uses the free, non-commercial Open-Meteo service; check provider terms before commercial deployment. City detail uses OpenStreetMap tiles; weather animation is not radar or live footage.

## Verify

```powershell
cd apps/web
npm ci
npm test
npm run build
npm audit
```

Backend checks: `python -m pytest -q` from the repository root after installing `requirements.txt`.
Browser smoke checks: start the frontend on port 3001, install the root npm dependencies, create `work/`, then run `node tests/browser-smoke.cjs`. Browser tests use labelled fixtures and do not verify live providers.

## Deployment

Use [the deployment guide](docs/DEPLOYMENT.md). A separate production Compose file includes a rate-limited gateway, private API/database/Redis services, persistent PostGIS storage, and the production Next.js build.

## Scientific scope

This is an experimental portfolio project. Synthetic model metrics are not evidence of real-world forecasting accuracy. Existing research and location-risk routines are demonstrations; live flood, cyclone, and aftershock forecasts are not validated. Provider fallback records are labelled as sample data. The assistant does not have a verified 14-day weather integration in this checkout.

Earthquake monitoring describes recorded events; exact future earthquake time, location, and magnitude are not predicted. Follow official local emergency guidance.

## Architecture

```text
Browser → Next.js same-origin API proxy → FastAPI → provider adapters
           MapLibre / React               schema + provenance
           evidence + export              ingestion cache
                                         synthetic ML research
```

See `docs/` for additional architecture notes. Earlier milestone documents describe intended architecture and may include features still awaiting validation.
