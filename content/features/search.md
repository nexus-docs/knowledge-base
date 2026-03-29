---
title: "Search"
summary: "Full-text search powered by Meilisearch with ACL-filtered results — users only see what they have access to"
access_tier: public
product: platform
status: published
owner: admin
tags: [search, meilisearch, acl, full-text]
nav_order: 3
---

# Search

Nexus Docs uses Meilisearch for full-text search with permission-aware filtering. Every search query is filtered by the user's tier and product entitlements — no information leakage.

## How It Works

- Content is indexed with `access_tier`, `extensions`, `product`, and `tags` as filterable attributes
- When a user searches, the API builds a compound filter based on their tier rank and owned extensions
- Results only include documents the user is authorized to see

## Keyboard Shortcut

Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux) to open the search dialog from any page.

## Reindexing

After adding or updating content:

```bash
docker compose exec app npx tsx scripts/reindex.ts
```

In production, the worker automatically reindexes after a content sync triggered by GitLab webhooks.
