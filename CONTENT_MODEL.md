# Nexus Docs — Content Model

> Frontmatter specification for all documentation files.

## Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Page title (used in nav, search, SEO) |
| `summary` | string | One-line description (used in search results, OG description, nav tooltips) |
| `access_tier` | enum | `public` \| `client` \| `partner` \| `admin` |
| `product` | string | Product/extension identifier (e.g. `gdpr-suite`, `omnibus-directive`). Use `platform` for non-extension content. |
| `status` | enum | `draft` \| `published` \| `deprecated` |
| `owner` | string | Content owner (GitLab username). Responsible for keeping it current. |

## Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `extensions` | string[] | `[]` | Required extension licenses to view (client tier only). If empty and tier is `client`, any authenticated client can view. |
| `version` | string | `"*"` | Extension version range this doc applies to (e.g. `"2.x"`, `">=3.0"`). |
| `tags` | string[] | `[]` | Freeform tags for search filtering and related content. |
| `video` | string | — | YouTube/video URL for embedded player. |
| `changelog` | boolean | `false` | Auto-generate changelog section from git history of this file. |
| `last_verified_at` | date | — | Last date content was verified accurate (ISO 8601: `2026-03-21`). |
| `review_interval_days` | number | `90` | Days before content is flagged for re-review. |
| `deprecated` | boolean | `false` | If true, shows deprecation banner. Content remains accessible. |
| `redirect_from` | string[] | `[]` | Old paths that should 301 redirect to this page. For migration from MkDocs. |
| `related` | string[] | `[]` | Paths to related docs, shown as "See also" links. |
| `nav_order` | number | `0` | Sort order within parent section (lower = first). |
| `nav_hidden` | boolean | `false` | If true, page exists but is excluded from nav tree (still accessible by URL). |

## Full Example

```yaml
---
title: "GDPR Compliance Suite - Configuration"
summary: "Step-by-step guide to configuring GDPR modules in Magento admin"
access_tier: client
extensions:
  - qoliber/gdpr-suite
product: gdpr-suite
version: "2.x"
tags: [gdpr, configuration, privacy, compliance]
status: published
owner: jakub
video: "https://youtube.com/watch?v=abc123"
changelog: true
last_verified_at: 2026-03-15
review_interval_days: 60
deprecated: false
redirect_from:
  - /extensions/gdpr-suite/configuration.html
related:
  - /extensions/gdpr-suite/usage
  - /extensions/gdpr-suite/modules/gdpr-cookie
nav_order: 3
---
```

## Access Tier + Extensions Interaction

The `access_tier` and `extensions` fields work together:

| Tier | Extensions | Who can see it |
|------|-----------|----------------|
| `public` | (ignored) | Everyone, including anonymous visitors |
| `client` | `[]` (empty) | Any authenticated client |
| `client` | `[qoliber/gdpr-suite]` | Only clients who own `gdpr-suite` |
| `client` | `[qoliber/gdpr-suite, qoliber/omnibus-directive]` | Clients who own **any** of the listed extensions |
| `partner` | (ignored) | All partners (they see all extensions) |
| `admin` | (ignored) | Admins only |

## Validation Rules

Enforced in CI (markdownlint + custom frontmatter validator):

1. All required fields must be present
2. `access_tier` must be a valid enum value
3. `status` must be a valid enum value
4. `product` must match a known product ID (maintained in `products.yml`)
5. `extensions` entries must follow the `qoliber/{name}` format
6. `last_verified_at` must be a valid ISO 8601 date, not in the future
7. `redirect_from` paths must not conflict with existing pages
8. `owner` must be a valid GitLab username

## Meilisearch Index Mapping

Every field is indexed. Filterable attributes for ACL-aware search:

```
filterableAttributes: [access_tier, extensions, product, version, status, tags]
sortableAttributes:   [title, nav_order, last_verified_at]
searchableAttributes: [title, summary, content, tags]
```

## Stale Content Detection

The worker runs a weekly job that flags documents where:
- `last_verified_at` + `review_interval_days` < today
- `status` is `published` (drafts and deprecated docs are excluded)

Flagged documents appear in the admin dashboard and optionally create GitLab issues assigned to `owner`.
