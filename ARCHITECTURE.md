# Nexus Docs — Architecture

> qoliber's Knowledge Base & Partner Portal

## Overview

Nexus Docs is a containerized Next.js application that serves as qoliber's central documentation and partner portal. It combines public-facing extension documentation with private, access-controlled content for clients and partners.

**URL:** `docs.qoliber.com` (redirect from `portal.qoliber.com`)

---

## Core Principles

- **Markdown-first** — all content lives as `.md`/`.mdx` files in a dedicated content repo (GitLab), synced to a local cache at build and runtime
- **Containerized** — runs anywhere with `make up` (see [Bootstrap](#bootstrap))
- **Tiered access** — public, client (per-extension), partner, admin
- **API-driven** — everything the UI does, the API can do
- **Self-hostable** — no vendor lock-in

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        Traefik / Nginx                       │
│                      (reverse proxy + TLS)                   │
└──────────────────────────┬───────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼───────┐  ┌───────▼───────┐  ┌───────▼───────┐  ┌───────────────┐
│   Next.js     │  │  Meilisearch  │  │  PostgreSQL   │  │   Worker      │
│   App         │  │  (search)     │  │  (users, ACL, │  │  (BullMQ +    │
│   Port: 3000  │  │  Port: 7700   │  │   webhooks)   │  │   Redis)      │
└───────┬───────┘  └───────────────┘  └───────────────┘  └───────┬───────┘
        │                                                        │
        │  External Integrations                                 │
        │  (request path)                    (background jobs)   │
        │                                                        │
        ├──> GitLab API      (issue/branch creation) ◄───────────┤
        ├──> GitHub API      (PR hooks, repo scan)   ◄───────────┤
        ├──> Magento API     (license verification)  ◄───────────┤
        ├──> Claude API      (AI chat — user-facing) ◄───────────┤ (AI doc gen, review — background)
        ├──> SMTP / Resend   (email notifications)   ◄───────────┤
        └──> Webhooks (in)                           ◄───────────┘ (content sync, reindex,
                                                        outgoing webhooks, retries)
```

---

## Content Source of Truth

**Decision: GitLab is the single source of truth for all content.**

Content lives in a dedicated GitLab repo (`nexus-docs/content`), separate from the app repo. The app never modifies content — it only reads it.

```
Content lifecycle:
  Author edits .md in GitLab  ──>  MR merged to main
       │                                  │
       │                         GitLab webhook fires
       │                                  │
       │                         Worker: git pull into
       │                         local cache volume
       │                                  │
       │                         Worker: parse frontmatter,
       │                         reindex Meilisearch
       │                                  │
       │                         App serves updated content
       │                         from cache volume
       ▼
  "Report Issue" creates MR ──>  cycle repeats
```

**Local cache:** A Docker volume (`content-cache`) holds a shallow clone of the content repo. The worker updates it on webhook events. The app reads from it at request time (SSR) and at build time (SSG for public pages).

**Why not bundle content at build time?** Partners and admins need content updates without redeploying the app. Public pages are additionally pre-built as static HTML for SEO.

---

## Services

### 1. Next.js Application (`app`)

The main application. Handles rendering, auth, API routes. All background work is dispatched to the worker via BullMQ.

```
knowledge-base/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (public)/           # Public routes (no auth, SSG where possible)
│   │   ├── (portal)/           # Protected routes (auth required, SSR)
│   │   ├── api/
│   │   │   ├── auth/           # NextAuth endpoints
│   │   │   ├── webhooks/       # Incoming webhook handlers (validate + enqueue)
│   │   │   │   ├── gitlab/     # MR merged → enqueue content-sync job
│   │   │   │   ├── github/     # PR hook → enqueue repo-scan + doc-gen job
│   │   │   │   ├── magento/    # License change → enqueue ACL update job
│   │   │   │   └── custom/     # Custom webhook triggers
│   │   │   ├── search/         # Meilisearch proxy (ACL-filtered)
│   │   │   ├── issues/         # GitLab issue + branch creation
│   │   │   ├── ai/             # Claude chat (user-facing, request path)
│   │   │   ├── access/         # Access requests + approval/deny
│   │   │   └── admin/          # User management, audit logs, email config
│   │   └── layout.tsx
│   ├── components/
│   │   ├── markdown/           # MDX renderers (admonitions, code blocks, mermaid)
│   │   ├── search/             # Search UI
│   │   ├── ai/                 # AI chat sidebar
│   │   ├── video/              # Video player component
│   │   └── issues/             # "Report an Issue" modal
│   ├── lib/
│   │   ├── auth/               # NextAuth config + Magento provider
│   │   ├── acl/                # Permission checking (tier + extensions)
│   │   ├── gitlab/             # GitLab API client
│   │   ├── magento/            # Magento API client
│   │   ├── meilisearch/        # Search client + ACL filter builder
│   │   ├── ai/                 # Claude API client
│   │   ├── queue/              # BullMQ job producers
│   │   ├── webhooks/           # Webhook dispatcher + registry
│   │   └── content/            # Markdown loader + parser (reads from cache volume)
│   └── styles/
│       └── themes/             # Multiple theme support
├── worker/
│   ├── index.ts                # BullMQ worker entrypoint
│   ├── jobs/
│   │   ├── content-sync.ts     # git pull + parse frontmatter
│   │   ├── reindex.ts          # Meilisearch full/partial reindex
│   │   ├── ai-review.ts        # [PHASE 2] Claude doc review (background)
│   │   ├── repo-scan.ts        # [PHASE 2] AI repo scan → generate docs
│   │   ├── webhook-deliver.ts  # Outgoing webhook delivery + retry
│   │   ├── acl-sync.ts         # Magento license → permission sync
│   │   └── email-notify.ts     # Transactional emails (access requests, approvals)
│   └── scheduler.ts            # Cron-style recurring jobs
├── prisma/
│   └── schema.prisma
├── scripts/
│   ├── bootstrap.sh            # First-time setup (see Bootstrap section)
│   ├── seed.ts                 # DB seed data (admin user, default permissions)
│   └── reindex.ts              # Manual Meilisearch reindex
├── docker-compose.yml
├── docker-compose.prod.yml
├── Dockerfile
├── Makefile
└── ARCHITECTURE.md
```

### 2. Worker (`worker`)

A separate process (same Docker image, different entrypoint) that processes background jobs via BullMQ + Redis.

**Jobs:**

| Job | Trigger | What it does |
|-----|---------|-------------|
| `content-sync` | GitLab webhook / manual | `git pull` content repo into cache volume, parse frontmatter, enqueue `reindex` |
| `reindex` | After `content-sync` / manual | Rebuild Meilisearch index with full ACL metadata |
| `ai-review` | [PHASE 2] Content change / manual / scheduled | Claude reviews docs for quality, creates GitLab issues for findings |
| `repo-scan` | [PHASE 2] GitHub PR webhook | AI scans repo, generates draft docs, creates approval MR |
| `webhook-deliver` | Any registered event | POST to registered URLs with HMAC signature, retry with exponential backoff (3 attempts) |
| `acl-sync` | Magento webhook / scheduled | Sync license entitlements → user permissions in DB |
| `email-notify` | Access request / approval / denial | Sends transactional email via Resend/SMTP |

**Why a separate worker?** Webhook handlers and API routes must respond fast. Content sync, reindexing, AI review, and outgoing webhook delivery are slow and must not block requests. Retries and scheduling need a persistent queue.

### 3. Redis (`redis`)

BullMQ job queue backend. Also used for session cache and rate limiting.

### 4. Meilisearch (`search`)

Full-text search across all documentation with **per-extension ACL filtering**.

**Key design:** Every document is indexed with both `access_tier` AND `extensions[]` fields. Search queries are filtered server-side using a compound filter:

```
# For a client who owns gdpr-suite and omnibus-directive:
filter = "access_tier = public OR (access_tier = client AND extensions IN [qoliber/gdpr-suite, qoliber/omnibus-directive])"

# For a partner:
filter = "access_tier IN [public, client, partner]"

# For admin:
# no filter — sees everything
```

This ensures a client who owns GDPR Suite **cannot** discover docs for Product Labels in search results, nav, sitemap, or AI context.

**Filterable attributes:** `access_tier`, `extensions`, `tags`, `product`, `version`, `status`

### 5. PostgreSQL (`db`)

Stores:
- **Users** — synced from Magento, enriched with portal-specific data
- **Permissions** — per-user extension entitlements + tier
- **Access requests** — pending/approved/denied requests with full history
- **Audit log** — every page view, search, access attempt, permission change (append-only)
- **Content history** — per-file revision log (who changed what, when, git SHA)
- **Webhook registry** — registered webhooks, delivery logs, retry state
- **Knowledge base metadata** — tags, categories, custom fields for content
- **AI review results** — [PHASE 2] review history, findings, linked GitLab issues

---

## Access Control Model

ACL is enforced at **every boundary**: page render, search, nav tree, sitemap, AI context, and outgoing webhooks.

```
┌─────────────┬─────────────────────────────────────────────────┐
│ Tier        │ Access                                          │
├─────────────┼─────────────────────────────────────────────────┤
│ Public      │ Install guides, general docs, screenshots,      │
│ (anonymous) │ videos, marketing content                       │
├─────────────┼─────────────────────────────────────────────────┤
│ Client      │ Public + docs for PURCHASED extensions only,    │
│             │ support resources for owned extensions           │
├─────────────┼─────────────────────────────────────────────────┤
│ Partner     │ All client content (all extensions) + roadmaps, │
│             │ internal tools, custom docs, changelogs         │
├─────────────┼─────────────────────────────────────────────────┤
│ Admin       │ Everything + user management, analytics,        │
│             │ webhook config, AI review dashboard             │
└─────────────┴─────────────────────────────────────────────────┘
```

**Enforcement points:**

| Boundary | How |
|----------|-----|
| **Page render** | Next.js middleware checks `user.tier` + `user.extensions[]` against page frontmatter. If denied → locked content page (see below). |
| **Search** | Meilisearch query includes compound `filter` (tier + extensions). Server-side only. |
| **Nav tree** | Built server-side from content index, pruned to user's entitlements. |
| **Sitemap** | Public pages only in `sitemap.xml`. Authenticated sitemap endpoint for crawlers with API key. |
| **AI context** | Chat sidebar only receives content the user is entitled to see. Enforced at retrieval time. |
| **Webhooks** | Outgoing webhooks filter payload to recipient's entitlements. |

---

## Locked Content UX

Restricted content is **visible but not accessible**. Users always know it exists — they just can't read it without the right tier.

**Nav tree:** Locked pages show with a lock icon. Clicking opens the locked content page instead of 403.

**Locked content page shows:**

```
┌─────────────────────────────────────────┐
│  🔒 GDPR Compliance Suite - Roadmap    │
│                                         │
│  This content is available to           │
│  Partners only.                         │
│                                         │
│  ┌─────────────────────────────┐        │
│  │  Request Access             │        │
│  │                             │        │
│  │  Message (optional):        │        │
│  │  ┌───────────────────────┐  │        │
│  │  │                       │  │        │
│  │  └───────────────────────┘  │        │
│  │                             │        │
│  │  [Send Request]             │        │
│  └─────────────────────────────┘        │
│                                         │
│  Already a partner? Log in              │
└─────────────────────────────────────────┘
```

**Access level messaging:**

| User tier | Page tier | Message shown |
|-----------|-----------|---------------|
| Anonymous | client | "Log in or purchase this extension to view" |
| Anonymous | partner | "This content is available to Partners only" |
| Client (no ext) | client (ext-gated) | "Purchase {extension} to access this documentation" |
| Client | partner | "This content is available to Partners only. [Request Access]" |

**Request flow:** See [Access Request & Approval Flow](#access-request--approval-flow) below.

---

## Audit Logging

Every meaningful action is logged to an append-only `audit_log` table. This is not optional — it's a core feature for compliance and understanding usage.

**Logged events:**

| Event | Data captured |
|-------|--------------|
| `page.view` | user, page path, timestamp, IP |
| `page.denied` | user, page path, required tier/extensions, timestamp |
| `search.query` | user, query, filters applied, result count |
| `access.requested` | user, target tier, message |
| `access.approved` | admin, target user, granted tier/extensions |
| `access.denied` | admin, target user, reason |
| `user.login` | user, auth method, IP |
| `user.created` | user, source (Magento/manual/request) |
| `content.synced` | files changed, git SHA |
| `permission.changed` | admin, target user, old → new permissions |

**Retention:** Configurable per event type. Default: 1 year for view/search, indefinite for permission changes.

**Admin dashboard:** Filterable log viewer with export to CSV.

---

## Email System

Transactional emails via **Resend** (primary) or SMTP (fallback). All emails are queued through the `email-notify` worker job — never sent in the request path.

**Email types:**

| Trigger | Recipient | Email |
|---------|-----------|-------|
| Access request submitted | All admins | "User X requested {tier} access" with approve/deny links |
| Access approved | Requesting user | "Your access to {section} has been approved" |
| Access denied | Requesting user | "Your request was denied" + optional reason |
| New user registered | Admins | "New user X registered via Magento" with approve/deny |
| Content review due | Content owner | "Document X is due for review" |
| [PHASE 2] AI doc generated | Admins | "AI generated docs for PR #{n}" with review link |

**Approve/deny links:** Signed URLs (HMAC) that work without logging in. Admin clicks approve → permission granted → user notified. Like GitHub's email-based review flow.

**Templates:** React Email (JSX-based), matching the portal's visual style.

---

## Access Request & Approval Flow

```
User clicks "Request Access" on locked page
        │
        ▼
POST /api/access/request
  { page, tier_requested, message }
        │
        ├──> DB: create access_request (status: pending)
        ├──> Audit log: access.requested
        └──> Enqueue email-notify job → admin email with approve/deny links
                │
        ┌───────┴───────┐
        ▼               ▼
  Admin clicks       Admin clicks
  [Approve]          [Deny]
        │               │
        ▼               ▼
  POST /api/access   POST /api/access
  /approve/{id}      /deny/{id}
        │               │
        ├──> Update      ├──> Update
        │   permissions  │   request status
        ├──> Audit log   ├──> Audit log
        └──> Email user  └──> Email user
            "Approved"       "Denied" + reason
```

Admins can also bulk-manage access from the admin dashboard: view pending requests, approve/deny in batch, search by user/tier.

---

## Content History

Every `.md` file has a tracked revision history derived from git + stored in DB:

- **Git-based:** On `content-sync`, the worker runs `git log --follow` for each changed file and stores: SHA, author, date, commit message
- **Rendered on page:** "Last updated: 2026-03-15 by @jakub" + expandable changelog
- **Admin view:** Full diff history for any page, who changed what and when
- **Frontmatter `changelog: true`:** Adds a visible changelog section to the page itself

---

## Webhook System

### Incoming Webhooks

Webhook handlers validate the signature, then **enqueue a job** — they never do heavy work in the request path.

| Source   | Event              | Job enqueued                                |
|----------|--------------------|---------------------------------------------|
| GitLab   | MR merged          | `content-sync` → `reindex`                  |
| GitLab   | Tag pushed         | `content-sync` (changelog generation)       |
| Magento  | License purchased  | `acl-sync` (grant extension access)         |
| Magento  | License expired    | `acl-sync` (revoke access, notify user)     |
| Custom   | Configurable       | User-defined action via webhook registry    |

### Outgoing Webhooks

Delivered by the `webhook-deliver` worker job with HMAC signing and retry (3 attempts, exponential backoff).

| Event                | Payload                                    |
|----------------------|--------------------------------------------|
| Issue reported       | Issue details → GitLab (+ branch created)  |
| Doc updated          | Change summary → Slack/email notification  |
| New user registered  | User data → Magento / CRM                  |
| AI review completed  | Review results → configurable endpoint     |

### Webhook Registry (DB-backed)

```
POST /api/webhooks/register
{
  "event": "doc.updated",
  "url": "https://partner-system.com/hook",
  "secret": "...",
  "filters": { "section": "extensions/gdpr-*" }
}
```

---

## Key Flows

### "Report an Issue" Flow

1. User clicks "Report Issue" on any doc page
2. Modal pre-fills: page path, section title, current content snippet
3. User adds description + priority
4. `POST /api/issues` →
   - Creates GitLab issue (labeled, milestoned)
   - Creates branch `docs/issue-{id}-{slug}`
   - Returns issue URL + branch name
5. User can immediately edit in GitLab Web IDE or clone

### AI Review Flow (Background)

AI review is a **background QA tool**, not user-facing. The user-facing AI is the chat sidebar.

1. `content-sync` job completes → enqueues `ai-review` for changed files
2. Also runs on a weekly schedule for full corpus review
3. Worker sends content to Claude API for review (accuracy, clarity, SEO, broken links, consistency)
4. Results stored in DB, surfaced in admin dashboard
5. Critical findings auto-create GitLab issues

### AI Chat (User-Facing, Request Path)

1. User opens chat sidebar on any doc page
2. `POST /api/ai/chat` with user question + current page context
3. Server retrieves related docs from Meilisearch (**filtered by user's ACL**)
4. Claude API generates answer using only entitled content as context
5. Streamed response to client

### Content Sync Flow

1. GitLab webhook fires on MR merge to `main`
2. `POST /api/webhooks/gitlab` validates signature, enqueues `content-sync` job
3. Worker: `git pull` content repo into cache volume
4. Worker: parse all frontmatter, detect changed files
5. Worker: enqueue `reindex` job (partial — only changed docs)
6. Worker: enqueue `webhook-deliver` for `doc.updated` subscribers
7. Worker: enqueue `ai-review` for changed files

---

## Content Frontmatter Schema

See [CONTENT_MODEL.md](CONTENT_MODEL.md) for the full content model specification.

Quick reference:

```yaml
---
title: "GDPR Compliance Suite - Configuration"
summary: "How to configure the GDPR module in Magento admin"
access_tier: client              # public | client | partner | admin
extensions:                      # required extensions (for client-tier ACL)
  - qoliber/gdpr-suite
product: gdpr-suite              # product identifier
version: "2.x"                   # extension version range
tags: [gdpr, configuration, privacy]
status: published                # draft | published | deprecated
owner: jakub                     # content owner
video: "https://youtube.com/..." # optional video embed
changelog: true                  # auto-generate from git history
---
```

---

## Frontend Architecture

The app serves two distinct experiences with different design goals:

### Public Frontend (SEO-first, content-focused)

For anonymous visitors and logged-in users browsing docs. Optimized for speed, readability, and search engine ranking.

| Layer | Technology | Why |
|-------|-----------|-----|
| Layout | Custom components | Minimal JS, fast LCP |
| CSS | Tailwind CSS 4 | Utility-first, tree-shaken |
| Typography | `@tailwindcss/typography` (`prose`) | Beautiful markdown rendering |
| Syntax highlighting | Shiki | Server-side, zero client JS, VSCode-quality |
| Icons | Lucide React | Tree-shakeable, consistent |
| Theme | CSS custom properties + `dark` class | Instant toggle, no FOUC |
| Animations | CSS only | No JS overhead |

**SEO features:**
- `generateMetadata()` on every page — title, description, OG tags, Twitter cards
- JSON-LD structured data (Article, BreadcrumbList, SoftwareApplication)
- `sitemap.ts` — auto-generated from public content index
- `robots.ts` — blocks `/api/`, `/admin/`, `/dashboard/`
- Canonical URLs on every page
- Semantic HTML: `<article>`, `<nav>`, breadcrumbs with `aria-label`
- Static generation (SSG) for public pages — fast TTFB, cacheable at CDN
- Open Graph images per page (planned: auto-generated social cards)

**Locked content UX:** Restricted pages visible in nav with lock icon. Clicking shows tier-specific messaging + access request form. Never a blank 403.

### Admin Portal (data-dense, interactive)

Behind auth. No SEO needed. Optimized for productivity.

| Layer | Technology | Why |
|-------|-----------|-----|
| Components | shadcn/ui | Accessible, customizable, Tailwind-native |
| Data fetching | TanStack Query | Caching, optimistic updates, polling |
| Tables | TanStack Table | Sortable, filterable audit logs + user tables |
| Forms | React Hook Form + Zod | Validation shared with API |
| Charts | Recharts | Usage analytics dashboard |
| Animations | Framer Motion | Smooth transitions for dashboards |
| Email templates | React Email | JSX-based, matches portal visual style |

**Shared across both:** Tailwind config, design tokens (CSS variables for colors, fonts, spacing), Lucide icons, dark mode.

---

## Container Setup

### Services

| Service   | Image                        | Port | Volume                              |
|-----------|------------------------------|------|-------------------------------------|
| `app`     | `nexus-docs/app`             | 3000 | `content-cache` (readonly)          |
| `worker`  | `nexus-docs/app`             | —    | `content-cache` (read/write)        |
| `db`      | `postgres:16-alpine`         | 5432 | `pgdata`                            |
| `search`  | `getmeili/meilisearch:v1.12` | 7700 | `msdata`                            |
| `redis`   | `redis:7-alpine`             | 6379 | `redisdata`                         |

### Environment

All services derive configuration from a single `.env` file. See `.env.example` for the full list. `docker-compose.yml` references `${VAR}` — no hardcoded secrets.

---

## Bootstrap

First-time setup from a clean clone:

```bash
# 1. Clone and enter
git clone git@github.com:nexus-docs/knowledge-base.git
cd knowledge-base

# 2. Copy env and fill in secrets
cp .env.example .env
# edit .env with your values

# 3. One-command start
make up
```

`make up` runs:
1. `docker compose up -d` (starts db, redis, search)
2. Waits for healthchecks
3. `npx prisma migrate deploy` (applies DB migrations)
4. `npx prisma db seed` (creates admin user, default permissions)
5. `scripts/content-sync.sh` (initial clone of content repo into cache volume)
6. `scripts/reindex.sh` (initial Meilisearch index)
7. Starts app + worker

Other Makefile targets:

```
make up              # Full bootstrap (first time) or start (subsequent)
make down            # Stop all services
make dev             # Start in dev mode (hot reload)
make migrate         # Run pending DB migrations
make seed            # Re-seed DB
make reindex         # Rebuild Meilisearch index
make sync            # Force content sync from GitLab
make logs            # Tail all service logs
make test            # Run test suite
make lint            # Lint markdown + code
make shell           # Shell into app container
```

---

## CI/CD

### Content Repo (GitLab CI)

On every MR:
- Markdown lint (markdownlint)
- Broken link check
- Frontmatter validation (required fields, valid enums)
- MDX compile check (catches syntax errors)
- Spellcheck (cspell)
- Preview environment deployed (per-MR URL)

On merge to main:
- Webhook fires → production content sync

### App Repo (GitHub Actions)

On every PR:
- TypeScript compile
- ESLint + Prettier
- Unit tests (Vitest)
- Integration tests (Playwright)
- Docker build check

On merge to main:
- Build + push Docker image
- Deploy to production

---

## Tech Stack

| Layer        | Technology                                |
|--------------|-------------------------------------------|
| Framework    | Next.js 15 (App Router)                   |
| Language     | TypeScript                                |
| Styling      | Tailwind CSS 4                            |
| Auth         | NextAuth.js v5                            |
| Database     | PostgreSQL 16 + Prisma ORM                |
| Search       | Meilisearch                               |
| Queue        | BullMQ + Redis                            |
| AI           | Claude API (Anthropic)                    |
| Markdown     | next-mdx-remote + remark/rehype plugins   |
| Containers   | Docker + Docker Compose                   |
| CI/CD        | GitLab CI (content) + GitHub Actions (app)|
| Email        | Resend + React Email (SMTP fallback)      |
| Diagrams     | Mermaid.js                                |
| Video        | HTML5 player / YouTube embed              |

---

## Phase 2: AI Agent — Repo Scan & Auto Doc Generation

> Not needed for initial launch. Documented here for future reference.

### Concept

A GitHub App / webhook that triggers on every PR and module release. An AI agent scans the repo, understands the changes, and generates/updates documentation automatically — but **never publishes without human approval**.

### Flow

```
GitHub PR opened / tag pushed
        │
        ▼
POST /api/webhooks/github
  (validate signature, enqueue repo-scan job)
        │
        ▼
Worker: repo-scan job
  1. Clone repo at PR branch / tag
  2. Detect changed files (diff against base)
  3. Identify: new modules, changed configs, new features, API changes
  4. Send to Claude API with existing docs as context
  5. AI generates: new doc pages, updated sections, changelog entries
  6. Create MR in content repo with generated docs
  7. Mark MR as "AI-generated, needs review"
  8. Email admins: "AI generated docs for PR #123 — review & approve"
        │
        ▼
Admin reviews MR in GitLab
  - Edit, approve, or reject
  - On merge → normal content-sync flow picks it up
```

### What the AI agent scans for

| Signal | Doc action |
|--------|-----------|
| New module added | Generate install guide, configuration page, usage page |
| Config XML changed | Update configuration docs with new/changed options |
| API endpoint added/changed | Update API reference |
| `di.xml` / plugin changes | Update developer notes |
| Version tag pushed | Generate changelog entry from commit history |
| README changed | Sync relevant sections to docs |

### Safeguards

- AI never publishes directly — always creates a draft MR for review
- Generated content is clearly labelled `<!-- AI-GENERATED: review before publish -->`
- Admin can configure which repos/modules trigger scanning
- Rate limited: max 1 scan per PR, max 10 per hour

---

## Future Considerations

- **i18n** — multi-language docs (next-intl)
- **Analytics dashboard** — track which docs are most viewed, search patterns
- **Versioned docs** — per-extension version support
- **Offline mode** — PWA with cached content
- **SSO** — SAML/OIDC for enterprise partners
