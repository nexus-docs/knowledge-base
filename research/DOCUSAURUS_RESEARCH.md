# Docusaurus v3 Research & Nexus Docs Comparison

**Date:** 2026-03-22
**Scope:** Feature analysis of Docusaurus v3 (Meta) vs Nexus Docs (qoliber)
**Purpose:** Identify high-value features to adopt, gaps to close, and Nexus advantages to preserve

---

## 1. Docusaurus v3 — Killer Features Overview

### 1.1 Versioned Documentation

Docusaurus has first-class multi-version docs. Running `docusaurus docs:version 2.0` snapshots the entire `docs/` folder into `versioned_docs/version-2.0/` and creates a `versioned_sidebars/version-2.0-sidebars.json`. Users see a dropdown selector in the navbar. The "Next" (unreleased) version is available at `/docs/next/`. Each version gets its own sidebar, URL prefix, and search index. This is the single most valuable feature for software documentation that ships multiple releases.

### 1.2 Blog Integration

A full blog engine with:
- Markdown/MDX posts with frontmatter (title, authors, tags, date)
- Author profiles with avatars and social links
- Tag pages and archive pages auto-generated
- RSS/Atom feed generation
- Blog sidebar showing recent posts
- Truncation markers (`<!--truncate-->`) for excerpts
- Reading time estimation

### 1.3 Plugin Ecosystem

Core official plugins:
- **@docusaurus/plugin-content-docs** — the docs engine itself
- **@docusaurus/plugin-content-blog** — blog engine
- **@docusaurus/plugin-content-pages** — standalone pages
- **@docusaurus/plugin-sitemap** — auto sitemap.xml
- **@docusaurus/plugin-google-analytics / plugin-google-gtag** — analytics
- **@docusaurus/plugin-pwa** — progressive web app with offline support
- **@docusaurus/plugin-ideal-image** — lazy loading, responsive srcsets, LQIP placeholders
- **@docusaurus/plugin-client-redirects** — client-side redirect rules

Community plugins:
- **docusaurus-plugin-openapi-docs** — OpenAPI/Swagger spec rendering
- **docusaurus-plugin-typedoc** — TypeScript API docs from source
- **docusaurus-search-local** — offline lunr.js search
- **docusaurus-plugin-sass** — SASS/SCSS support
- **docusaurus-plugin-image-zoom** — click-to-zoom images

### 1.4 MDX Components Library

Built-in MDX components that work out of the box:
- `<Tabs>` / `<TabItem>` — tabbed content (code or prose)
- `<Admonition>` — note, tip, info, warning, danger, caution (6 types, Docusaurus-style with `:::` syntax)
- `<CodeBlock>` — with `title`, `showLineNumbers`, `{1,3-5}` line highlighting, language tabs
- `<DocCardList>` — auto-generated grid of child docs for category index pages
- `<Details>` — styled `<details>/<summary>` collapsible
- `<Heading>` — anchored headings with auto-link
- `<TOCInline>` — inline table of contents anywhere in the doc
- `<BrowserWindow>` — styled browser chrome around content for demos

### 1.5 Tabs Component

```mdx
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="language">
  <TabItem value="js" label="JavaScript">...</TabItem>
  <TabItem value="py" label="Python">...</TabItem>
</Tabs>
```

Key feature: `groupId` synchronizes tab selection across the page. If a user picks "Python" in one code block, all tab groups with the same `groupId` switch to Python. Selection persists via localStorage.

### 1.6 Admonitions

Docusaurus supports 6 types: `note`, `tip`, `info`, `warning`, `danger`, `caution`. Uses a `:::` fenced syntax in Markdown:

```md
:::warning[Custom Title]
Content here
:::
```

The `:::` syntax means admonitions work without importing React components. This is a significant authoring ergonomics win — content authors write pure Markdown, not JSX.

### 1.7 Code Blocks

- Prism-based highlighting (140+ languages)
- `title="config.js"` header bar with filename
- `{1,3-5}` line highlighting with background color
- `showLineNumbers` attribute
- `// highlight-next-line`, `// highlight-start` / `// highlight-end` magic comments
- Live code editor (`@docusaurus/theme-live-codeblock`) — renders React components in real time using react-live
- Line-level diff highlighting with `// diff-add` and `// diff-remove` comments
- Copy button on hover

### 1.8 DocCardList

Auto-generates a card grid for category index pages. When you have `/docs/guides/` with 5 child pages, adding `<DocCardList />` to `guides/index.md` renders a card for each child with its title, description, and link. No manual maintenance needed.

### 1.9 Swizzling (Component Customization)

`npx docusaurus swizzle @docusaurus/theme-classic Footer -- --eject` copies the Footer component into your project for full customization. Two modes:
- **Eject** — full copy for complete control
- **Wrap** — HOC pattern to extend without replacing

This lets users override any theme component (header, footer, sidebar, doc page, blog post layout, search bar, etc.) while still receiving upstream updates for non-swizzled components.

### 1.10 Algolia DocSearch

First-class Algolia DocSearch integration. Configuration is just:
```js
themeConfig: {
  algolia: {
    appId: 'YOUR_APP_ID',
    apiKey: 'YOUR_SEARCH_API_KEY',
    indexName: 'YOUR_INDEX',
  },
},
```
Algolia crawls the site automatically, provides instant search with highlighting, keyboard navigation (Cmd+K), and faceted filtering by version/language. Free for open-source projects.

### 1.11 i18n (Internationalization)

Built-in translation workflow:
- `docusaurus write-translations` extracts all UI strings to JSON files
- Docs are translated by placing files in `i18n/{locale}/docusaurus-plugin-content-docs/`
- Locale dropdown in navbar
- Each locale gets its own build output
- Supports RTL languages
- Integrates with Crowdin for community translation management

### 1.12 SEO

- Auto-generated `sitemap.xml`
- Canonical URLs on every page
- OpenGraph and Twitter meta tags from frontmatter
- Structured data / JSON-LD (can be added via head tags)
- `robots.txt` support
- Per-page `<meta>` overrides via frontmatter (`keywords`, `description`, `image`)
- Social card image support
- `noindex` support for draft pages
- Clean URL structure (`/docs/getting-started` not `/docs/getting-started.html`)

---

## 2. Notable Docusaurus-Powered Sites

| Site | Notable Feature |
|------|----------------|
| **React.dev** (new React docs) | Interactive sandboxes, challenges, deep-dive expandables |
| **Jest** (jestjs.io) | Versioned API docs, runnable code examples |
| **Supabase** (supabase.com/docs) | API reference from OpenAPI, client library tabs |
| **Ionic** (ionicframework.com/docs) | Framework tabs (Angular/React/Vue), version dropdown |
| **Redwood.js** | Tutorial progression, CLI reference docs |
| **Docusaurus itself** | Dogfooding — versioned docs, blog, i18n |
| **Figma Plugin Docs** | Clean design, deep sidebar nesting |
| **Tauri** | Multi-framework guides, Rust API docs alongside JS |
| **Hasura** | Database-specific tabs, GraphQL playground links |
| **Courier** | API reference with code samples in 8 languages |

### Patterns from the best Docusaurus sites:
1. **Framework/language tabs everywhere** — Supabase, Ionic, Tauri use synchronized tabs so users pick their stack once
2. **Interactive playgrounds** — React.dev embeds CodeSandbox; Jest has "Try it" buttons
3. **Version dropdowns** — Jest, Ionic show clear version badges
4. **API reference from specs** — Supabase auto-generates from OpenAPI
5. **Announcement bars** — Docusaurus.io itself uses a dismissible announcement bar for new releases

---

## 3. Docusaurus Approach to Key Workflows

### 3.1 API Documentation Generation
- **docusaurus-plugin-openapi-docs** renders OpenAPI 3.x specs as interactive pages with request/response examples and "Try it" buttons
- **typedoc-plugin-markdown + docusaurus-plugin-typedoc** generates Markdown from TypeScript source code
- Pattern: specs live in repo, CI generates the docs pages, committed or built at deploy time

### 3.2 Interactive Examples
- **@docusaurus/theme-live-codeblock** wraps react-live for editable+renderable React component demos
- BrowserWindow component wraps output in a fake browser chrome
- Some sites embed CodeSandbox/StackBlitz iframes

### 3.3 "Edit This Page" Workflow
- Configured via `editUrl` in docs plugin: `editUrl: 'https://github.com/org/repo/edit/main/'`
- Auto-renders an "Edit this page" link at the bottom of every doc page
- Links directly to the source file in GitHub/GitLab for one-click PR creation
- `editCurrentVersion` option ensures edits go to the current version source

### 3.4 Community/Discussion Integration
- `customFields` in config can link to Discord/Discourse/GitHub Discussions
- Some sites add a "Feedback" widget at the bottom (was this page helpful? yes/no)
- GitHub-based comments via giscus (third-party)
- Issue templates linking to the specific doc page

### 3.5 Announcement Banners
- Built into `themeConfig.announcementBar`:
  ```js
  announcementBar: {
    id: 'v3_release',
    content: 'Docusaurus v3 is out! <a href="/blog/v3">Read the blog post</a>',
    backgroundColor: '#20232a',
    textColor: '#fff',
    isCloseable: true,
  },
  ```
- Dismissal persisted in localStorage by `id`
- Supports HTML content

### 3.6 Progress Indicators
- **Reading progress bar** — some themes add a thin progress bar at the top of the page showing scroll position
- **Sidebar active state** — the sidebar highlights the current page and auto-scrolls to it
- **Pagination** — "Previous" and "Next" links guide sequential reading
- **Breadcrumbs** — show hierarchy context

---

## 4. Feature Gap Analysis: Nexus Docs vs Docusaurus

### What Nexus Docs Already Has (Parity or Better)

| Feature | Status | Notes |
|---------|--------|-------|
| Admonitions (6 types) | DONE | note, tip, info, warning, danger, success. Docusaurus has "caution" instead of "success" |
| Code highlighting (Shiki) | DONE | Actually superior to Docusaurus's Prism — Shiki has better accuracy and theme support |
| Code line highlighting | DONE | `{1,3-5}` syntax in meta strings |
| Code title/filename | DONE | `title="config.ts"` in meta strings |
| Code copy button | DONE | Hover-reveal copy button |
| Code language badge | DONE | Language label in header bar |
| Code tabs | DONE | `<CodeTabs>` component with auto language detection |
| Table of contents | DONE | Sticky right sidebar with IntersectionObserver active tracking |
| Mobile sidebar | DONE | Slide-out drawer with backdrop |
| Prev/next navigation | DONE | Card-style links with title display |
| Search (MeiliSearch) | DONE | Superior to Algolia for self-hosted — instant, typo-tolerant, Cmd+K dialog |
| Dark/light mode | DONE | Theme toggle with persistence |
| Breadcrumbs | DONE | Both desktop and mobile breadcrumb trails |
| Scroll-to-top | DONE | Appears after scrolling |
| Collapsible sections | DONE | `<Collapsible>` MDX component |
| Announcement bar | DONE | Dismissible, localStorage persistence, multiple types |
| Sitemap | DONE | Auto-generated sitemap.xml via Next.js |
| Canonical URLs | DONE | Set in metadata for each doc page |
| OpenGraph tags | DONE | Full OG meta including dynamic OG images via `/api/og` |
| Twitter cards | DONE | summary_large_image cards |
| JSON-LD structured data | DONE | TechArticle, BreadcrumbList, Organization, WebSite, FAQ, Software schemas — more comprehensive than Docusaurus |
| robots.txt | DONE | Generated via Next.js |
| Category cards | DONE | `<CategoryCards>` component for index pages |
| Video embeds | DONE | `<VideoEmbed>` MDX component |
| Last updated timestamp | DONE | Displayed in doc footer |
| Deprecation banners | DONE | Auto-shown for deprecated status docs |

### What Nexus Docs Has That Docusaurus Does NOT

| Feature | Nexus | Docusaurus |
|---------|-------|-----------|
| **ACL / Role-based Permissions** | Full RBAC with tiers (public/registered/premium/admin) | None — all content is public |
| **Per-extension Access Control** | Users can be granted access to specific product extensions | None |
| **Audit Logging** | Full audit trail of admin actions | None |
| **Email Notifications** | Resend-powered invitation and notification emails | None |
| **GitLab Webhook Sync** | Push-to-deploy content sync from GitLab repos | GitHub only for source, no sync |
| **Background Job Queue** | BullMQ workers for async indexing and content sync | None — build-time only |
| **Access Request Workflow** | Users can request access; admins approve/deny | None |
| **User Invitation System** | Email-based invite with accept workflow | None |
| **Admin Dashboard** | Full admin panel with user management, content management, stats | None |
| **Dynamic OG Images** | Server-generated OpenGraph images per page | Must use static images or third-party |
| **MeiliSearch Integration** | Self-hosted, privacy-respecting full-text search | Depends on Algolia (third-party SaaS) |
| **Locked Content Previews** | Shows locked indicator for premium content in search/sidebar | N/A — no access control |
| **Cookie Consent** | Built-in GDPR cookie consent | Requires plugin |

### What Docusaurus Has That Nexus Docs Does NOT

| Feature | Priority | Effort | Impact |
|---------|----------|--------|--------|
| **Versioned documentation** | HIGH | Large | Critical for multi-version software docs |
| **`:::` admonition syntax** (no JSX import needed) | HIGH | Medium | Major authoring ergonomics improvement |
| **Synchronized tabs (`groupId`)** | HIGH | Small | User picks language once, all tabs switch |
| **Blog engine** | MEDIUM | Large | Changelogs, release announcements, tutorials |
| **Live code editor** | MEDIUM | Medium | Interactive React component demos |
| **i18n / translation workflow** | MEDIUM | Large | Multi-language documentation |
| **Magic comment line highlighting** | LOW | Small | `// highlight-next-line` in code |
| **`<DocCardList>` auto-generation** | MEDIUM | Small | Auto-discover child pages without hardcoding |
| **Swizzling / component override system** | LOW | Large | Mainly for theming flexibility |
| **PWA / offline support** | LOW | Medium | Offline docs access |
| **Ideal image optimization** | LOW | Small | LQIP placeholders, responsive images |
| **Edit this page link** | MEDIUM | Tiny | One-click GitLab edit links |
| **Reading progress bar** | LOW | Tiny | Visual scroll progress indicator |
| **Page feedback widget** | MEDIUM | Small | "Was this page helpful?" with analytics |
| **`showLineNumbers` default per language** | LOW | Tiny | Auto line numbers for certain languages |
| **Search result highlighting in page** | LOW | Medium | Highlight matched terms after navigating from search |

---

## 5. Top 10 Features to Adopt from Docusaurus

### 1. Versioned Documentation System
**What:** Snapshot docs at release points; version dropdown in navbar; `/docs/v2.0/...` URL scheme
**Why:** Nexus Docs serves extension documentation — users on different Magento versions need docs for their specific extension version. This is the single biggest gap.
**How:** Add a `version` field to content frontmatter and the content index. Build a version selector component in the header. Route versioned docs at `/docs/{version}/{slug}`. Store snapshots as `content/v{X}/` directories or use Git tags.
**Effort:** Large (2-3 weeks)
**Priority:** P1

### 2. Markdown-Native Admonition Syntax (`:::`)
**What:** Allow `:::warning[Title]\nContent\n:::` in Markdown without JSX imports
**Why:** Content authors (non-developers) should not need to write `<Admonition type="warning">`. The `:::` syntax is standard across MkDocs Material, VitePress, and Docusaurus. Reduces friction for contributors.
**How:** Add `remark-directive` and a custom remark plugin that transforms `:::type` containers into `<Admonition>` components. Keep the JSX syntax working as an alternative.
**Effort:** Small (2-3 days)
**Priority:** P1

### 3. Synchronized Tab Groups (`groupId`)
**What:** When a user selects "Python" in one code tab group, all tab groups on the page with the same `groupId` switch to Python. Persists across page navigations via localStorage.
**Why:** API/SDK docs show the same operation in multiple languages. Forcing users to switch every tab group independently is frustrating.
**How:** Extend `<CodeTabs>` to accept `groupId`. Use React context + localStorage to sync tab state globally. Emit a custom event so independent component instances stay in sync.
**Effort:** Small (2-3 days)
**Priority:** P1

### 4. Edit This Page Link
**What:** A link at the bottom of each doc page pointing to the source file on GitLab for editing
**Why:** Enables community contributions. Every major docs platform has this. Docusaurus, MkDocs, VitePress all include it by default.
**How:** Construct URL from environment variable `GITLAB_REPO_URL` and the doc's source path. Add a pencil icon link next to "Last updated" in the doc footer. One small component + one env var.
**Effort:** Tiny (half day)
**Priority:** P1

### 5. Auto-Generated DocCardList
**What:** A component that automatically discovers child pages in a docs category and renders them as cards, without hardcoding the list
**Why:** The current `<CategoryCards>` in Nexus is hardcoded with specific extension categories. When new docs are added, the card list does not update. Docusaurus's `<DocCardList>` reads from the sidebar/content tree dynamically.
**How:** Create a `<DocCardList>` server component that receives the current slug, queries the content index for child pages, and renders cards with title + description. Falls back to slug-derived titles.
**Effort:** Small (2-3 days)
**Priority:** P2

### 6. Blog / Changelog Engine
**What:** A `/blog` or `/changelog` section with dated posts, author profiles, tags, and RSS feed
**Why:** Extension release notes, migration guides, and announcements currently have no dedicated home. The announcement bar handles one-liners but not detailed content. A blog engine turns releases into content that drives SEO traffic.
**How:** Add a `content/blog/` directory. Create a blog index page with pagination, a post page, tag pages, and an RSS endpoint. Reuse the MDX renderer. Frontmatter: title, date, authors, tags, excerpt.
**Effort:** Medium (1-2 weeks)
**Priority:** P2

### 7. Page Feedback Widget
**What:** A "Was this helpful? Yes / No" widget at the bottom of each doc page, with optional comment
**Why:** Provides direct signal about content quality. Docusaurus sites like Supabase and Hasura use this to identify weak docs. Data feeds into the existing admin dashboard.
**How:** Client component with thumbs up/down buttons. POST to `/api/feedback`. Store in a `PageFeedback` Prisma model (docSlug, helpful boolean, comment, timestamp). Show aggregated stats in admin.
**Effort:** Small (2-3 days)
**Priority:** P2

### 8. Reading Progress Bar
**What:** A thin colored bar at the top of the viewport that fills left-to-right as the user scrolls through a doc page
**Why:** Visual feedback on long docs. Simple to implement, polished UX. Used by many Docusaurus sites and Medium.
**How:** Client component using `scroll` event listener. Calculate `scrollTop / (scrollHeight - clientHeight)`. Render a fixed `div` with `width: {progress}%` and the brand color. Mount only on doc pages.
**Effort:** Tiny (half day)
**Priority:** P2

### 9. Live Code Editor for React Components
**What:** Code blocks marked with `live` render an editable code editor alongside a live preview of the React component output
**Why:** Nexus Docs documents Magento extensions, but if it ever expands to React component libraries or SDK docs, live editors are a killer feature. Even for configuration examples, showing live JSON/YAML validation would be valuable.
**How:** Use `@sandpack/react` (CodeSandbox's embeddable editor) or `react-live`. Add a `live` meta flag to code blocks. The code block component renders a split editor+preview pane when `live` is present.
**Effort:** Medium (1 week)
**Priority:** P3

### 10. i18n Framework
**What:** Multi-language support with locale selector, translated content directories, and UI string extraction
**Why:** qoliber operates internationally. Extension docs in English only limits reach. Docusaurus's `write-translations` command and `i18n/{locale}/` directory structure is a proven pattern.
**How:** Use `next-intl` or `next-i18next` for UI strings. Add `locale` to content frontmatter and the content index. Create a locale switcher in the header. Route at `/{locale}/docs/{slug}`. Start with EN + one target language.
**Effort:** Large (3-4 weeks)
**Priority:** P3

---

## 6. Implementation Priority Matrix

### Phase 1 — Quick Wins (1-2 weeks)

| # | Feature | Effort | Files to Change |
|---|---------|--------|----------------|
| 4 | Edit This Page link | 0.5 day | New: `src/components/docs/edit-link.tsx`; Edit: doc page |
| 8 | Reading progress bar | 0.5 day | New: `src/components/ui/reading-progress.tsx`; Edit: doc layout |
| 2 | `:::` admonition syntax | 2 days | Add `remark-directive`; New remark plugin; Edit: `mdx-renderer.tsx` |
| 3 | Synchronized tab groups | 2 days | Edit: `code-tabs.tsx`; New: tab sync context/hook |

### Phase 2 — Core Enhancements (2-4 weeks)

| # | Feature | Effort | Files to Change |
|---|---------|--------|----------------|
| 5 | Auto DocCardList | 2 days | New: `src/components/docs/doc-card-list.tsx`; Edit: `mdx-renderer.tsx` |
| 7 | Page feedback widget | 3 days | New component, API route, Prisma model, admin stats |
| 6 | Blog/changelog engine | 1-2 weeks | New: `content/blog/`, blog pages, RSS route, blog components |

### Phase 3 — Major Features (1-2 months)

| # | Feature | Effort | Files to Change |
|---|---------|--------|----------------|
| 1 | Versioned docs | 2-3 weeks | Content structure, routing, version selector, search index updates |
| 9 | Live code editor | 1 week | New dependency, code-block enhancement |
| 10 | i18n framework | 3-4 weeks | Routing, content structure, UI extraction, locale switcher |

---

## 7. Strategic Assessment

### Nexus Docs Advantages Over Docusaurus

Nexus Docs is **not** a static site generator — it is a **full-stack documentation platform** with capabilities Docusaurus fundamentally cannot provide:

1. **Access control** — Docusaurus generates static HTML. It cannot hide content behind auth without a paid proxy layer. Nexus has native RBAC with per-extension granularity.
2. **Server-side rendering** — Next.js 15 with React 19 Server Components means Nexus can do per-request ACL checks, dynamic content, and personalization that Docusaurus cannot.
3. **Self-hosted search** — MeiliSearch is privacy-compliant and does not send queries to a third party. Algolia is SaaS.
4. **Admin panel** — Docusaurus has no admin UI. Content is managed via Git only.
5. **Webhook-driven sync** — Nexus syncs content from GitLab on push. Docusaurus requires a full CI/CD rebuild.
6. **Background workers** — Async indexing, email sending, and content processing via BullMQ.

### Where Docusaurus Wins

1. **Ecosystem maturity** — Thousands of plugins, themes, and community resources.
2. **Content authoring DX** — `:::` syntax, `groupId` tabs, and zero-config features make it easier for non-technical writers.
3. **Versioning** — The single feature most critical for software documentation that Nexus lacks entirely.
4. **Static output** — Docusaurus builds to static HTML, which is trivially cached at the CDN edge. Nexus requires a running server.
5. **Blog** — Built-in blog engine with RSS, tags, and author profiles.

### Recommendation

Do NOT migrate to Docusaurus. Nexus Docs has unique enterprise capabilities (ACL, audit, admin, email) that would require extensive custom plugins to replicate in Docusaurus. Instead, adopt the **authoring DX patterns** from Docusaurus (features 1-8 above) while preserving the full-stack architecture that differentiates Nexus.

The highest-ROI investments are:
1. **Versioned docs** — unlocks multi-version support for extension releases
2. **`:::` admonition syntax** — reduces contributor friction to zero
3. **Synchronized tabs** — essential for multi-language code samples
4. **Edit this page link** — trivial to implement, high perceived polish

---

## Appendix: Docusaurus Configuration Reference

Key `docusaurus.config.js` patterns worth studying:

```js
// Version management
docs: {
  lastVersion: 'current',
  versions: {
    current: { label: '3.0', path: '3.0' },
    '2.0': { label: '2.0', path: '2.0', banner: 'unmaintained' },
  },
},

// i18n
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'fr', 'ja'],
},

// Announcement bar
announcementBar: {
  id: 'v3',
  content: 'New version available!',
  isCloseable: true,
},

// Algolia search
algolia: {
  appId: '...',
  apiKey: '...',
  indexName: '...',
  contextualSearch: true, // version-aware search
},

// Edit URL
editUrl: 'https://github.com/org/repo/edit/main/',

// Navbar version dropdown
navbar: {
  items: [
    { type: 'docsVersionDropdown', position: 'right' },
    { type: 'localeDropdown', position: 'right' },
  ],
},
```
