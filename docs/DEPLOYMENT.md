# Deployment & Infrastructure - TerraGuard AI

## 1. Docker Compose Stack
The platform is fully containerized for local development and production deployment.

### Container Architecture
- `db`: PostgreSQL 16 with PostGIS 3.4 extensions enabled.
- `redis`: Redis 7.2 for caching telemetry, rate limiting, and task queues.
- `api`: FastAPI application serving REST endpoints and WebSockets.
- `web`: Next.js 14 Web Application serving the interactive MapLibre GL UI.
- `worker`: Ingestion worker service running scheduled data collection jobs.

## 2. Infrastructure Commands
```bash
# Build and launch stack
docker compose up --build -d

# View container logs
docker compose logs -f api

# Execute database migrations
docker compose exec api alembic upgrade head
```
