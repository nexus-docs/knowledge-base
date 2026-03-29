---
title: "Access Control"
summary: "Flexible tier-based access control with per-product gating and three visibility modes"
access_tier: public
product: platform
status: published
owner: admin
tags: [access-control, tiers, acl, permissions, security]
nav_order: 1
---

# Access Control

Nexus Docs uses a flexible tier system for access control. Tiers are defined in the database with a rank and visibility mode — add as many as you need without changing code.

## Tier System

Each tier has three properties:

| Property | Description |
|----------|-------------|
| **Name** | Unique identifier used in frontmatter (`partner`, `gold_partner`) |
| **Rank** | Numeric rank — higher sees more (0=public, 100=admin) |
| **Visibility** | How content appears to unauthorized users |

### Visibility Modes

| Mode | Nav | Page | SEO |
|------|-----|------|-----|
| **public** | Normal link | Full access | Indexed |
| **protected** | Link + lock icon | "Request Access" page | noindex |
| **private** | Hidden completely | 404 | noindex, nofollow |

### Default Tiers

| Tier | Rank | Visibility |
|------|------|-----------|
| `public` | 0 | public |
| `client` | 10 | protected |
| `partner` | 20 | protected |
| `gold_partner` | 30 | protected |
| `platinum_partner` | 40 | private |
| `admin` | 100 | private |

### Adding Custom Tiers

Insert a row in the `tiers` table:

```sql
INSERT INTO tiers (id, name, label, rank, visibility, description)
VALUES (gen_random_uuid(), 'enterprise', 'Enterprise', 35, 'protected', 'Enterprise customers');
```

Then use it in frontmatter:

```yaml
access_tier: enterprise
```

No code changes, no redeployment needed.

## Per-Product Gating

For client-tier content, you can gate access by product licence:

```yaml
---
access_tier: client
extensions:
  - mycompany/product-a
---
```

A client who owns `product-a` sees this page. A client who only owns `product-b` sees a locked page. Partners and above bypass extension checks.

## Access Request Flow

When a user encounters a protected page, they can request access:

1. User clicks "Request Access" on the locked page
2. Admins receive notification (email when configured)
3. Admin approves or denies via signed email link or admin dashboard
4. User is notified of the decision
