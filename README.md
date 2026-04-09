# FreeFit UI

An independent, unofficial search interface for gyms and fitness studios listed on FreeFit. Browse clubs on an interactive map, search with fuzzy Hebrew matching, and filter by city, category, or distance — all in a convenient web UI.

**This project is not affiliated with, endorsed by, or associated with FreeFit in any way.** It simply provides a better search experience over publicly available gym listing data.

**Live at [freef.it](https://freef.it)**

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, Tailwind CSS v4, Mapbox GL, Zustand, TanStack Query |
| Backend | Hono on AWS Lambda (Node.js 22), Drizzle ORM, PostgreSQL (Neon) |
| Infra | AWS CDK — Lambda, API Gateway, S3, CloudFront, EventBridge, Route53 |
| Monorepo | pnpm workspaces |

## Project Structure

```
packages/
├── frontend/    # React SPA — map, search, club pages
├── backend/     # Hono API + daily sync function
├── infra/       # AWS CDK stack
└── shared/      # TypeScript types & FreeFit API client
```

## Features

- **Fuzzy Hebrew search** — typo-tolerant via PostgreSQL `pg_trgm`
- **Interactive map** — Mapbox GL with clustering, popups, bounds-based filtering
- **Geolocation** — find nearby clubs sorted by distance
- **Filters** — by city, category, distance, name
- **Club details** — images, hours, parking, class schedules (lazy-hydrated)
- **Mobile-first** — responsive split-view, safe-area viewport, RTL throughout
- **Daily sync** — EventBridge triggers a Lambda at 3 AM IST to refresh all club data

## Local Development

### Prerequisites

- Node.js 22+
- pnpm
- Docker

### Setup

```bash
# Install dependencies
pnpm install

# Start local Postgres
docker compose up -d

# Copy env and fill in credentials
cp .env.example .env

# Push DB schema
pnpm --filter backend db:push

# Sync data from FreeFit API
pnpm sync

# Start dev servers
pnpm dev:frontend    # http://localhost:5173
pnpm dev:backend     # http://localhost:3001
```

### Environment Variables

See `.env.example` — you'll need FreeFit API credentials, a database URL, and a Mapbox token.

## Deployment

```bash
# Build frontend + deploy CDK stack
pnpm deploy
```

Deploys to AWS `il-central-1`: frontend to S3/CloudFront, API + sync to Lambda, daily schedule via EventBridge.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/clubs` | Search & filter clubs |
| `GET /api/clubs/:id` | Club details (lazy-hydrated) |
| `GET /api/clubs/:id/lessons` | Class schedule proxy |
| `GET /api/cities` | List all cities |
| `GET /api/categories` | List all categories |
