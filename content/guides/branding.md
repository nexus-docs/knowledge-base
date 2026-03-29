---
title: "Customise Branding"
summary: "Change colours, logo, site name, and theme to match your brand"
access_tier: public
product: platform
status: published
owner: admin
tags: [branding, theme, colours, logo, customisation]
nav_order: 1
---

# Customise Branding

Make Nexus Docs look like your product.

## Site Name

Set in `.env`:

```env
NEXT_PUBLIC_SITE_NAME=My Product Docs
NEXT_PUBLIC_SITE_URL=https://docs.myproduct.com
```

## Colours

Edit `src/styles/globals.css` — replace the `--color-qoliber-*` variables with your brand colours:

```css
@theme {
  --color-qoliber-50: #fff7ed;
  --color-qoliber-100: #ffedd5;
  --color-qoliber-500: #f97316;
  --color-qoliber-600: #ea580c;
  /* ... */
}
```

Use any Tailwind CSS colour palette from [tailcolors.com](https://tailcolors.com).

## Logo

Replace the text logo in `src/components/layout/header.tsx`:

```tsx
<Link href="/" className="flex items-center gap-2">
  <img src="/images/your-logo.svg" alt="My Product" className="h-8" />
</Link>
```

## Favicon

Replace `public/images/qoliber-favicon-192.png` with your own favicon.

## Announcement Bar

Edit `src/components/layout/announcement-bar.tsx` to change the current announcement message, link, and type.

## Theme Colour

Update the `<meta name="theme-color">` values in `src/app/layout.tsx` to match your brand.
