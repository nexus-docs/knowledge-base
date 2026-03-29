---
title: "SEO"
summary: "Built-in SEO features — auto-generated OG images, JSON-LD structured data, sitemap, breadcrumb titles, and more"
access_tier: public
product: platform
status: published
owner: admin
tags: [seo, opengraph, json-ld, sitemap, meta-tags]
nav_order: 4
---

# SEO

Nexus Docs includes comprehensive SEO features out of the box — no plugins or configuration needed.

## Auto-Generated Social Cards

Every page gets a unique Open Graph image generated at `/api/og?slug=...` with:
- Page title and summary
- Product badge
- Tags
- Site branding

Shared links on Twitter, LinkedIn, Slack, etc. show rich previews automatically.

## Meta Tags

Every public page includes:
- `<title>` built from the breadcrumb path (e.g. "Apache — Web Servers — Trident | My Docs")
- `<meta name="description">` from frontmatter `summary`
- `<meta name="keywords">` from frontmatter `tags`
- Open Graph tags (title, description, image, type, url)
- Twitter Card tags (summary_large_image)
- Canonical URL
- Article metadata (modified_time, section, tags)

## Structured Data (JSON-LD)

| Schema | Where | Purpose |
|--------|-------|---------|
| Organization | Homepage | Company info, social links |
| WebSite + SearchAction | Homepage | Google Sitelinks Search Box |
| TechArticle | Every doc page | Rich article results |
| BreadcrumbList | Every doc page | Navigation hierarchy in SERP |

## Sitemap & Robots

- `sitemap.xml` — auto-generated from all public, published documents
- `robots.txt` — blocks `/api/`, `/admin/`, `/dashboard/`
- Protected pages get `noindex, follow`
- Private pages get `noindex, nofollow`

## Cookie Consent

Google Consent Mode v2 compatible cookie consent banner:
- Default consent: all denied (except essential)
- GTM integration via `NEXT_PUBLIC_GTM_ID` env var
- Granular toggles: analytics, advertising, ad user data, ad personalisation
- Consent state persisted in localStorage
