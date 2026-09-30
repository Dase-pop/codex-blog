---
title: "Fixing the tsconfigPaths Error in Astro + Tailwind 4"
description: "A step-by-step fix for the Vite 8 / Rolldown incompatibility that breaks Astro builds when using Tailwind 4."
pubDate: 2026-09-30
author: "Dase-pop"
category: "Web Development"
tags: ["astro", "tailwind", "vite", "debugging"]
---

If you are building an Astro site with Tailwind 4 and your build fails with this error:

```
[@tailwindcss/vite:generate:build] Missing field `tsconfigPaths` on BindingViteResolvePluginConfig.resolveOptions
```

You are not alone. This is a compatibility break between Vite 8 (which ships Rolldown) and the `@tailwindcss/vite` plugin. Here is what is happening and how to fix it.

## The Root Cause

Vite 8 bundles Rolldown as its default bundler. Rolldown is a Rust rewrite of Rollup and is significantly faster, but its plugin API is not yet fully compatible with the existing Vite plugin ecosystem. The `@tailwindcss/vite` plugin relies on a field called `tsconfigPaths` that Rolldown does not expose. When Astro tries to generate your CSS, the plugin crashes.

The fix is to pin Vite to version 7, which uses the classic Rollup-based bundler and works correctly with Tailwind 4.

## The Fix

### 1. Pin Vite 7 in package.json

Add an `overrides` field to `package.json`:

```json
{
  "overrides": {
    "vite": "^7.3.6"
  }
}
```

Do not add Vite to `dependencies` or `devDependencies` at the same time. npm will reject the install with an `EOVERRIDE` error.

### 2. Use Node 22.19 or newer

Modern Astro versions require Node 22.12 or newer, and some transitive dependencies require 22.19. Set `.nvmrc`:

```
22.19.0
```

### 3. Match integration versions to your Astro core

This one is easy to miss. If you are on Astro 5, use `@astrojs/sitemap@3.2.1` and `@astrojs/rss@4.0.7`. Newer versions of those integrations migrate to zod 4, which conflicts with Astro 5 (zod 3) and breaks the build with `z.function(...).optional is not a function`.

If you are on Astro 6, use the latest versions of those packages.

### 4. Generate the lockfile the way your build environment does

If your CI uses `npm ci`, generate the lockfile with plain `npm install` — not `--legacy-peer-deps`. Otherwise the lockfile may contain peer-dependency resolutions that `npm ci` rejects.

```bash
rm -rf node_modules package-lock.json .astro
npm install
npm run build
```

## Verifying the Fix

After the build completes, check that the output directory contains your pages:

```bash
ls dist/blog/
```

If your posts are rendering, the build succeeded.

## Why This Matters

This class of error is going to become more common as more tools migrate to Rolldown. Pinning Vite 7 is a temporary workaround. The long-term fix will come from the Tailwind team updating their plugin to support Rolldown.

Until then, the combination above is stable and reproducible.
