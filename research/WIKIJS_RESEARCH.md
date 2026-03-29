# Wiki.js Research & Comparison with Nexus Docs

> Research date: 2026-03-22
> Wiki.js versions analyzed: v2.5 (stable), v3.0 (beta/in development)
> Nexus Docs: Next.js 15 / React 19 / Prisma / Meilisearch / BullMQ

---

## 1. Wiki.js Platform Overview

Wiki.js is an open-source, Node.js-based wiki platform built on Vue.js (v2) / Nuxt (v3) with PostgreSQL as the primary database. It positions itself as a modern, self-hosted alternative to Confluence, Notion, and GitBook for internal documentation and knowledge bases.

### Architecture

| Component | Wiki.js v2 | Wiki.js v3 (planned) |
|-----------|-----------|---------------------|
| Backend | Node.js + Express + Apollo GraphQL | Node.js + Fastify + tRPC |
| Frontend | Vue.js 2 + Vuetify | Nuxt 3 + Quasar |
| Database | PostgreSQL, MySQL, MariaDB, MS SQL, SQLite | PostgreSQL only |
| Search | PostgreSQL FTS, Elasticsearch, Algolia, Azure Search, AWS CloudSearch, Meilisearch (v3) | PostgreSQL FTS, Elasticsearch, Meilisearch |
| Storage | Local disk, Git, S3, Azure Blob, Google Cloud, SFTP, WebDAV | Similar + improved Git sync |
| Auth | 50+ strategies via Passport.js | Streamlined auth with OIDC focus |

---

## 2. Wiki.js Feature Deep Dive

### 2.1 Multiple Editors

Wiki.js offers several built-in editors, allowing authors to choose the best tool for their skill level:

| Editor | Description | Nexus Docs Equivalent |
|--------|------------|----------------------|
| **Markdown** | Full GFM + extensions, toolbar assistance | Markdown/MDX files in GitLab (external) |
| **Visual (WYSIWYG)** | Block-based rich text editor | Not available |
| **API** | Create/update pages programmatically via GraphQL | REST API routes exist, but no page creation |
| **Raw HTML** | Direct HTML editing | Not available |
| **AsciiDoc** | AsciiDoc format support | Not available |

**Gap for Nexus:** Nexus has no in-app editor. Content authoring requires GitLab access. This is by design (GitLab is source of truth), but limits non-technical contributors.

### 2.2 Authentication (50+ Strategies)

Wiki.js uses Passport.js to support a massive range of auth strategies:

| Category | Strategies | Count |
|----------|-----------|-------|
| **Social OAuth** | Google, GitHub, GitLab, Facebook, Twitter, Discord, Slack, Twitch | 15+ |
| **Enterprise SSO** | SAML 2.0, OIDC, LDAP/AD, Okta, Azure AD, Auth0, Keycloak | 10+ |
| **Local** | Local database (email/password) | 1 |
| **API Keys** | API key authentication for programmatic access | 1 |
| **Two-Factor** | TOTP (Google Authenticator, Authy) | 1 |
| **Other** | CAS, Dropbox, Firebase, Generic OAuth2, JWT, Rocket.Chat | 15+ |

**Nexus Docs currently supports:**
- GitLab OAuth
- Credentials (email/password)
- Magento-synced accounts (via webhooks)

**Gap:** Nexus lacks SAML/OIDC/LDAP for enterprise partners, 2FA, and API key auth. The ARCHITECTURE.md already lists SSO as a future consideration.

### 2.3 Page Rules and Permissions

Wiki.js has a sophisticated rule-based permission system:

| Feature | Wiki.js | Nexus Docs |
|---------|---------|------------|
| **Permission model** | Rule-based: path patterns + groups + operations | Tier-based: public/client/partner/admin + per-extension |
| **Path-based rules** | Regex patterns (`/projects/*`, `/internal/**`) | Frontmatter `access_tier` per page |
| **Operations** | Read, write, delete, manage, comment (granular) | Read only (content is read-only by design) |
| **Groups** | Unlimited custom groups with inherited permissions | 4 fixed tiers + extension-based entitlements |
| **Self-registration** | Configurable per auth strategy | Access request + admin approval |
| **Guest access** | Configurable per path | Public tier |
| **Default permissions** | Configurable defaults for new users | Default to `public` tier |

**Nexus advantage:** Extension-based ACL (per-product entitlements tied to Magento licenses) is more sophisticated than Wiki.js for commercial documentation. Wiki.js has no concept of "you bought Product X, so you can see Product X docs."

**Wiki.js advantage:** Granular write/delete/manage/comment permissions per path pattern. More flexible group system for internal teams.

### 2.4 Search Engines

Wiki.js supports multiple search backends with a pluggable architecture:

| Search Engine | Wiki.js v2 | Nexus Docs |
|---------------|-----------|------------|
| **PostgreSQL FTS** | Built-in, zero config | Not used for search |
| **Elasticsearch** | Full support, advanced queries | Not available |
| **Algolia** | Cloud search, typo tolerance | Not available |
| **Meilisearch** | Planned for v3 | Primary search engine |
| **Azure Search** | Enterprise cloud search | Not available |
| **AWS CloudSearch** | AWS-native search | Not available |
| **Lunr.js** | Client-side fallback | Not available |

**Nexus advantage:** Meilisearch with ACL-filtered search is actually more advanced than Wiki.js's search ACL. Nexus builds compound filters per user that respect both tier and extension entitlements, which Wiki.js does not natively support.

### 2.5 Git Sync (Bi-directional)

| Feature | Wiki.js | Nexus Docs |
|---------|---------|------------|
| **Direction** | Bi-directional (push + pull) | Pull-only (GitLab webhook triggers sync) |
| **Providers** | GitHub, GitLab, Bitbucket, Azure Repos, generic Git | GitLab only |
| **Conflict resolution** | Automatic merge with manual conflict UI | No conflicts (GitLab is sole source of truth) |
| **Sync frequency** | Configurable interval + webhook | Webhook-triggered only |
| **In-app editing** | Edits sync back to Git repo | No in-app editing |

**Nexus design choice:** One-directional sync is intentional. GitLab MRs ensure review, CI checks, and approval before content goes live. Wiki.js's bi-directional sync can lead to content conflicts and bypasses review workflows.

### 2.6 Storage Backends

Wiki.js supports multiple storage backends simultaneously:

| Backend | Wiki.js | Nexus Docs |
|---------|---------|------------|
| **Local disk** | Yes | Yes (Docker volume, content-cache) |
| **Git** | Yes (bi-directional) | Yes (pull-only from GitLab) |
| **AWS S3** | Yes | No |
| **Azure Blob** | Yes | No |
| **Google Cloud Storage** | Yes | No |
| **SFTP** | Yes | No |
| **WebDAV** | Yes | No |
| **DigitalOcean Spaces** | Yes | No |

**Assessment:** Nexus does not need multi-backend storage. Content is in GitLab, synced to a Docker volume. S3/Azure support would only matter for asset management (images, PDFs).

### 2.7 Asset Management

| Feature | Wiki.js | Nexus Docs |
|---------|---------|------------|
| **Image upload** | In-editor drag & drop, paste from clipboard | No (images in GitLab content repo) |
| **File manager** | Built-in browse, upload, rename, delete | No file manager |
| **Image editor** | Basic crop/resize in-app | No |
| **Folder organization** | Virtual folders by page path | File system (Git repo structure) |
| **Max file size** | Configurable | N/A |
| **CDN integration** | External storage backends act as CDN | No |
| **Asset search** | Search by filename | No |

**Gap:** This is a meaningful gap. Non-technical users cannot easily add images to docs without GitLab access. However, since Nexus uses GitLab as source of truth, adding an asset manager would create a dual-write problem.

### 2.8 Comments / Discussion

| Feature | Wiki.js | Nexus Docs |
|---------|---------|------------|
| **Page comments** | Built-in comment system | Not available |
| **Discussion threads** | Threaded replies | Not available |
| **Moderation** | Admin can delete/edit comments | N/A |
| **Notifications** | Email on new comment | N/A |
| **Integration** | Can use Disqus, Commento | Not available |

**Gap:** Nexus has "Report an Issue" (creates GitLab issue) but no page-level discussion. For a partner portal, comments/discussion would enable collaboration.

### 2.9 Page History / Revisions

| Feature | Wiki.js | Nexus Docs |
|---------|---------|------------|
| **Revision tracking** | Every save creates a revision | Git-based (ContentRevision model in DB) |
| **Diff view** | Visual side-by-side diff | Diff stored in DB, admin view |
| **Restore** | One-click restore to any revision | Must revert in GitLab |
| **Author attribution** | Per-revision | Per-commit author |
| **Revision comparison** | Compare any two revisions | Not available |
| **Retention** | Configurable | Git history (indefinite) |

**Assessment:** Both track history. Wiki.js has a better UX for viewing diffs (visual in-browser), but Nexus's Git-based approach is more robust and integrates with existing Git workflows.

### 2.10 Tags and Categories

| Feature | Wiki.js | Nexus Docs |
|---------|---------|------------|
| **Tags** | Built-in tagging with tag manager | Frontmatter `tags` array |
| **Tag search** | Filter pages by tag | Meilisearch filterable attribute |
| **Categories** | Path-based (folder structure) | Path-based + `product` field |
| **Tag cloud** | Visual tag cloud widget | Not available |
| **Admin tag management** | Rename, merge, delete tags | Manual (edit frontmatter) |

**Assessment:** Both support tags. Wiki.js has better tag management UI. Nexus's `product` + `tags` + folder structure is functionally equivalent.

### 2.11 Navigation Builder

| Feature | Wiki.js | Nexus Docs |
|---------|---------|------------|
| **Drag & drop** | Visual sidebar builder | No (auto-generated from file tree + `nav_order`) |
| **Custom grouping** | Arbitrary page grouping | File system structure |
| **External links** | Add external URLs to nav | Not supported |
| **Icons** | Per-item icons | Not available |
| **Multiple nav trees** | Different navs for different sections | Single nav tree, ACL-pruned |

**Gap:** Nexus generates navigation automatically from the file tree with `nav_order` and `nav_hidden` frontmatter. This works well for content-driven sites but lacks flexibility for custom navigation structures.

### 2.12 Theming Engine

| Feature | Wiki.js | Nexus Docs |
|---------|---------|------------|
| **Built-in themes** | Default theme + community themes | Custom theme (Tailwind CSS) |
| **CSS injection** | Custom CSS/JS injection | Full control (source code) |
| **Dark mode** | Yes | Yes |
| **Logo/branding** | Admin panel configuration | Code-level customization |
| **Custom layouts** | Theme templates | Next.js layouts |
| **Theme marketplace** | Community themes | N/A (single deployment) |

**Assessment:** Wiki.js has a plug-and-play theming system for non-developers. Nexus has full code control, which is better for a single-tenant deployment with custom branding needs.

### 2.13 Webhooks

| Feature | Wiki.js | Nexus Docs |
|---------|---------|------------|
| **Incoming** | Limited | GitLab, GitHub, Magento, custom |
| **Outgoing** | Not built-in (v2) | Full system: registry, HMAC, retry, delivery logs |
| **Event types** | Page create/update/delete | doc.updated, issue.reported, user.registered, etc. |
| **HMAC signing** | No | Yes |
| **Retry logic** | No | Exponential backoff, 3 attempts |
| **Delivery logs** | No | Full delivery history in DB |

**Nexus advantage:** Nexus has a significantly more robust webhook system than Wiki.js. DB-backed registry, HMAC signing, retry with backoff, and delivery logs are enterprise-grade features Wiki.js lacks.

### 2.14 API

| Feature | Wiki.js | Nexus Docs |
|---------|---------|------------|
| **GraphQL API** | Full CRUD, schema explorer | Not available |
| **REST API** | Limited (v2), expanded (v3) | Full REST API routes |
| **Authentication** | API key + Bearer token | Session/JWT (NextAuth) |
| **CRUD operations** | Create, read, update, delete pages | Read-only (content from Git) |
| **Admin operations** | Full admin API | User management, audit logs, stats |
| **API documentation** | GraphQL Playground built-in | No API docs |
| **Rate limiting** | Configurable | Redis-based rate limiting |

**Gap:** Wiki.js's GraphQL API with built-in Playground is developer-friendly. Nexus should consider adding OpenAPI/Swagger documentation for its REST endpoints.

### 2.15 Analytics / Telemetry

| Feature | Wiki.js | Nexus Docs |
|---------|---------|------------|
| **Page analytics** | Built-in page view tracking | Audit log (page.view events) |
| **Popular pages** | Dashboard widget | Admin API endpoint |
| **Search analytics** | Search query tracking | Audit log (search.query events) |
| **User activity** | Login tracking | Full audit trail |
| **Admin dashboard** | Built-in stats dashboard | Admin panel with stats, charts (Recharts) |
| **External analytics** | Google Analytics, Matomo integration | Not built-in |

**Assessment:** Both track similar data. Nexus's audit log is more comprehensive (permission changes, access requests, denial tracking). Wiki.js has more polished visualization.

### 2.16 Diagram Support

| Feature | Wiki.js | Nexus Docs |
|---------|---------|------------|
| **Mermaid** | Yes | Component exists (`mdx-renderer.tsx`) |
| **Draw.io** | Built-in integration | Not available |
| **PlantUML** | Yes (server-side rendering) | Not available |
| **Kroki** | Yes (universal diagram renderer) | Not available |

**Gap:** Wiki.js's Draw.io integration allows visual diagram editing in-browser. PlantUML and Kroki support covers additional diagram types. Nexus has Mermaid only.

### 2.17 Multi-language / i18n

| Feature | Wiki.js | Nexus Docs |
|---------|---------|------------|
| **UI localization** | 40+ languages built-in | English only |
| **Content i18n** | Per-page language variants | Not available |
| **Language switcher** | Built-in UI switcher | Not available |
| **RTL support** | Yes | Not available |
| **Translation management** | Linked page variants | Not available |

**Gap:** Listed as a future consideration in Nexus's ARCHITECTURE.md. Wiki.js has mature i18n with Crowdin-powered UI translations and per-page language variants.

---

## 3. Enterprise Features Worth Considering

Wiki.js (especially v3) targets enterprise deployments with these features:

| Feature | Wiki.js | Nexus Docs | Priority for Nexus |
|---------|---------|------------|-------------------|
| **SAML/OIDC SSO** | Built-in | Not available | HIGH - enterprise partners need it |
| **LDAP/Active Directory** | Built-in | Not available | MEDIUM - depends on partner needs |
| **Two-Factor Auth (2FA)** | TOTP built-in | Not available | HIGH - security requirement |
| **API Keys** | Built-in | Not available | HIGH - integration scenarios |
| **Audit compliance** | Basic | Advanced (Nexus wins) | Already strong |
| **RBAC** | Group-based, path rules | Tier + extension (Nexus wins for commercial docs) | Already strong |
| **Backup/restore** | Built-in | Docker volumes + Git | MEDIUM |
| **Kubernetes support** | Helm chart | Docker Compose | LOW - current setup is fine |
| **White-labeling** | Theme customization | Full code control | Already strong |
| **Content approval workflow** | v3 planned | GitLab MR workflow | Already strong |

---

## 4. Content Management Workflow Comparison

### Wiki.js Workflow
```
Author → In-app Editor → Save → Published (immediate)
                        └─ or → Git Sync → External review
```
- Instant publishing (no review gate by default)
- Optional Git sync for backup/version control
- No built-in approval workflow in v2 (planned for v3)
- Comments allow inline feedback

### Nexus Docs Workflow
```
Author → GitLab MR → CI checks → Review → Merge → Webhook → Content Sync → Published
```
- Enforced review via GitLab MR
- CI validation (markdown lint, frontmatter, links, spellcheck)
- Human approval required
- Full audit trail via Git + DB

**Assessment:** Nexus has a more rigorous content workflow. Wiki.js optimizes for speed of publishing. For a commercial documentation portal with compliance requirements, Nexus's approach is superior. However, it creates a higher barrier to entry for non-technical authors.

---

## 5. User Management and Permissions Model Comparison

### Wiki.js Model
```
Users ──> Groups ──> Page Rules
                      ├── Path pattern (regex)
                      ├── Permissions (read, write, delete, manage, comment)
                      └── Deny rules (explicit deny overrides)
```
- Groups are arbitrary (engineering, marketing, external-partners)
- Rules match path patterns: `/internal/**`, `/projects/alpha/*`
- Permissions are granular: separate read, write, delete, comment, manage
- Deny rules override allow rules
- Self-registration can be restricted per auth strategy
- Guest access configurable per path

### Nexus Docs Model
```
Users ──> Tier (public/client/partner/admin)
     └──> Extensions[] (per-product entitlements)
                      ├── Enforced at: page render, search, nav, sitemap, AI
                      └── Synced from: Magento license API
```
- Four fixed tiers with hierarchical access
- Extension entitlements tied to commercial licenses
- ACL enforced at every boundary (render, search, nav, API, AI context)
- Access request + admin approval workflow
- Invitation system for pre-provisioning access

**Assessment:** Different models for different needs. Wiki.js is more flexible for internal wikis with diverse teams. Nexus is purpose-built for commercial documentation with license-based entitlements. Nexus's model is harder to replicate in Wiki.js than vice versa.

---

## 6. Feature Comparison Summary

### What Nexus Does Better

| Area | Why Nexus Wins |
|------|---------------|
| **License-based ACL** | Per-extension entitlements tied to Magento purchases. Wiki.js has no concept of commercial license gating. |
| **Search ACL** | Compound Meilisearch filters enforce tier + extension permissions. Wiki.js search does not filter by permission groups. |
| **Content workflow** | GitLab MR pipeline with CI checks, review, approval. Wiki.js publishes immediately. |
| **Webhook system** | DB-backed registry, HMAC signing, retry logic, delivery logs. Wiki.js has minimal webhook support. |
| **Audit logging** | Comprehensive event tracking (views, denials, searches, permission changes). Wiki.js tracks basic page changes. |
| **AI integration** | AI chat sidebar with ACL-filtered context, background doc review, repo scan for auto-generation. Wiki.js has no AI features. |
| **Background jobs** | BullMQ worker with content sync, reindex, email, webhook delivery. Wiki.js processes everything synchronously. |
| **Email system** | Transactional emails with templates (access requests, approvals, notifications). Wiki.js has limited email. |
| **SEO** | SSG for public pages, JSON-LD, OG tags, canonical URLs, programmatic sitemap. Wiki.js has basic SEO. |

### What Wiki.js Does Better

| Area | Why Wiki.js Wins |
|------|-----------------|
| **In-app editing** | Multiple editors (Markdown, WYSIWYG, HTML). Non-technical users can contribute without Git knowledge. |
| **Authentication breadth** | 50+ auth strategies out of the box (SAML, OIDC, LDAP, social logins). |
| **2FA** | Built-in TOTP support. |
| **GraphQL API** | Full CRUD API with built-in Playground. |
| **Asset management** | Drag-and-drop image upload, file manager, in-editor image pasting. |
| **Comments/discussion** | Per-page comment threads for collaboration. |
| **Navigation builder** | Drag-and-drop sidebar customization. |
| **Diagram variety** | Draw.io (visual editor), PlantUML, Kroki in addition to Mermaid. |
| **i18n** | 40+ UI languages, per-page language variants, RTL support. |
| **Multi-backend search** | Swap between PostgreSQL FTS, Elasticsearch, Algolia without code changes. |
| **Storage flexibility** | S3, Azure Blob, GCS, SFTP, WebDAV backends for assets. |
| **Visual diff** | Side-by-side revision comparison in browser. |

---

## 7. Top 10 Features Worth Adding to Nexus

Ranked by value-to-effort ratio and relevance to Nexus's commercial documentation use case:

### 1. SAML/OIDC SSO Authentication
**Value: Critical | Effort: Medium**

Enterprise partners and larger clients need SSO. NextAuth.js v5 supports OIDC natively. Adding a generic OIDC provider (which covers Azure AD, Okta, Keycloak, Auth0) would cover most enterprise requirements with a single implementation.

**Implementation:** Add a configurable OIDC provider to `src/lib/auth/config.ts`. Store provider configuration in DB (admin-configurable). Map OIDC groups/claims to Nexus tiers.

### 2. API Key Authentication
**Value: High | Effort: Low**

Partners and integrations need API access without OAuth flows. Generate scoped API keys (read-only, per-extension) with rate limiting.

**Implementation:** Add `ApiKey` model to Prisma schema. Middleware to validate `Authorization: Bearer <api-key>` headers. Scope keys to specific extensions/tiers. Admin UI to manage keys.

### 3. Two-Factor Authentication (2FA/TOTP)
**Value: High | Effort: Medium**

Security requirement for partner/admin accounts. TOTP (Google Authenticator, Authy) is the standard.

**Implementation:** Add `totpSecret` and `totpEnabled` to User model. Use `otplib` for TOTP generation/verification. Add setup flow in user settings. Enforce for admin tier.

### 4. Page Comments / Discussion
**Value: High | Effort: Medium**

Enable partner collaboration on documentation pages. Threaded comments with email notifications when someone replies.

**Implementation:** Add `Comment` model (userId, pagePath, parentId, body, createdAt). API routes for CRUD. Client component below page content. Email notification via existing `email-notify` worker job. ACL: only users who can read a page can comment on it.

### 5. In-Browser Visual Diff for Page History
**Value: Medium | Effort: Low**

The `ContentRevision` model already stores diffs. Add a UI to view them with syntax highlighting.

**Implementation:** Use `diff2html` library to render stored diffs as side-by-side or inline views. Add a "History" tab/button on each doc page. Admin and content owners can see full history; users see a simplified "Last updated" view.

### 6. Draw.io / Diagrams.net Integration
**Value: Medium | Effort: Low**

Embed editable diagrams directly in documentation. Draw.io diagrams can be stored as XML in `.drawio` files within the content repo and rendered as SVG.

**Implementation:** Add a `<DrawioDiagram>` MDX component that renders `.drawio` XML as SVG using the draw.io embed viewer. For editing, link to draw.io web editor with the file URL.

### 7. Asset Upload API (S3-backed)
**Value: Medium | Effort: Medium**

Allow admins/partners to upload images and files without Git. Store in S3/MinIO, reference in markdown via CDN URL.

**Implementation:** Add presigned URL upload endpoint. Store metadata in DB. Serve via CDN or S3 public URL. Add image picker component for admin users. Keep Git repo as source of truth for content text, S3 for binary assets.

### 8. API Documentation (OpenAPI/Swagger)
**Value: Medium | Effort: Low**

Auto-generate API documentation from route handlers. Partners and integrators need reference docs for the REST API.

**Implementation:** Add JSDoc/OpenAPI annotations to API routes. Use `next-swagger-doc` or similar to generate OpenAPI spec. Serve Swagger UI at `/api/docs`.

### 9. Navigation Customization Admin Panel
**Value: Medium | Effort: Medium**

Allow admins to customize sidebar navigation without editing frontmatter. Override `nav_order`, `nav_hidden`, add custom groupings, external links.

**Implementation:** Add `NavOverride` model to store admin customizations. Nav builder reads file-tree-generated nav, then applies DB overrides. Admin UI with drag-and-drop reordering (using `dnd-kit`).

### 10. Content Scheduling (Publish/Unpublish Dates)
**Value: Medium | Effort: Low**

Schedule content to go live or expire on specific dates. Useful for product launches, deprecation notices, time-limited partner content.

**Implementation:** Add `publishAt` and `unpublishAt` to frontmatter schema. Content loader filters by current date. Worker job runs on schedule to trigger reindex when content transitions states. Admin dashboard shows upcoming scheduled changes.

---

## 8. Implementation Priority Matrix

```
                    HIGH VALUE
                        │
     ┌──────────────────┼──────────────────┐
     │                  │                  │
     │  1. SAML/OIDC    │  4. Comments     │
     │  2. API Keys     │  7. Asset Upload │
     │  3. 2FA          │  9. Nav Admin    │
     │                  │                  │
LOW ─┼──────────────────┼──────────────────┼─ HIGH
EFF. │                  │                  │  EFFORT
     │  5. Visual Diff  │  10. Scheduling  │
     │  6. Draw.io      │                  │
     │  8. API Docs     │                  │
     │                  │                  │
     └──────────────────┼──────────────────┘
                        │
                    LOW VALUE
```

**Recommended implementation order:**
1. API Keys (low effort, immediate integration value)
2. SAML/OIDC SSO (high value for enterprise partners)
3. 2FA (security, can reuse auth work from #2)
4. Visual Diff (low effort, improves existing ContentRevision feature)
5. API Documentation (low effort, developer experience)
6. Page Comments (medium effort, collaboration enabler)
7. Draw.io Integration (low effort, content richness)
8. Asset Upload API (medium effort, unblocks non-technical users)
9. Navigation Admin Panel (medium effort, admin productivity)
10. Content Scheduling (low effort, workflow enhancement)

---

## 9. What Wiki.js Does Better and How to Match It

### 9.1 Non-Technical Author Experience
**Wiki.js:** Authors open a browser, click "New Page," write in WYSIWYG, click "Save."
**Nexus:** Authors must know Git, create MRs, write frontmatter YAML.

**How to match:** Do not add a full in-app editor (it conflicts with the Git-as-source-of-truth model). Instead:
- Build a **"Quick Edit" mode** that creates a GitLab MR via API from an in-browser textarea
- Pre-fill frontmatter templates for common page types
- Add a "Create New Page" wizard in the admin panel that generates the MR
- Keep the GitLab MR review workflow intact

### 9.2 Plug-and-Play Auth
**Wiki.js:** Admin enables Google OAuth in a dropdown, enters client ID/secret, done.
**Nexus:** Adding a new auth provider requires code changes to `auth/config.ts`.

**How to match:** Make auth providers DB-configurable:
- Store provider configs in a `AuthProvider` model
- Admin panel to enable/disable providers, enter credentials
- Dynamic provider loading in NextAuth config
- Start with OIDC (covers most enterprise needs with one implementation)

### 9.3 Asset Management
**Wiki.js:** Drag an image into the editor, it uploads and inserts the markdown.
**Nexus:** Copy image to Git repo, push, reference path in markdown.

**How to match:** Add an S3/MinIO-backed asset API:
- Upload endpoint with presigned URLs
- Image optimization pipeline (sharp)
- Admin file browser component
- Markdown image syntax auto-completed with asset URLs
- Keep text content in Git, binary assets in object storage

### 9.4 GraphQL API with Playground
**Wiki.js:** Developers explore the full API at `/graphql` with auto-complete.
**Nexus:** REST routes exist but are undocumented.

**How to match:** Do not switch to GraphQL (unnecessary complexity for this use case). Instead:
- Add OpenAPI annotations to existing REST routes
- Serve Swagger UI at `/api/docs`
- Generate TypeScript client SDK from the spec

### 9.5 Search Engine Flexibility
**Wiki.js:** Switch between PostgreSQL FTS, Elasticsearch, Algolia from admin panel.
**Nexus:** Meilisearch only, hardcoded.

**How to match:** This is not a priority gap. Meilisearch covers Nexus's needs well (typo tolerance, fast, filterable). If needed later, abstract the search client behind an interface in `src/lib/meilisearch/client.ts` to allow swapping implementations.

### 9.6 i18n / Multi-language
**Wiki.js:** 40+ UI languages, per-page variants.
**Nexus:** English only.

**How to match:** When needed:
- Use `next-intl` for UI localization (already noted in ARCHITECTURE.md)
- Content i18n via folder structure: `content/en/`, `content/de/`
- Language switcher component in header
- Auto-detect browser language

---

## 10. Conclusions

### Nexus Docs is not trying to be Wiki.js

Wiki.js is a general-purpose wiki for internal teams. Nexus Docs is a commercial documentation portal with license-gated access, Magento integration, and AI-powered features. The architectures serve different purposes.

### Where Nexus should learn from Wiki.js

1. **Lower the authoring barrier** -- a "Quick Edit" flow that creates GitLab MRs from the browser
2. **Enterprise auth** -- SAML/OIDC is table stakes for B2B platforms
3. **Security fundamentals** -- 2FA and API keys are expected
4. **Collaboration** -- page comments enable partner feedback loops
5. **Visual polish** -- diff views, diagram editors, and asset management make the platform feel complete

### Where Nexus should NOT follow Wiki.js

1. **In-app content storage** -- Git as source of truth is the right call for compliance and review workflows
2. **Bi-directional sync** -- creates conflict resolution headaches
3. **Multiple database support** -- PostgreSQL-only is the right choice
4. **Theme marketplace** -- single-tenant deployment, full code control is better
5. **GraphQL** -- REST is simpler and sufficient for this use case
