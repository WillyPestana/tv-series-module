# tv-series-module

A monorepo for the TV Series Module technical challenge: React web UI + Node API + shared domain logic, following Clean Architecture principles.

## Repo structure
- `apps/api` - Node.js REST API (Fastify) on port 7777
- `apps/web` - React UI (Vite)
- `packages/shared` - Domain models, ports, and use cases
- `docs` - OpenAPI.yaml
- `scripts` - Automation and quality gates

## Quick start (local)
```bash
npm ci
npm run build
npm run test
npm run lint
```

## Product features
- Discover screen with async debounced TVMaze search
- API-driven pagination (`/api/search?page=&pageSize=`)
- Show details with episodes grouped by season
- Watched state per episode and bulk toggle per season/show
- Library save/unsave actions from cards and details, persisted in database
- Comments on show or episode
- Ratings (1-5) per show
- Dashboard with top watched/commented/rated shows

## Docker
```bash
docker compose up --build
```

Health check after startup:
```bash
curl http://localhost:7777/health
```

Main app URL:
```bash
http://localhost:7777
```

Note: The solution targets Docker Compose 3.3. With modern Compose v2, the explicit
`version` field is deprecated, but the file remains compatible with the 3.3 schema.

## Seed database schema
```bash
DATABASE_URL=postgresql://tv_series:tv_series@localhost:5432/tv_series ./scripts/seed-db.sh
```

## Run quality gate
```bash
./scripts/check.sh
```

## Jenkins CI
This repository includes a minimal `Jenkinsfile` that runs:

```bash
./scripts/ci.sh
```

`scripts/ci.sh` executes:
- `./scripts/check.sh`
- `docker compose up --build -d`
- health check (`curl http://localhost:7777/health`)
- `docker compose down -v --remove-orphans` (cleanup)
