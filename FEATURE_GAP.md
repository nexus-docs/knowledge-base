# Feature Gap Analysis: Nexus Docs vs Leading Documentation Platforms

## Platform Overview

| Platform | Stack | Strengths |
|----------|-------|-----------|
| **Wiki.js** | Node.js, Vue.js, PostgreSQL | Rich editor, granular permissions, multi-language, built-in search (Elasticsearch/PostgreSQL) |
| **MkDocs Material** | Python, Jinja2 | Excellent code blocks, admonitions, tabs, search, SEO, navigation, instant loading |
| **Docusaurus** | React, MDX | Versioning, i18n, Algolia search, sidebars, MDX, plugin ecosystem |
| **VitePress** | Vue, Vite | Code groups, custom containers, fast HMR, lightweight, markdown extensions |
| **Nexus Docs** | Next.js 15, React 19, MDX, Tailwind 4 | ACL/permissions, GitLab integration, audit logging, MeiliSearch, email system |

---

## Feature Comparison Matrix

| Feature | Nexus Docs | Wiki.js | MkDocs Material | Docusaurus | VitePress |
|---------|:----------:|:-------:|:----------------:|:----------:|:---------:|
| **Code Syntax Highlighting** | Basic | Yes | Yes (Shiki) | Yes (Prism) | Yes (Shiki) |
| Code Line Numbers | No | Yes | Yes | Yes | Yes |
| Code Line Highlighting | No | No | Yes | Yes | Yes |
| Code Diff View | No | No | Yes | No | Yes |
| Code Title/Filename | No | No | Yes | Yes | Yes |
| Code Copy Button | No | No | Yes | Yes | Yes |
| Code Language Badge | No | No | Yes | Yes | Yes |
| **Code Groups/Tabs** | No | No | Yes | Yes | Yes |
| **Admonitions/Callouts** | Yes | Yes | Yes | Yes | Yes |
| **Table of Contents (on-page)** | No | Yes | Yes | Yes | Yes |
| **Full-text Search** | Yes (MeiliSearch) | Yes | Yes (lunr.js) | Yes (Algolia) | Yes (local) |
| Search Highlighting | Partial | Yes | Yes | Yes | Yes |
| **Breadcrumbs** | Yes | Yes | No (plugin) | Yes | No |
| **Prev/Next Navigation** | No | No | Yes | Yes | Yes |
| **Mobile Sidebar** | No | Yes | Yes | Yes | Yes |
| **Dark/Light Mode** | Yes | Yes | Yes | Yes | Yes |
| **Version Selector** | No | No | Yes (mike) | Yes | No |
| **Edit This Page Link** | No | Yes | Yes | Yes | Yes |
| **Last Updated Timestamp** | Yes | Yes | Yes (git) | Yes (git) | Yes (git) |
| **Mermaid Diagrams** | No | Yes | Yes (plugin) | Yes (plugin) | Yes |
| **Math/KaTeX** | No | Yes | Yes (plugin) | Yes (plugin) | Yes |
| **Tabbed Content** | No | No | Yes | Yes | Yes |
| **Collapsible Sections** | No | No | Yes | Yes | Yes |
| **Badge/Status Indicators** | No | No | Yes | Yes | Yes |
| **Scroll-to-Top Button** | No | No | Yes | No | Yes |
| **ACL / Permissions** | Yes | Yes | No | No | No |
| **Audit Logging** | Yes | Yes | No | No | No |
| **Email Notifications** | Yes | No | No | No | No |
| **GitLab Sync** | Yes | Yes | No | No | No |
| **Background Workers** | Yes | No | No | No | No |

---

## Missing Features (Ranked by Priority)

### Priority 1 — Critical (Core Reading Experience)

1. **Enhanced Code Blocks with Shiki** — Syntax highlighting with line numbers, line highlighting, copy button, title bar, language badge. Shiki is already in package.json.
2. **Table of Contents** — Auto-generated from headings, sticky sidebar, active heading tracking. Every competitor has this.
3. **Mobile Sidebar** — The current sidebar is `hidden lg:block`. Below `lg` there is no navigation at all.
4. **Scroll-to-Top Button** — Simple UX improvement for long documentation pages.

### Priority 2 — High (Content Authoring)

5. **Code Tabs/Groups** — Show the same concept in multiple languages side by side. Essential for API/SDK docs.
6. **Prev/Next Page Navigation** — Guide readers through documentation in sequence.
7. **Edit This Page Link** — Link to the GitLab source file for community contributions.
8. **Collapsible Sections** — For FAQs, advanced options, long reference tables.

### Priority 3 — Medium (Enhanced Content)

9. **Mermaid Diagram Support** — Architecture diagrams, flowcharts, sequence diagrams.
10. **Math/KaTeX Support** — For technical/scientific documentation.
11. **Badge/Status Indicators** — Version badges, status labels (stable, beta, deprecated).
12. **Version Selector** — Multi-version documentation support.

### Priority 4 — Low (Nice to Have)

13. **Tabbed Content (non-code)** — Generic tabbed sections for any content.
14. **Code Diff View** — Show additions/removals in code blocks.
15. **i18n Support** — Multi-language documentation.

---

## Implementation Recommendations

### 1. Enhanced Code Blocks (Shiki)
- **Component**: `src/components/markdown/code-block.tsx` (replace existing)
- **Approach**: Use `shiki` (already installed) with `rehype-shiki` or a custom rehype plugin. Add a client wrapper for the copy button. Parse meta strings like `title="config.ts" {1,3-5}` for titles and line highlighting.

### 2. Table of Contents
- **Component**: `src/components/docs/table-of-contents.tsx` (new)
- **Approach**: Client component that reads headings from the DOM via `querySelectorAll('h2, h3')`. Use `IntersectionObserver` to track the active heading. Render as a sticky right sidebar.

### 3. Mobile Sidebar
- **Component**: Modify `src/components/layout/sidebar.tsx` + new `src/components/layout/mobile-sidebar.tsx`
- **Approach**: Add a hamburger button in the header (visible below `lg`). Use a slide-out drawer with backdrop. Share `SidebarItems` between desktop and mobile.

### 4. Scroll-to-Top Button
- **Component**: `src/components/ui/scroll-to-top.tsx` (new)
- **Approach**: Client component, appears after scrolling 300px. Smooth scroll to top.

### 5. Code Tabs
- **Component**: `src/components/markdown/code-tabs.tsx` (new)
- **Approach**: MDX component `<CodeTabs>` that wraps multiple code blocks. Client component with tab state.

### 6. Prev/Next Navigation
- **Component**: `src/components/docs/prev-next-nav.tsx` (new)
- **Approach**: Flatten the nav tree to get ordered pages. Find current page index. Render prev/next links.

### 7. Edit This Page Link
- **Component**: Inline in doc page or small component `src/components/docs/edit-link.tsx`
- **Approach**: Construct GitLab URL from slug: `${GITLAB_REPO_URL}/-/edit/main/content/${slug}.md`

### 8. Collapsible Sections
- **Component**: `src/components/markdown/collapsible.tsx` (new)
- **Approach**: MDX component using HTML `<details>/<summary>` with styled Tailwind classes.
