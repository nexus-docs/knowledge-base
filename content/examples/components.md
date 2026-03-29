---
title: "MDX Components"
summary: "Available MDX components — admonitions, code tabs, protected sections, video embeds, and collapsibles"
access_tier: public
product: platform
status: published
owner: admin
tags: [mdx, components, admonition, code-tabs, protected]
nav_order: 1
---

# MDX Components

Nexus Docs includes several MDX components you can use in markdown files.

## Admonitions

```markdown
<Admonition type="note" title="Note Title">
This is a note.
</Admonition>
```

Available types: `note`, `tip`, `info`, `warning`, `danger`, `success`

<Admonition type="note" title="This is a Note">
Notes are for general information.
</Admonition>

<Admonition type="tip" title="Pro Tip">
Tips highlight best practices.
</Admonition>

<Admonition type="warning" title="Caution">
Warnings flag potential issues.
</Admonition>

<Admonition type="danger" title="Critical">
Danger blocks for breaking changes or security issues.
</Admonition>

<Admonition type="success" title="All Good">
Success blocks for confirmations.
</Admonition>

## Protected Sections

```markdown
<Protected tier="partner" label="Partner">
This content is only visible to partners and above.
</Protected>
```

<Protected tier="partner" label="Partner">

This section is protected. If you can see this, you're logged in as a partner or admin.

</Protected>

## Video Embeds

```markdown
<VideoEmbed src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" title="Example Video" />
```

## Code Blocks

Standard markdown code blocks with syntax highlighting via Shiki:

```typescript
interface User {
  id: string;
  email: string;
  tier: string;
}
```

```bash
docker compose up -d
docker compose exec app npx prisma migrate deploy
```

## Tables

Standard markdown tables:

| Feature | Status |
|---------|--------|
| Markdown | Supported |
| MDX Components | Supported |
| Images | Supported |
| Code Highlighting | Shiki |
