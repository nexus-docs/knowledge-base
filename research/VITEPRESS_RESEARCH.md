# VitePress Research Report

Research into VitePress documentation framework features, best practices, and gaps relative to the Nexus Docs project.

## 1. VitePress Overview

VitePress is a Vue-powered static site generator built on top of Vite. It takes Markdown source content, applies a theme, and produces a pre-rendered static HTML site that hydrates into a Vue SPA on the client. Key architectural choices:

- **Vite-based build**: Hot module replacement in dev, optimized Rollup builds for production
- **Vue 3 SSR + SPA hybrid**: Static HTML for first paint, then client-side navigation with Vue Router
- **Markdown-it core**: All markdown rendering goes through markdown-it with a rich plugin ecosystem
- **Island architecture**: Only interactive parts hydrate, reducing JS payload
- **Content-driven**: Every markdown file becomes a route, with frontmatter as structured data

### Notable Sites Built with VitePress

1. **Vue.js official docs** (vuejs.org) -- clean, fast, excellent search and i18n
2. **Vite docs** (vitejs.dev) -- dogfooding with superb DX showcase
3. **Pinia docs** (pinia.vuejs.org) -- multi-sidebar, i18n, API reference
4. **VueUse docs** (vueuse.org) -- component playground integration
5. **Mermaid docs** (mermaid.js.org) -- live diagram rendering in markdown
6. **Rollup docs** (rollupjs.org) -- code-heavy with excellent syntax highlighting
7. **Vitest docs** (vitest.dev) -- API reference tables, code examples
8. **UnoCSS docs** (unocss.dev) -- interactive playgrounds
9. **Slidev docs** (sli.dev) -- creative theme customization
10. **TresJS docs** (docs.tresjs.org) -- 3D component demos embedded in docs

What makes them great: fast page loads (< 100ms navigation), excellent search, clean typography, responsive sidebars, dark mode, and embedded interactive examples.

---

## 2. Feature-by-Feature Comparison

### Features VitePress Has

| Feature | VitePress | Nexus Docs | Gap? |
|---------|-----------|------------|------|
| Custom containers (:::tip, :::warning, etc.) | Native markdown syntax | `<Admonition>` component in MDX | Partial -- requires JSX, not markdown shorthand |
| Code groups with tabs | `:::code-group` markdown syntax | `<CodeTabs>` component | Partial -- requires JSX, not markdown shorthand |
| Line highlighting in code blocks | `\`\`\`js{1,3-5}` native syntax | Shiki transformer with `{1,3-5}` meta | Present |
| Code focus (dim non-focused lines) | `// [!code focus]` comment markers | Missing | YES |
| Code diff highlighting | `// [!code --]` / `// [!code ++]` | Missing | YES |
| Code error/warning annotations | `// [!code warning]` / `// [!code error]` | Missing | YES |
| Import code snippets from files | `<<< @/snippets/file.ts` syntax | Missing | YES |
| Vue/React component in markdown | Native Vue components | MDX components (React) | Present (different framework) |
| Markdown-it plugin ecosystem | Direct markdown-it plugin support | remark/rehype plugin chain | Present (different ecosystem) |
| Custom containers with markdown shorthand | `:::info\n content \n:::` | Requires `<Admonition type="info">` | YES -- friction difference |
| Theme customization via CSS vars | Comprehensive CSS variable system | CSS variables present | Present |
| Last updated from git | `lastUpdated: true` reads git log | File stat `mtime` only | Partial -- not git-based |
| Multiple sidebars | Route-based sidebar configs | Scoped nav via `getScopedNav` | Present (different approach) |
| Algolia DocSearch integration | Built-in config option | Meilisearch-based search | Present (different engine) |
| Local search (MiniSearch) | Built-in client-side search fallback | Server-side Meilisearch only | YES -- no offline/local fallback |
| Edit link (Edit on GitHub/GitLab) | `editLink` config option | Missing | YES |
| i18n / Localization | Directory-based locale routing | Missing | YES |
| Versioned docs | Community pattern (branches/folders) | `version` frontmatter field, no routing | YES |
| Carbon ads integration | Built-in | Missing | N/A |
| Team page component | Built-in `<VPTeamMembers>` | Missing | Minor |
| Badge component | Built-in `<Badge>` | Missing | Minor |
| Prev/Next navigation | Built-in | `PrevNextNav` component | Present |
| Table of contents (right sidebar) | Built-in with scroll spy | `TableOfContents` with IntersectionObserver | Present |
| Breadcrumbs | Via theme | Present | Present |
| Copy code button | Built-in | `CopyButton` component | Present |
| Code block title/filename | Built-in `\`\`\`js [filename.js]` | `title="filename.ts"` meta | Present |
| Line numbers in code blocks | `\`\`\`ts:line-numbers` | `showLineNumbers` meta | Present |
| Markdown anchor links | Auto-generated | rehype-slug + rehype-autolink-headings | Present |
| Dark mode | Built-in toggle | Present via CSS vars | Present |
| Mobile sidebar | Built-in responsive | `MobileSidebar` component | Present |
| OG image generation | Not built-in | `/api/og` route | Nexus advantage |
| Access control / ACL | Not built-in | Full ACL system | Nexus advantage |
| Full-text search with facets | Via Algolia (external) | Meilisearch with ACL filters | Nexus advantage |
| Webhook-driven content sync | Not built-in | GitLab webhook + BullMQ | Nexus advantage |
| User management / admin panel | Not built-in | Full admin UI | Nexus advantage |

---

## 3. Top 10 Features to Implement

Prioritized by user impact and implementation effort.

### Feature 1: Markdown-Native Custom Containers (:::tip syntax)

**Why**: VitePress lets authors write `:::tip` directly in markdown without JSX. This dramatically lowers the authoring barrier -- authors don't need to know React.

**Current state**: Nexus requires `<Admonition type="tip">content</Admonition>` in MDX.

**Implementation**:

Create a remark plugin that transforms `:::type` blocks into `<Admonition>` components before MDX compilation.

```typescript
// src/lib/markdown/remark-containers.ts
import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Paragraph, Text } from 'mdast';

const CONTAINER_RE = /^:::\s*(note|tip|info|warning|danger|success)(?:\s+(.+))?$/;

export const remarkContainers: Plugin<[], Root> = () => {
  return (tree) => {
    const children = tree.children;
    const result: typeof children = [];
    let i = 0;

    while (i < children.length) {
      const node = children[i];

      // Look for opening ::: directive
      if (node.type === 'paragraph') {
        const text = getPlainText(node);
        const match = text.match(CONTAINER_RE);

        if (match) {
          const type = match[1];
          const title = match[2] || undefined;
          const containerChildren: typeof children = [];

          i++;
          // Collect children until closing :::
          while (i < children.length) {
            const child = children[i];
            if (child.type === 'paragraph' && getPlainText(child).trim() === ':::') {
              break;
            }
            containerChildren.push(child);
            i++;
          }

          // Create MDX JSX element for <Admonition>
          result.push({
            type: 'mdxJsxFlowElement' as any,
            name: 'Admonition',
            attributes: [
              { type: 'mdxJsxAttribute', name: 'type', value: type },
              ...(title ? [{ type: 'mdxJsxAttribute' as const, name: 'title', value: title }] : []),
            ],
            children: containerChildren,
          });

          i++; // skip closing :::
          continue;
        }
      }

      result.push(node);
      i++;
    }

    tree.children = result;
  };
};

function getPlainText(node: Paragraph): string {
  return node.children
    .filter((c): c is Text => c.type === 'text')
    .map((c) => c.value)
    .join('');
}
```

Register in `mdx-renderer.tsx`:

```typescript
import { remarkContainers } from "@/lib/markdown/remark-containers";

// In mdxOptions:
remarkPlugins: [remarkGfm, remarkContainers],
```

---

### Feature 2: Code Focus / Dim Lines

**Why**: VitePress allows `// [!code focus]` to highlight specific lines while dimming others. Essential for tutorials where you want to draw attention to the important parts of a code block.

**Current state**: Nexus has line highlighting but no focus/dim capability.

**Implementation**:

Extend the Shiki transformer in `code-block.tsx`:

```typescript
// Add to the transformers array in code-block.tsx
{
  line(node, line) {
    // Existing highlight logic
    if (meta.highlightLines.has(line)) {
      this.addClassToHast(node, "highlighted-line");
    }
  },
  preprocess(code) {
    // Detect // [!code focus] markers
    const lines = code.split('\n');
    const hasFocus = lines.some(l => l.includes('// [!code focus]'));

    if (hasFocus) {
      this.__focusLines = new Set<number>();
      const cleaned = lines.map((line, i) => {
        if (line.includes('// [!code focus]')) {
          this.__focusLines.add(i + 1);
          return line.replace(/\s*\/\/\s*\[!code focus\]/, '');
        }
        return line;
      });
      return cleaned.join('\n');
    }
    return code;
  },
  line(node, line) {
    if (this.__focusLines && this.__focusLines.size > 0) {
      if (this.__focusLines.has(line)) {
        this.addClassToHast(node, "has-focus");
      } else {
        this.addClassToHast(node, "not-focused");
      }
    }
  },
},
```

Add CSS:

```css
/* In your global styles */
.not-focused {
  opacity: 0.4;
  filter: blur(0.5px);
  transition: opacity 0.3s, filter 0.3s;
}
.has-focus {
  background: var(--color-focus-bg, rgba(59, 130, 246, 0.08));
  border-left: 2px solid var(--color-focus-border, #3b82f6);
}
/* On hover, reveal all lines */
pre:hover .not-focused {
  opacity: 1;
  filter: none;
}
```

---

### Feature 3: Code Diff Highlighting (++/--)

**Why**: VitePress `// [!code ++]` and `// [!code --]` markers show added/removed lines with green/red styling. Critical for migration guides, upgrade docs, and changelogs.

**Current state**: Nexus supports `diff` language for syntax highlighting but not inline diff markers within other languages.

**Implementation**:

```typescript
// src/lib/markdown/shiki-diff-transformer.ts
import type { ShikiTransformer } from 'shiki';

export function diffTransformer(): ShikiTransformer {
  return {
    name: 'diff-notation',
    preprocess(code) {
      const lines = code.split('\n');
      const diffLines = new Map<number, 'add' | 'remove'>();

      const cleaned = lines.map((line, i) => {
        if (line.includes('// [!code ++]')) {
          diffLines.set(i + 1, 'add');
          return line.replace(/\s*\/\/\s*\[!code \+\+\]/, '');
        }
        if (line.includes('// [!code --]')) {
          diffLines.set(i + 1, 'remove');
          return line.replace(/\s*\/\/\s*\[!code --\]/, '');
        }
        return line;
      });

      this.__diffLines = diffLines;
      return cleaned.join('\n');
    },
    line(node, line) {
      const diff = this.__diffLines?.get(line);
      if (diff === 'add') {
        this.addClassToHast(node, 'diff-add');
      } else if (diff === 'remove') {
        this.addClassToHast(node, 'diff-remove');
      }
    },
  };
}
```

CSS additions:

```css
.diff-add {
  background: rgba(34, 197, 94, 0.12);
  border-left: 3px solid #22c55e;
}
.diff-add::before {
  content: "+";
  position: absolute;
  left: 4px;
  color: #22c55e;
}
.diff-remove {
  background: rgba(239, 68, 68, 0.12);
  border-left: 3px solid #ef4444;
  text-decoration: line-through;
  opacity: 0.7;
}
.diff-remove::before {
  content: "-";
  position: absolute;
  left: 4px;
  color: #ef4444;
}
```

---

### Feature 4: Import Code Snippets from Files

**Why**: VitePress `<<< @/snippets/file.ts` imports real files into code blocks, ensuring docs stay in sync with actual code. Prevents code rot.

**Current state**: All code must be pasted inline in markdown files.

**Implementation**:

Create a remark plugin that resolves file imports:

```typescript
// src/lib/markdown/remark-code-import.ts
import { visit } from 'unist-util-visit';
import fs from 'fs';
import path from 'path';
import type { Plugin } from 'unified';
import type { Root, Code, Paragraph, Text } from 'mdast';

const IMPORT_RE = /^<<<\s+@\/([\w\-\/.]+)(?:\{([\d,\-]+)\})?(?:\s+\[(.+)\])?$/;

export const remarkCodeImport: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'paragraph', (node: Paragraph, index, parent) => {
      if (node.children.length !== 1 || node.children[0].type !== 'text') return;

      const text = (node.children[0] as Text).value.trim();
      const match = text.match(IMPORT_RE);
      if (!match) return;

      const [, filePath, lineRange, title] = match;
      const contentDir = process.env.CONTENT_DIR || path.join(process.cwd(), 'content');
      const fullPath = path.resolve(contentDir, '..', filePath);

      // Security: ensure path stays within project
      if (!fullPath.startsWith(path.resolve(contentDir, '..'))) return;

      try {
        let content = fs.readFileSync(fullPath, 'utf-8');

        // Extract line range if specified
        if (lineRange) {
          const lines = content.split('\n');
          const ranges = lineRange.split(',');
          const selectedLines: string[] = [];

          for (const range of ranges) {
            if (range.includes('-')) {
              const [start, end] = range.split('-').map(Number);
              selectedLines.push(...lines.slice(start - 1, end));
            } else {
              selectedLines.push(lines[Number(range) - 1] || '');
            }
          }
          content = selectedLines.join('\n');
        }

        // Detect language from extension
        const ext = path.extname(filePath).slice(1);
        const langMap: Record<string, string> = {
          ts: 'typescript', js: 'javascript', tsx: 'tsx', jsx: 'jsx',
          py: 'python', rb: 'ruby', go: 'go', rs: 'rust',
          yml: 'yaml', yaml: 'yaml', json: 'json', md: 'markdown',
          sh: 'bash', bash: 'bash', css: 'css', html: 'html',
        };
        const lang = langMap[ext] || ext;

        const codeNode: Code = {
          type: 'code',
          lang,
          meta: title ? `title="${title}"` : `title="${path.basename(filePath)}"`,
          value: content.trimEnd(),
        };

        parent!.children[index!] = codeNode as any;
      } catch {
        // Leave the node as-is if file not found
      }
    });
  };
};
```

Usage in markdown:

```markdown
<<< @/snippets/config.ts
<<< @/snippets/config.ts{1-10} [Configuration Example]
```

---

### Feature 5: Edit Link (Edit on GitLab/GitHub)

**Why**: Every VitePress page has an "Edit this page on GitHub" link. This encourages community contributions and makes it easy for internal authors to quickly fix issues.

**Current state**: Missing entirely.

**Implementation**:

```typescript
// src/components/docs/edit-link.tsx
import { ExternalLink } from "lucide-react";

interface EditLinkProps {
  slug: string;
  /** e.g. "https://gitlab.com/org/repo/-/edit/main/content" */
  baseUrl?: string;
}

export function EditLink({ slug, baseUrl }: EditLinkProps) {
  const editBase =
    baseUrl ||
    process.env.NEXT_PUBLIC_EDIT_BASE_URL ||
    "https://gitlab.com/qoliber/docs/-/edit/main/content";

  // Try .md first, then /index.md
  const editUrl = `${editBase}/${slug}.md`;

  return (
    <a
      href={editUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
    >
      <ExternalLink className="h-3.5 w-3.5" />
      Edit this page
    </a>
  );
}
```

Add to the doc page footer in `src/app/(public)/docs/[...slug]/page.tsx`:

```tsx
{/* Footer */}
<div className="mt-12 border-t border-[var(--color-border)] pt-4 flex items-center justify-between text-sm text-[var(--color-text-muted)]">
  <span>
    Last updated: {new Date(doc.lastModified).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    })}
  </span>
  <EditLink slug={currentSlug} />
</div>
```

---

### Feature 6: Git-Based Last Updated Timestamps

**Why**: VitePress reads `git log` for the actual last commit date. Nexus uses file system `mtime`, which changes on every deployment or content sync, losing the real authoring history.

**Current state**: `loader.ts` uses `stat.mtime` which reflects last file modification, not last meaningful change.

**Implementation**:

```typescript
// src/lib/content/git-timestamp.ts
import { execSync } from 'child_process';
import path from 'path';

const timestampCache = new Map<string, string>();

export function getGitTimestamp(filePath: string): string | null {
  if (timestampCache.has(filePath)) {
    return timestampCache.get(filePath)!;
  }

  try {
    const dir = path.dirname(filePath);
    const result = execSync(
      `git log -1 --format=%cI "${path.basename(filePath)}"`,
      { cwd: dir, encoding: 'utf-8', timeout: 5000 }
    ).trim();

    if (result) {
      timestampCache.set(filePath, result);
      return result;
    }
  } catch {
    // Git not available or file not tracked
  }
  return null;
}

export function clearTimestampCache(): void {
  timestampCache.clear();
}
```

Update `loader.ts` `getDocBySlug`:

```typescript
import { getGitTimestamp } from './git-timestamp';

// In getDocBySlug, replace:
//   const stat = await fs.stat(filePath);
//   lastModified: stat.mtime.toISOString(),
// With:
const gitDate = getGitTimestamp(filePath);
const stat = await fs.stat(filePath);
const lastModified = gitDate || stat.mtime.toISOString();
// ...
return { ...frontmatter, slug, content, lastModified };
```

---

### Feature 7: Client-Side Local Search Fallback

**Why**: VitePress has a built-in local search powered by MiniSearch that works entirely client-side. This means search works even when Meilisearch is down, during development, or in offline/air-gapped deployments.

**Current state**: Search only works through Meilisearch. If it's unavailable, users get "Search unavailable."

**Implementation**:

```typescript
// src/lib/search/local-search-index.ts
// Build-time: generate a search index JSON during next build
import { getAllDocs } from '@/lib/content';
import { writeFileSync } from 'fs';
import path from 'path';

export async function generateSearchIndex() {
  const docs = await getAllDocs();
  const publicDocs = docs
    .filter(d => d.status === 'published' && d.access_tier === 'public')
    .map(d => ({
      id: d.slug,
      title: d.title,
      summary: d.summary,
      product: d.product,
      tags: d.tags,
    }));

  writeFileSync(
    path.join(process.cwd(), 'public', 'search-index.json'),
    JSON.stringify(publicDocs)
  );
}
```

```typescript
// src/hooks/use-local-search.ts
"use client";
import { useState, useEffect, useMemo } from 'react';
import MiniSearch from 'minisearch';

interface SearchDoc {
  id: string;
  title: string;
  summary: string;
  product: string;
  tags: string[];
}

export function useLocalSearch() {
  const [docs, setDocs] = useState<SearchDoc[]>([]);

  useEffect(() => {
    fetch('/search-index.json')
      .then(r => r.json())
      .then(setDocs)
      .catch(() => {}); // Graceful failure
  }, []);

  const miniSearch = useMemo(() => {
    const ms = new MiniSearch<SearchDoc>({
      fields: ['title', 'summary', 'tags'],
      storeFields: ['title', 'summary', 'product'],
      searchOptions: {
        boost: { title: 3, tags: 2 },
        fuzzy: 0.2,
        prefix: true,
      },
    });
    ms.addAll(docs);
    return ms;
  }, [docs]);

  return {
    search: (query: string) => miniSearch.search(query),
  };
}
```

Add `minisearch` as a dependency:

```bash
npm install minisearch
```

Update `search-dialog.tsx` to fall back to local search when Meilisearch returns an error.

---

### Feature 8: i18n / Localization Support

**Why**: VitePress has a directory-based i18n system where `/guide/getting-started` and `/fr/guide/getting-started` serve English and French respectively. For Nexus serving international clients, this is essential.

**Current state**: No i18n support at all. Single-locale only.

**Implementation approach**:

```
content/
  en/
    getting-started.md
    api/
      authentication.md
  fr/
    getting-started.md
    api/
      authentication.md
  de/
    getting-started.md
```

```typescript
// src/lib/i18n/config.ts
export interface LocaleConfig {
  code: string;        // 'en', 'fr', 'de'
  name: string;        // 'English', 'Francais'
  dir: 'ltr' | 'rtl';
  flag?: string;       // emoji flag for selector
}

export const locales: LocaleConfig[] = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'fr', name: 'Francais', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', dir: 'ltr' },
];

export const defaultLocale = 'en';

export function getLocaleFromSlug(slug: string): { locale: string; restSlug: string } {
  const parts = slug.split('/');
  const locale = locales.find(l => l.code === parts[0]);
  if (locale) {
    return { locale: locale.code, restSlug: parts.slice(1).join('/') };
  }
  return { locale: defaultLocale, restSlug: slug };
}
```

```typescript
// src/components/i18n/locale-switcher.tsx
"use client";
import { usePathname, useRouter } from 'next/navigation';
import { locales, getLocaleFromSlug } from '@/lib/i18n/config';

export function LocaleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();

  const currentSlug = pathname.replace(/^\/docs\/?/, '');
  const { locale: currentLocale, restSlug } = getLocaleFromSlug(currentSlug);

  return (
    <select
      value={currentLocale}
      onChange={(e) => {
        const newLocale = e.target.value;
        const newPath = newLocale === 'en'
          ? `/docs/${restSlug}`
          : `/docs/${newLocale}/${restSlug}`;
        router.push(newPath);
      }}
      className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs"
    >
      {locales.map(l => (
        <option key={l.code} value={l.code}>{l.name}</option>
      ))}
    </select>
  );
}
```

---

### Feature 9: Versioned Documentation

**Why**: VitePress community uses branch-based or folder-based versioning to serve multiple versions of docs simultaneously. For Nexus, where `version` is already a frontmatter field, adding version-aware routing unlocks support for multiple product releases.

**Current state**: `version` field in frontmatter (defaults to `"*"`) but no routing, no version selector UI, and no version-aware navigation.

**Implementation**:

```typescript
// src/lib/content/versioning.ts
import type { DocMeta } from './types';

export interface VersionInfo {
  version: string;
  label: string;      // "v3.x (latest)"
  isLatest: boolean;
}

/**
 * Given all docs for a product, extract the available versions.
 */
export function getProductVersions(docs: DocMeta[], product: string): VersionInfo[] {
  const versions = new Set<string>();
  for (const doc of docs) {
    if (doc.product === product && doc.version !== '*') {
      versions.add(doc.version);
    }
  }

  const sorted = [...versions].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

  return sorted.map((v, i) => ({
    version: v,
    label: i === 0 ? `${v} (latest)` : v,
    isLatest: i === 0,
  }));
}

/**
 * Filter docs to a specific version (or latest).
 * Docs with version="*" match all versions (shared content).
 */
export function filterDocsByVersion(docs: DocMeta[], version: string): DocMeta[] {
  return docs.filter(d => d.version === '*' || d.version === version);
}
```

```typescript
// src/components/docs/version-selector.tsx
"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import type { VersionInfo } from '@/lib/content/versioning';

interface VersionSelectorProps {
  versions: VersionInfo[];
  current: string;
}

export function VersionSelector({ versions, current }: VersionSelectorProps) {
  const router = useRouter();

  if (versions.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <label className="text-[var(--color-text-muted)]">Version:</label>
      <select
        value={current}
        onChange={(e) => {
          const params = new URLSearchParams(window.location.search);
          params.set('v', e.target.value);
          router.push(`?${params.toString()}`);
        }}
        className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs font-medium"
      >
        {versions.map(v => (
          <option key={v.version} value={v.version}>{v.label}</option>
        ))}
      </select>
    </div>
  );
}
```

---

### Feature 10: Code Error/Warning Annotations

**Why**: VitePress `// [!code warning]` and `// [!code error]` markers highlight lines with amber/red backgrounds to flag problematic code. Perfect for security docs, anti-pattern examples, and troubleshooting guides.

**Current state**: No equivalent.

**Implementation**:

```typescript
// Add to the Shiki transformer chain in code-block.tsx
// (Can be combined with the diff transformer)

function annotationTransformer(): ShikiTransformer {
  return {
    name: 'code-annotations',
    preprocess(code) {
      const lines = code.split('\n');
      const annotations = new Map<number, 'warning' | 'error'>();

      const cleaned = lines.map((line, i) => {
        if (line.includes('// [!code warning]')) {
          annotations.set(i + 1, 'warning');
          return line.replace(/\s*\/\/\s*\[!code warning\]/, '');
        }
        if (line.includes('// [!code error]')) {
          annotations.set(i + 1, 'error');
          return line.replace(/\s*\/\/\s*\[!code error\]/, '');
        }
        return line;
      });

      this.__annotations = annotations;
      return cleaned.join('\n');
    },
    line(node, line) {
      const annotation = this.__annotations?.get(line);
      if (annotation === 'warning') {
        this.addClassToHast(node, 'code-warning');
      } else if (annotation === 'error') {
        this.addClassToHast(node, 'code-error');
      }
    },
  };
}
```

CSS:

```css
.code-warning {
  background: rgba(245, 158, 11, 0.12);
  border-left: 3px solid #f59e0b;
}
.code-error {
  background: rgba(239, 68, 68, 0.12);
  border-left: 3px solid #ef4444;
}
```

---

## 4. VitePress Performance Analysis

VitePress achieves extremely fast page loads through:

1. **Static HTML pre-rendering**: Every page is SSR'd at build time, so the first paint is pure HTML/CSS
2. **Route-based code splitting**: Only the JS needed for the current page is loaded
3. **Link prefetching**: When links enter the viewport, their JS chunks are prefetched
4. **SPA navigation after hydration**: Subsequent page changes are client-side only (no full page reload)
5. **Vite's optimized builds**: Tree-shaking, minification, and chunk optimization via Rollup
6. **Minimal runtime**: Default theme JS is ~30KB gzipped

**Nexus comparison**: Next.js with App Router provides similar benefits (RSC, streaming SSR, code splitting, prefetching). The main difference is that VitePress generates a fully static site, while Nexus uses dynamic rendering for ACL. Nexus could adopt `generateStaticParams` more aggressively for public pages and use ISR for private ones.

### Recommended performance improvements for Nexus:

- Add `<link rel="prefetch">` hints for adjacent pages in the sidebar
- Ensure the Shiki code highlighting runs at build time (already server-side via RSC)
- Consider static export for public docs and edge middleware for ACL checks
- Add stale-while-revalidate headers for content API responses

---

## 5. VitePress Search Details

### Algolia DocSearch
- Zero-config integration: just add `appId`, `apiKey`, and `indexName`
- Algolia crawls the site and builds the index automatically
- Supports faceted search, typo tolerance, and relevance tuning
- Free for open-source projects via DocSearch program

### Local Search (MiniSearch)
- Built-in since VitePress 1.0
- Indexes all page content at build time into a JSON file
- Runs entirely client-side using MiniSearch library
- Supports fuzzy matching, prefix matching, and boosted fields
- No external service required -- works offline

**Nexus comparison**: Meilisearch is more powerful than both (supports faceting, ACL-filtered results, typo tolerance). The gap is only in local/offline fallback for when Meilisearch is unavailable.

---

## 6. VitePress i18n Approach

VitePress uses directory-based localization:

```
docs/
  en/          # Default locale (can also be at root)
  fr/
  zh-CN/
```

Each locale gets its own:
- Sidebar configuration
- Navbar items
- Search index
- Theme labels (e.g., "Previous page" vs "Page precedente")

The locale switcher is built into the navbar. URL structure is `/fr/guide/getting-started`.

RTL support is available through theme CSS variables.

**Key advantage**: Content is fully duplicated per locale, so translators work on complete files rather than string tables. This scales better for documentation than key-value i18n.

---

## 7. VitePress Versioned Docs Approach

VitePress does not have built-in versioning. Community approaches:

1. **Branch-based**: Each major version has a branch (`v1`, `v2`). Deploy to subdomains or subpaths.
2. **Folder-based**: Version folders in the content directory, with a version dropdown in the theme.
3. **Separate deployments**: Each version is a separate VitePress site on a different URL.

Most large projects (Vue, Vite) use separate branches deployed to versioned subdomains (e.g., `v2.vuejs.org`).

**Nexus advantage**: The `version` frontmatter field already provides a foundation. Adding a query-param-based version selector (Feature 9 above) is lighter weight and more flexible than the branch-based approach.

---

## 8. Summary of Nexus Advantages Over VitePress

Nexus is not "behind" VitePress -- it has significant capabilities VitePress lacks:

- **ACL/access control**: Tiered content access with user permissions
- **Full admin panel**: User management, audit logs, content management
- **Server-side search with ACL**: Meilisearch with permission-filtered results
- **Webhook-driven content sync**: GitLab integration with BullMQ queue
- **Dynamic rendering**: SSR with authentication, not just static generation
- **Email invitations**: Invite-based user onboarding
- **Issue reporting**: Built-in issue reporting system
- **OG image generation**: Dynamic Open Graph images per page
- **Extension-based content gating**: Fine-grained content access by product extension

The 10 features above would close the markdown authoring experience gap while retaining all of Nexus's enterprise features.

---

## 9. Implementation Priority

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 1 | Markdown-native containers (:::tip) | Small | High -- reduces author friction |
| 2 | Edit link | Small | High -- encourages contributions |
| 3 | Git-based timestamps | Small | Medium -- more accurate dates |
| 4 | Code diff highlighting (++/--) | Small | High -- essential for migration docs |
| 5 | Code focus/dim | Small | Medium -- improves tutorials |
| 6 | Code error/warning annotations | Small | Medium -- useful for security docs |
| 7 | Import code snippets | Medium | High -- keeps code examples in sync |
| 8 | Local search fallback | Medium | Medium -- improves resilience |
| 9 | i18n support | Large | High for international orgs |
| 10 | Versioned docs routing | Medium | Medium -- needed for multi-version products |
