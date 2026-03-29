---
title: "Getting Started"
summary: "Install and configure Nexus Docs — from clone to running portal in 5 minutes"
access_tier: public
product: platform
status: published
owner: admin
tags: [getting-started, install, setup, docker]
nav_order: 1
---

# Getting Started

Get Nexus Docs running locally in 5 minutes.

## Prerequisites

- Docker & Docker Compose
- Git

## Installation

```bash
git clone git@github.com:nexus-docs/knowledge-base.git
cd knowledge-base
cp .env.example .env
```

Edit `.env` with your values (at minimum set `AUTH_SECRET`).

## Start Services

```bash
docker compose up -d
```

This starts 5 services: Next.js app, PostgreSQL, Redis, Meilisearch, and a background worker.

## Bootstrap

```bash
# Run database migrations
docker compose exec app npx prisma migrate deploy

# Seed default users and tiers
docker compose exec app npx prisma db seed

# Index content for search
docker compose exec app npx tsx scripts/reindex.ts
```

Open http://localhost:3000.

## Default Users

| Email | Password | Tier |
|-------|----------|------|
| admin@example.com | password123 | admin |
| client@example.com | password123 | client |
| partner@example.com | password123 | partner |

## Next Steps

- [Add your content](/docs/getting-started/content) — Replace example content with your own
- [Configure tiers](/docs/features/access-control) — Set up access levels
- [Customise branding](/docs/guides/branding) — Change colours, logo, and site name
