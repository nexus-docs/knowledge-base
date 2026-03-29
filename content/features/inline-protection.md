---
title: "Inline Content Protection"
summary: "Mix public and protected content on the same page using the Protected component"
access_tier: public
product: platform
status: published
owner: admin
tags: [protected, inline, access-control, mdx, component]
nav_order: 2
---

# Inline Content Protection

The `<Protected>` component lets you gate specific sections within a page while keeping the rest public. No need to split content across separate pages.

## Usage

Wrap any markdown content with the `<Protected>` tag:

```markdown
## Public Introduction

This content is visible to everyone.

<Protected tier="partner" label="Partner">

## Detailed Architecture

This section is only visible to partners and above.
Tables, code blocks, images — anything works inside Protected.

</Protected>

## Another Public Section

Back to public content.
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `tier` | Yes | Tier name required to view this section |
| `label` | No | Display name shown in the lock placeholder (defaults to tier name) |

## What Unauthorized Users See

Instead of the protected content, users see a locked placeholder:

> **Partner Content**
> This section is available to Partner members and above. Sign in or request access to view.

The placeholder shows the tier label and a prompt to sign in or request access.

## How It Works

The `MdxRenderer` receives the current user's tier rank. The `Protected` component compares it against the required tier rank and either renders the children or shows the lock placeholder. This happens server-side — protected content is never sent to the browser for unauthorized users.

<Protected tier="partner" label="Partner">

## Example Protected Section

If you can read this, you're a partner or above. This text is completely hidden from public users — not blurred, not obfuscated, just not rendered.

</Protected>

## Best Practices

- Keep section headings **outside** the `<Protected>` block so users know what topics exist
- Use `label` for human-friendly tier names: `<Protected tier="gold_partner" label="Gold Partner">`
- Don't nest `<Protected>` blocks — use the highest required tier for the entire section
