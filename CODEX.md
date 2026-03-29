# CODEX Review Notes

## Scope Reviewed

Reviewed the current planning and operational files in this directory:

- `.env.example`
- `.gitignore`
- `ARCHITECTURE.md`
- `CONTENT_MODEL.md`
- `docker-compose.yml`
- `Dockerfile`
- `Makefile`
- `README.md`

This review is based on the files present in the repository. It does not include runtime verification of `make up` or any application code, because the repo is still primarily architecture/docs at this stage.

---

## Current Assessment

The project has improved substantially from an early concept doc into a much more implementation-ready architecture.

Strong decisions now in place:

- GitLab is defined as the content source of truth.
- A worker model exists for heavy/background jobs.
- Redis is included for BullMQ.
- Search ACL is designed around `access_tier` and `extensions[]`.
- ACL enforcement is described across page render, search, nav, sitemap, AI context, and webhooks.
- Webhooks are explicitly enqueue-only on the request path.
- AI review and AI chat are separated clearly.
- Bootstrap and CI/CD are now documented.
- `CONTENT_MODEL.md` adds a much better frontmatter contract.

The remaining issues are no longer major architecture gaps. They are mostly contract, bootstrap, and implementation-readiness issues.

---

## Confirmed Improvements

### 1. Content Source of Truth Is Clear

`ARCHITECTURE.md` now clearly states:

- content lives in a dedicated GitLab repo
- worker syncs it into a shared `content-cache` volume
- app reads from that cache

This removes the earlier ambiguity around whether docs lived in the app repo or were synced from elsewhere.

### 2. Background Work Is No Longer in Request Handlers

The worker model is now the right direction:

- `content-sync`
- `reindex`
- `ai-review`
- `webhook-deliver`
- `acl-sync`

This is materially better than trying to do sync/reindex/retries directly inside API routes.

### 3. Search ACL Design Is Much Better

The updated search model correctly recognizes that tier-only filtering is insufficient.

The design now accounts for:

- `access_tier`
- `extensions[]`
- partner/admin behavior
- isolation across search, nav, sitemap, AI context, and webhook payloads

That closes the earlier leakage risk at the architecture level.

### 4. Content Model Is Stronger

`CONTENT_MODEL.md` now introduces useful metadata beyond title/tags:

- `summary`
- `product`
- `status`
- `owner`
- `last_verified_at`
- `review_interval_days`
- `redirect_from`
- `related`
- nav metadata

This is the right direction for a serious knowledge base with lifecycle and ownership.

---

## Remaining Findings

## High Priority

### Bootstrap Is Still Not Reliable Enough

`Makefile` is helpful, but it is still not a dependable bootstrap contract.

Current issues:

- uses fixed `sleep 5` instead of actual readiness checks
- suppresses failures with `|| true` for seed, sync, and reindex
- can print success even when critical setup failed
- does not fully match the documented bootstrap order in `ARCHITECTURE.md`

Why this matters:

- early setup failures will be hidden
- onboarding will be inconsistent
- debugging environment issues will take longer than necessary

Required fix before coding seriously:

- fail fast on bootstrap
- wait for actual service readiness
- make setup idempotent
- ensure the documented bootstrap flow matches the real command behavior exactly

---

## Medium Priority

### Docs Promise Files That Do Not Exist Yet

The architecture now references several files or artifacts that are not currently present in this directory.

Referenced but not present during review:

- `docker-compose.prod.yml`
- `scripts/bootstrap.sh`
- `scripts/content-sync.sh`
- `products.yml`

Potentially also expected soon:

- real `scripts/`
- real `worker/`
- real `src/`
- real `prisma/`

Why this matters:

- the architecture reads like implemented reality
- future contributors will assume these files already exist
- the repo contract and the docs are still ahead of each other

Recommendation:

- either add the files now as stubs
- or mark them clearly as planned/not-yet-created in the docs

### Public Content Freshness Model Needs One Explicit Strategy

The current architecture says:

- content updates arrive via GitLab webhook and worker sync
- app reads from the shared cache
- public pages are also pre-built/static for SEO

That combination still needs one explicit rule for how public pages become fresh after content changes.

Without that, one of these will happen:

- public HTML becomes stale after GitLab sync
- public pages stop being truly static
- deploy/publish logic grows ad hoc later

This needs a direct decision before implementation:

- SSR for all public docs
- ISR with timed or on-demand revalidation
- static export plus explicit publish/rebuild pipeline

### Deprecation State Is Duplicated

`CONTENT_MODEL.md` currently has both:

- `status: deprecated`
- `deprecated: true`

That creates unnecessary state conflicts.

Examples of bad states:

- `status: published` with `deprecated: true`
- `status: deprecated` with `deprecated: false`

Recommendation:

- keep `status` as the single source of truth
- derive banner/indexing behavior from `status`

### Client Access Semantics Need One Final Rule

The current content model allows:

- `access_tier: client`
- `extensions: []`

and interprets that as visible to any authenticated client.

This may be correct, but it should be an intentional business rule, not an accidental fallback.

Decision needed:

- either allow shared client-only docs for all clients
- or require all client docs to be tied to at least one extension

### README Is Still Missing

`README.md` is still effectively empty.

That means the first file most contributors open does not explain:

- what this project is
- how local setup works
- where content lives
- how app repo and content repo relate
- which commands matter first

This should be fixed before coding begins in earnest.

---

## Low Priority

### Environment Contract Looks Better, but Still Needs Real Validation

The move to a single `.env` source is correct.

What still needs validation once coding starts:

- every variable in `.env.example` is actually consumed by code/compose
- no runtime-only variables are missing
- dev/prod differences are explicit

### CI/CD Section Is Good, but Still Conceptual

The CI/CD design is now sensible:

- content repo checks in GitLab CI
- app checks in GitHub Actions

But it should be treated as planned contract until the actual pipeline files exist.

---

## Recommended Pre-Coding Checklist

These are the next things to lock down before implementation starts.

### Must Do First

1. Create a real `README.md` with:
   - project purpose
   - repo boundaries
   - local setup
   - required env vars
   - `make` commands
   - content repo relationship

2. Make bootstrap truthful and fail-fast:
   - no silent `|| true`
   - no fixed `sleep`
   - real readiness checks
   - deterministic order

3. Decide the public-page freshness model:
   - SSR vs ISR vs rebuild-on-publish

4. Remove the duplicate deprecation state from `CONTENT_MODEL.md`

5. Create or stub all files referenced by architecture docs:
   - `docker-compose.prod.yml`
   - `scripts/bootstrap.sh`
   - `scripts/content-sync.sh`
   - `products.yml`

### Strongly Recommended Next

6. Define the repo boundary explicitly:
   - app repo responsibilities
   - content repo responsibilities
   - sync direction
   - who owns product metadata

7. Define the canonical ACL evaluation rules in one place:
   - anonymous
   - client without extensions
   - client with owned extensions
   - partner
   - admin

8. Define publish/update behavior:
   - webhook flow
   - cache update behavior
   - reindex trigger
   - public page revalidation/rebuild

9. Define minimum operational observability:
   - worker job logs
   - webhook delivery logs
   - sync failures
   - reindex failures
   - stale-content reports

10. Decide whether `products.yml` lives in:
   - app repo
   - content repo
   - database

---

## Suggested Implementation Order

When coding starts, the safest order is:

1. repo contract and README
2. bootstrap and compose reliability
3. content model validation
4. content sync worker
5. Meilisearch indexing and ACL filter builder
6. page rendering from cache
7. auth and entitlement model
8. nav/sitemap enforcement
9. AI context enforcement
10. outgoing webhooks and retries

This order reduces the risk of building UI on top of unstable content and ACL assumptions.

---

## Final Recommendation

The project is ready to move from architecture into implementation planning.

The biggest architectural problems have already been corrected. What remains is to make the repository truthful:

- docs must match actual files
- bootstrap must be reliable
- content freshness behavior must be explicit
- metadata rules must have one source of truth

If those are handled first, coding can start on a much cleaner foundation.
