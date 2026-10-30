# Free-only portfolio hosting

Target: Vercel **Hobby** for `apps/web`, Render **Free** for the Python API.
No paid database, cache, disk, domain, cron, or keep-alive service is required.
This is a low-traffic non-commercial demonstration, not an operational warning system.

## Render API

- Repository: `aryanpatel1181/DisasterPredictionAI`, branch `master`.
- Runtime: Docker, context `.`, Dockerfile `apps/api/Dockerfile`.
- Instance: **Free**, one worker; region Ohio.
- Health check: `/api/v1/health` (process liveness, not data-provider readiness).
- `render.yaml` records the equivalent blueprint. Do not apply it over a service
  created through the dashboard/API without reconciling that existing service first.
- Environment: `ENVIRONMENT=production`, `PORT=8000`,
  `DATABASE_URL=sqlite+aiosqlite:////tmp/terraguard.db`, `CORS_ORIGINS=[]`,
  `OPENBLAS_NUM_THREADS=1`, `OMP_NUM_THREADS=1`, `MPLCONFIGDIR=/tmp/matplotlib`.
- Generate unique random `SECRET_KEY` and `API_PROXY_TOKEN` secrets. Set the same
  `API_PROXY_TOKEN` on the Next.js server. Never commit either secret or use a
  `NEXT_PUBLIC_` prefix.
- Optional: configure `OPENROUTER_API_KEY` directly in Render. Keep
  `OPENROUTER_MODEL=openrouter/free` and do not enable paid fallbacks. Without a
  key, chat explicitly runs in fallback mode; Weather Atlas still works.

## Vercel frontend

- Use the owner's **Hobby** account, not a paid team or trial.
- Import the GitHub repository with root directory **`apps/web`**.
- Framework: Next.js; Node.js 22; install `npm ci`; build `npm run build`.
- Production server variables: `API_INTERNAL_URL=https://<api-host>.onrender.com`
  (no trailing slash), and matching secret `API_PROXY_TOKEN`.
- Use separate preview secrets/backends if previews are enabled. Do not place
  provider keys or the API token in browser code.
- The website calls same-origin `/api/v1/*`; only Next.js talks to Render.
  `/api/weather` and `/api/weather/search` run on Vercel and do not wait for Render.

## Limits and safety

- Render Free sleeps after 15 idle minutes and may take about a minute to wake.
  The frontend proxy times out after 50 seconds, so the first request may show a
  temporary-unavailable message; retry after the API wakes. Do not schedule pings
  to circumvent free-tier sleeping.
- SQLite, ingestion cache, conversations, and analytics are ephemeral. Restarts
  and redeploys reset them. Current routes do not use Postgres or Redis; history
  filters the current feed and is not a durable historical archive.
- A configured API token protects HTTP routes and WebSockets, except public
  health. Global rolling limits allow 120 API calls/minute and 6 chat POSTs/minute
  per process. These intentionally small demo limits are not a distributed WAF.
- Keep training offline. The public training endpoint is disabled.
- The Vercel split path does not use the Docker Nginx gateway. Weather routes have
  upstream timeouts and caching, but no application-level distributed limiter.
  Monitor usage and configure platform firewall controls before wider promotion.
- Free weather and map providers have usage/licensing limits. Open-Meteo data is
  model-based, and visual weather effects are illustrations, not live footage.
- Do not add a payment method, enable paid overages, purchase a domain, upgrade a
  plan, or provision paid services without the owner's approval. Recheck provider
  limits before release; a free plan does not imply unlimited traffic.

## Release verification

Check `/`, `/weather`, city search and switching, real weather timestamps, feeds,
research labels, chat fallback/live status, desktop/mobile views, and browser
console/network errors. Direct API calls without the proxy token must return 401;
health must return 200. Confirm the actual hosting plans are free.

Official references: [Render Free](https://render.com/docs/free),
[Vercel Hobby](https://vercel.com/docs/plans/hobby),
[Open-Meteo terms](https://open-meteo.com/en/terms).
