# Portfolio deployment

## Local preview

Run `docker compose up --build` in the repository root with Docker Desktop running.
Visit http://localhost:3000. Existing .env settings are preserved.

## Production container stack

For the free portfolio hosting setup, see [FREE_HOSTING.md](FREE_HOSTING.md).

1. Choose a Docker-capable host and clone this repository.
2. Create .env from .env.example. Use a strong POSTGRES_PASSWORD without URL-reserved characters (or URL-encode it in DATABASE_URL), and a unique SECRET_KEY. Keep keys server-side.
3. Optionally set OPENROUTER_API_KEY and OPENROUTER_MODEL to enable the assistant. Configure provider spending limits.
4. Run:

```sh
docker compose -f compose.production.yml up -d --build
docker compose -f compose.production.yml logs --tail=100 api web gateway
```

5. Test http://localhost:8080 and /api/v1/health. The health route reports process health; database and Redis fields marked not_checked are not dependency readiness checks.
6. Put the host's managed HTTPS proxy/load balancer in front of port 8080 and configure your domain there. Keep port 8080 private to that proxy where possible.

Only the gateway publishes a port. The API, Redis, and PostGIS remain on the internal Docker network. Nginx limits chat to six requests per minute per client address with a small burst; configure trusted proxy real-IP handling if your host terminates requests upstream.
Never expose the API directly: the public proxy blocks training routes, and gateway limits protect the assistant.

The web image uses a standalone Next.js build and a non-root user. .env files and local caches are excluded from images. API_INTERNAL_URL is a server-only runtime variable; no public localhost URL is needed.

## Release checks

- npm ci, npm test, npm run build and npm audit from apps/web.
- Python tests on a supported Linux runner with requirements.txt.
- Browser smoke tests (labelled fixtures) at desktop and mobile sizes.
- Verify real feed responses, assistant availability, and source fallback labels on the intended host.
- Back up the named database volume before upgrades.

## Known limits

### Weather Atlas

`/weather` fetches current model conditions and city searches through `/api/weather` and `/api/weather/search`. Upstream calls have timeouts, validated coordinates, five-minute weather caching and daily geocoder caching. The production gateway's existing `/api/` rate limit covers both routes. Open-Meteo's free endpoint is non-commercial and rate-limited; obtain the appropriate provider licence and configure a customer endpoint before commercial use or significant traffic. No paid subscription is created by this feature.

OpenStreetMap street tiles load directly in the browser only at regional/city zoom. Preserve visible attribution, browser caching and the current `strict-origin-when-cross-origin` referrer policy. Do not bulk-download tiles. For scale, use a dedicated tile provider. Automated browser tests intercept OSM tiles and weather responses instead of exercising public tile servers. Natural Earth boundaries remain available if street tiles fail.

The weather scenes are illustrative point-based effects, not global radar, measured station observations, live satellite clouds or street-level footage. The valid-time and timezone are displayed. Provider failures show an error, not fabricated conditions; data older than 90 minutes disables effects. Weather resolution depends on the underlying model, even when the map is zoomed into a street. The chatbot is not connected to this weather route yet.

Local Docker builds and the Weather Atlas browser preview have been verified. The release suite includes frontend tests/build and selected backend tests inside a Linux container capped at 512 MB. Native Windows Python can be blocked by Application Control; use Docker or the supplied Linux GitHub Actions workflow in that case. Hosting status and required configuration are documented separately in FREE_HOSTING.md.

Research models train on synthetic data and are not operational forecasts. Ingestion cache and chat/analytics state are process-local; use a single API worker for this portfolio deployment. Multi-instance production service requires durable shared storage, distributed rate limits, reliable worker scheduling, and validated models.
