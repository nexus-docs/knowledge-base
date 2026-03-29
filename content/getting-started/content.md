---
title: "Adding Content"
summary: "How to create and organise documentation pages in Nexus Docs using markdown with YAML frontmatter"
access_tier: public
product: platform
status: published
owner: admin
tags: [content, markdown, frontmatter, authoring]
nav_order: 1
---

# Adding Content

All content lives as `.md` files in the `content/` directory. Each file needs YAML frontmatter.

## Minimal Page

Create `content/my-page.md`:

```yaml
---
title: "My First Page"
summary: "A short description for search results and meta tags"
access_tier: public
product: platform
status: published
owner: admin
tags: [example]
---

# My First Page

Your markdown content goes here.
```

This page is accessible at `/docs/my-page`.

## Sections

Create a directory with an `index.md` to make a section:

```
content/
├── my-section/
│   ├── index.md        → /docs/my-section
│   ├── page-one.md     → /docs/my-section/page-one
│   └── page-two.md     → /docs/my-section/page-two
```

The `index.md` becomes the section landing page and appears as a clickable header in the sidebar.

## Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Page title (used in nav, search, meta tags) |
| `summary` | Yes | One-line description (under 160 chars for SEO) |
| `access_tier` | Yes | Tier name: `public`, `client`, `partner`, etc. |
| `product` | Yes | Product identifier (or `platform` for general content) |
| `status` | Yes | `published`, `draft`, or `deprecated` |
| `owner` | Yes | Content owner |
| `tags` | No | Array of tags for search filtering |
| `nav_order` | No | Sort order in sidebar (lower = first) |
| `nav_hidden` | No | Hide from navigation (still accessible by URL) |
| `extensions` | No | Required product licences for client-tier gating |

## Nav Order Convention

| Type | nav_order |
|------|-----------|
| Overview / index | 0 |
| Installation | 1 |
| Configuration | 2 |
| Usage | 3 |
| Other pages | 5-50 |
| Roadmap | 90 |
| Developer notes | 91 |
