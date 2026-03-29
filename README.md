# Nexus Docs

A documentation portal built for software companies that need more than a static site generator. Tiered access control, per-product gating, full-text search with permission filtering, and inline content protection — all in a single containerized application.

Built by [qoliber](https://qoliber.com) to power our own extension documentation and partner portal.

## Why Nexus Docs?

Every documentation platform forces you to choose: either you get great SEO and markdown support (MkDocs, VitePress, Docusaurus) but no access control, or you get user management (Wiki.js, BookStack) but weak SEO and no per-product gating.

Nexus Docs doesn't make you choose.

### What makes it different

**Flexible tier system** — Define unlimited access tiers (Client, Partner, Gold Partner, Platinum Partner, etc.) with three visibility modes:
- **Public** — visible to everyone
- **Protected** — visible with a lock icon, users can request access
- **Private** — completely hidden, returns 404 for unauthorized users

**Per-product gating** — A client who purchased your GDPR extension sees GDPR docs but not SEO docs. Tied to individual product licenses, not just user roles.

**Inline content protection** — Mix public and protected content on the same page. Wrap any section in `<Protected tier="partner">` and unauthorized users see a lock placeholder while the rest of the page remains visible. No separate pages needed.

**Search that respects permissions** — Meilisearch with compound ACL filters. A client searching "configuration" only sees results for extensions they own. Partners see more. Admins see everything. No information leakage.

**Auto-generated social cards** — Every page gets a unique Open Graph image generated at `/api/og?slug=...` with the page title, description, product badge, and tags. No manual image creation.

**Breadcrumb-based meta titles** — Page titles are built from the full navigation path: "Apache — Web Servers — Trident | qoliber Docs" instead of just "Apache | qoliber Docs".

## How it compares

| Feature | MkDocs Material | VitePress | Docusaurus | Wiki.js | BookStack | **Nexus Docs** |
|---------|----------------|-----------|------------|---------|-----------|---------------|
| Markdown/MDX | Yes | Yes | Yes | Yes | WYSIWYG | **Yes (MDX)** |
| Per-user access control | No | No | No | Basic RBAC | RBAC | **Flexible tiers + per-product** |
| Inline content protection | No | No | No | No | No | **Yes (`<Protected>`)** |
| Search with ACL filtering | No | No | No | No | No | **Yes (Meilisearch)** |
| Auto OG images | Paid only | No | No | No | No | **Yes (free)** |
| Dark mode | Yes | Yes | Yes | Yes | Yes | **Yes** |
| Cookie consent (GDPR) | No | No | No | No | No | **Yes (Consent Mode v2)** |
| Announcement bar | No | No | Yes | No | No | **Yes** |
| Code syntax highlighting | Yes | Yes | Yes | Yes | Basic | **Yes (Shiki)** |
| API + Webhooks | No | No | No | GraphQL | REST | **REST + webhooks + queue** |
| Background jobs | No | No | No | No | No | **Yes (BullMQ)** |
| Self-hosted | Static files | Static files | Static files | Docker | Docker | **Docker** |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, React 19) |
| Language | TypeScript |
| Database | PostgreSQL 16 + Prisma |
| Search | Meilisearch |
| Queue | BullMQ + Redis |
| Auth | NextAuth.js v5 (GitLab OAuth + credentials) |
| Styling | Tailwind CSS 4 |
| Markdown | MDX via next-mdx-remote + Shiki + remark/rehype |
| Containers | Docker Compose (5 services) |

## Quick Start

```bash
git clone git@github.com:nexus-docs/knowledge-base.git
cd knowledge-base
cp .env.example .env
# Edit .env with your values

docker compose up -d
# Wait for healthchecks, then:
docker compose exec app npx prisma migrate deploy
docker compose exec app npx prisma db seed
docker compose exec app npx tsx scripts/reindex.ts
```

Open http://localhost:3000.

### Default Users

| Email | Password | Tier |
|-------|----------|------|
| admin@qoliber.com | password123 | admin |
| client@example.com | password123 | client (GDPR Suite) |
| partner@example.com | password123 | partner |

## Content Authoring

All content is Markdown with YAML frontmatter:

```yaml
---
title: "GDPR Configuration"
summary: "How to configure the GDPR module"
access_tier: client
extensions:
  - qoliber/gdpr-suite
product: gdpr-suite
status: published
owner: jakub
tags: [gdpr, configuration]
---

# GDPR Configuration

Public introduction visible to everyone.

<Protected tier="partner">

This section is only visible to partners and above.
Unauthorized users see a lock placeholder.

</Protected>

More public content below the protected section.
```

### Access Tiers

Tiers are defined in the database with a rank and visibility mode:

| Tier | Rank | Visibility | Behavior |
|------|------|-----------|----------|
| public | 0 | public | Visible to everyone |
| client | 10 | protected | Lock icon + "Request Access" |
| partner | 20 | protected | Lock icon + "Request Access" |
| gold_partner | 30 | protected | Lock icon + "Request Access" |
| platinum_partner | 40 | private | Completely hidden (404) |
| admin | 100 | private | Completely hidden (404) |

Add new tiers anytime — just insert a row in the `tiers` table. No code changes.

## Project Structure

```
content/              Markdown documentation files
prisma/               Database schema and migrations
scripts/              Bootstrap, seed, reindex scripts
src/
  app/
    (public)/         Public documentation pages
    (portal)/         Admin portal
    api/              REST API (auth, search, admin, webhooks, OG images)
  components/
    markdown/         MDX renderers (Admonition, CodeBlock, Protected, etc.)
    layout/           Header, sidebar, mega-menu, footer, cookie consent
    seo/              JSON-LD structured data
  lib/
    acl/              Tier-based access control with visibility modes
    content/          Content loader, nav builder, frontmatter validation
    meilisearch/      Search client with ACL filtering
    queue/            Background job producers
worker/               BullMQ job processors (content sync, reindex, email)
```

## Key Features

- **Mega-menu** with category dropdowns and active state highlighting
- **Scoped sidebar** — shows only the current section, collapses children, back-link navigation
- **Cookie consent** — Google Consent Mode v2 compatible, GTM integration
- **Announcement bar** — dismissible, persisted in localStorage
- **Code blocks** — Shiki syntax highlighting, copy button, language labels, code tabs
- **Table of contents** — scrollspy with active section highlighting
- **Sitemap + robots.txt** — auto-generated, public pages only
- **JSON-LD** — TechArticle, BreadcrumbList, Organization, WebSite with SearchAction
- **Audit logging** — every page view, access attempt, and permission change logged
- **214 tests passing** (Vitest)

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Full system design
- [CONTENT_MODEL.md](./CONTENT_MODEL.md) — Frontmatter specification
- [.env.example](./.env.example) — All environment variables

## License

MIT — see [LICENSE](./LICENSE).
