---
title: "Navigation"
summary: "Mega-menu with category dropdowns, scoped collapsible sidebar, breadcrumbs, and back-link navigation"
access_tier: public
product: platform
status: published
owner: admin
tags: [navigation, sidebar, mega-menu, breadcrumbs]
nav_order: 5
---

# Navigation

Nexus Docs is built for large documentation sites with hundreds of pages. The navigation system keeps things manageable.

## Mega-Menu Header

Top-level navigation with hover-activated dropdown menus showing categories, descriptions, and quick links.

## Scoped Sidebar

The sidebar only shows content relevant to the current section:
- On `/docs/extensions/seo/rich-snippets` — sidebar shows SEO Suite pages
- On `/docs/trident/install/docker` — sidebar shows Trident install options

### Collapsible Children

Children only expand when you navigate into a section. At the top level, you see section names with chevron arrows. Click to expand.

### Back-Link Navigation

When inside a nested section, a "← Parent" link appears at the top of the sidebar for easy upward navigation.

## Breadcrumbs

Every page shows its full path: **Docs** / **Extensions** / **SEO Suite** / **Rich Snippets**

Each breadcrumb segment is clickable.

## Announcement Bar

A dismissible announcement bar at the top of the page for highlighting releases, breaking changes, or promotions. Configurable in `src/components/layout/announcement-bar.tsx`.
