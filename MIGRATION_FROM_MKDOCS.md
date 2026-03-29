# Migrating from MkDocs to Nexus Docs

Complete guide for migrating an existing MkDocs (Material theme) site to the Nexus Docs platform.

## Overview

| Feature | MkDocs Material | Nexus Docs |
|---------|----------------|------------|
| Content format | Markdown | Markdown + MDX |
| Config | `mkdocs.yml` | Frontmatter per file |
| Navigation | `mkdocs.yml` nav tree | Auto-generated from filesystem + `nav_order` |
| Theme | Material theme | Custom Tailwind theme |
| Search | lunr.js (client) | Meilisearch (server, ACL-filtered) |
| Access control | None | 4-tier ACL + extension gating |
| Deployment | Static site | Containerized Next.js |
| Syntax highlighting | highlight.js / Pygments | Shiki |

## Step-by-Step Migration

### 1. Export Content from MkDocs

Your MkDocs content is in the `docs/` directory (or whatever `docs_dir` is set to in `mkdocs.yml`).

```bash
# Copy all markdown files preserving directory structure
cp -r docs/* /path/to/nexus-knowledge-base/content/
```

### 2. Convert mkdocs.yml Navigation to Frontmatter

MkDocs uses a centralized nav definition in `mkdocs.yml`:

```yaml
# mkdocs.yml (BEFORE)
nav:
  - Home: index.md
  - Getting Started:
    - Installation: getting-started/installation.md
    - Configuration: getting-started/configuration.md
  - Extensions:
    - GDPR Suite: extensions/gdpr-suite/index.md
```

Nexus Docs uses per-file frontmatter. Add frontmatter to each `.md` file:

```yaml
# content/getting-started/installation.md (AFTER)
---
title: "Installation"
summary: "How to install qoliber extensions"
access_tier: public
product: platform
status: published
owner: jakub
nav_order: 1
---
```

**Conversion script** — run this to generate frontmatter stubs:

```bash
#!/bin/bash
# scripts/migrate-frontmatter.sh
# Adds frontmatter stubs to all .md files that don't have them

find content/ -name "*.md" | while read file; do
  # Skip files that already have frontmatter
  if head -1 "$file" | grep -q "^---"; then
    echo "SKIP (has frontmatter): $file"
    continue
  fi

  # Extract title from first H1 heading
  TITLE=$(grep -m1 "^# " "$file" | sed 's/^# //')
  if [ -z "$TITLE" ]; then
    TITLE=$(basename "$file" .md | sed 's/-/ /g' | sed 's/\b\w/\u&/g')
  fi

  # Determine product from path
  PRODUCT="platform"
  if echo "$file" | grep -q "extensions/gdpr"; then
    PRODUCT="gdpr-suite"
  elif echo "$file" | grep -q "extensions/seo"; then
    PRODUCT="seo-rich-snippets"
  fi

  # Prepend frontmatter
  TMPFILE=$(mktemp)
  cat > "$TMPFILE" << EOF
---
title: "$TITLE"
summary: ""
access_tier: public
product: $PRODUCT
status: published
owner: jakub
nav_order: 0
---

EOF
  cat "$file" >> "$TMPFILE"
  mv "$TMPFILE" "$file"
  echo "ADDED frontmatter: $file"
done
```

### 3. Convert Admonitions

MkDocs Material uses `!!!` syntax for admonitions. Nexus Docs uses MDX `<Admonition>` components.

**MkDocs (before):**
```markdown
!!! note "Important Note"
    This is a note with some content.

!!! warning
    This is a warning.

!!! tip "Pro Tip"
    This is a tip.
```

**Nexus Docs (after):**
```mdx
<Admonition type="info" title="Important Note">
This is a note with some content.
</Admonition>

<Admonition type="warning">
This is a warning.
</Admonition>

<Admonition type="tip" title="Pro Tip">
This is a tip.
</Admonition>
```

**Type mapping:**

| MkDocs | Nexus Docs |
|--------|-----------|
| `note` | `info` |
| `abstract` | `info` |
| `info` | `info` |
| `tip` | `tip` |
| `success` | `tip` |
| `question` | `info` |
| `warning` | `warning` |
| `failure` | `danger` |
| `danger` | `danger` |
| `bug` | `danger` |
| `example` | `info` |
| `quote` | `info` |

**Conversion script:**

```bash
#!/bin/bash
# scripts/migrate-admonitions.sh
# Converts MkDocs !!! admonitions to MDX <Admonition> components

find content/ -name "*.md" | while read file; do
  # Convert !!! note "Title" blocks
  python3 -c "
import re
import sys

with open('$file', 'r') as f:
    content = f.read()

type_map = {
    'note': 'info', 'abstract': 'info', 'info': 'info',
    'tip': 'tip', 'success': 'tip', 'question': 'info',
    'warning': 'warning', 'failure': 'danger', 'danger': 'danger',
    'bug': 'danger', 'example': 'info', 'quote': 'info'
}

def convert_admonition(match):
    adm_type = match.group(1)
    title = match.group(2) or ''
    body = match.group(3)
    nexus_type = type_map.get(adm_type, 'info')
    # Remove leading 4-space indent from body
    body = re.sub(r'^    ', '', body, flags=re.MULTILINE).strip()
    if title:
        return f'<Admonition type=\"{nexus_type}\" title=\"{title}\">\n{body}\n</Admonition>'
    return f'<Admonition type=\"{nexus_type}\">\n{body}\n</Admonition>'

# Match !!! type \"optional title\"\n    indented body
pattern = r'!!! (\w+)(?: \"([^\"]+)\")?\n((?:    .+\n?)+)'
content = re.sub(pattern, convert_admonition, content)

with open('$file', 'w') as f:
    f.write(content)
" 2>/dev/null && echo "Converted: $file"
done
```

### 4. Convert Code Blocks

MkDocs Material supports code block titles and line highlighting:

**MkDocs (before):**
```markdown
``` php title="app/code/Vendor/Module/Model/Example.php" hl_lines="3 4"
<?php
namespace Vendor\Module\Model;

class Example
{
}
```
```

**Nexus Docs (after):**

Shiki handles syntax highlighting automatically. Code block metadata is preserved:

```markdown
```php title="app/code/Vendor/Module/Model/Example.php"
<?php
namespace Vendor\Module\Model;

class Example
{
}
```
```

### 5. Convert Tabs

MkDocs Material uses `=== "Tab"` syntax:

**MkDocs (before):**
```markdown
=== "Composer"

    ```bash
    composer require qoliber/gdpr-suite
    ```

=== "Manual"

    Download and extract to `app/code/Qoliber/GdprSuite`
```

**Nexus Docs (after):**

Use the MDX `<Tabs>` component (when implemented):

```mdx
<Tabs>
  <Tab label="Composer">
    ```bash
    composer require qoliber/gdpr-suite
    ```
  </Tab>
  <Tab label="Manual">
    Download and extract to `app/code/Qoliber/GdprSuite`
  </Tab>
</Tabs>
```

### 6. Handle Redirects

If your MkDocs site had pages at different paths, use the `redirect_from` frontmatter field:

```yaml
---
title: "GDPR Configuration"
redirect_from:
  - /extensions/gdpr-suite/configuration.html
  - /gdpr/config/
---
```

Nexus Docs will automatically generate 301 redirects for these paths.

### 7. Convert `mkdocs.yml` Metadata

**MkDocs `extra` config → `.env`:**

| MkDocs `mkdocs.yml` | Nexus Docs `.env` |
|---------------------|-------------------|
| `site_name` | `NEXT_PUBLIC_SITE_NAME` |
| `site_url` | `NEXT_PUBLIC_SITE_URL` |
| `repo_url` | `GITLAB_URL` + `GITLAB_CONTENT_PROJECT_ID` |
| `extra.analytics.provider` | (Use Vercel Analytics or custom) |

### 8. Convert Plugins

| MkDocs Plugin | Nexus Docs Equivalent |
|---------------|----------------------|
| `search` | Meilisearch (built-in, ACL-filtered) |
| `tags` | `tags` frontmatter field |
| `git-revision-date` | `lastModified` from filesystem |
| `minify` | Next.js production build (automatic) |
| `redirects` | `redirect_from` frontmatter field |
| `social` | OG image generation (via Next.js) |
| `privacy` | Not needed (self-hosted) |

### 9. Validate Migration

After migrating content, validate:

```bash
# 1. Check all frontmatter is valid
npx tsx scripts/validate-content.ts

# 2. Build to check for errors
npm run build

# 3. Run tests
npm test

# 4. Index content for search
npx tsx scripts/reindex.ts

# 5. Check sitemap
curl http://localhost:3000/sitemap.xml
```

### 10. URL Mapping

Ensure old MkDocs URLs are handled:

| MkDocs URL Pattern | Nexus Docs URL |
|-------------------|----------------|
| `/extensions/gdpr-suite/` | `/docs/extensions/gdpr-suite` |
| `/extensions/gdpr-suite/configuration/` | `/docs/extensions/gdpr-suite/configuration` |
| `/getting-started/` | `/docs/getting-started` |

Note: MkDocs adds trailing slashes; Nexus Docs does not. Configure redirects in `next.config.ts` if needed:

```typescript
// next.config.ts
async redirects() {
  return [
    // Redirect old MkDocs paths
    {
      source: '/extensions/:path*',
      destination: '/docs/extensions/:path*',
      permanent: true,
    },
    // Redirect .html extensions
    {
      source: '/docs/:path*.html',
      destination: '/docs/:path*',
      permanent: true,
    },
  ];
}
```

## Migration Checklist

- [ ] Copy all markdown files to `content/`
- [ ] Add frontmatter to every file (use migration script)
- [ ] Convert admonitions from `!!!` to `<Admonition>`
- [ ] Convert tabs from `===` to `<Tabs>`
- [ ] Update internal links (remove `.md` extensions, add `/docs/` prefix)
- [ ] Add `redirect_from` for changed URLs
- [ ] Set `nav_order` for correct sidebar ordering
- [ ] Set `access_tier` for gated content
- [ ] Set `product` for each extension doc
- [ ] Configure `.env` with site metadata
- [ ] Run `npm run build` to verify
- [ ] Run `npm test` to validate
- [ ] Index content in Meilisearch
- [ ] Test all redirects from old URLs
- [ ] Verify sitemap.xml includes all public pages
- [ ] Check JSON-LD structured data with Google Rich Results Test
- [ ] Verify OG tags with Facebook Sharing Debugger
- [ ] Submit new sitemap to Google Search Console

## Automation Scripts

All migration scripts are in the `scripts/` directory:

| Script | Purpose |
|--------|---------|
| `scripts/migrate-frontmatter.sh` | Add frontmatter stubs to bare markdown files |
| `scripts/migrate-admonitions.sh` | Convert `!!!` admonitions to `<Admonition>` MDX |
| `scripts/validate-content.ts` | Validate all frontmatter against schema |
| `scripts/reindex.ts` | Rebuild Meilisearch index |
| `scripts/content-sync.sh` | Sync content from GitLab |
