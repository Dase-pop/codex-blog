---
title: "Fixing the tsconfigPaths Error in Astro 6 + Tailwind 4"
description: "A step-by-step fix for the Vite 8 / Rolldown incompatibility that breaks Astro builds when using Tailwind 4."
pubDate: 2026-09-30
author: "Dase-pop"
category: "Web Development"
tags: ["astro", "tailwind", "vite", "debugging"]
---

If you are building an Astro 6 site with Tailwind 4 and your build fails with this error:

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

Astro 6 requires Node 22.12 or newer. Some transitive dependencies require 22.19 or newer. Set `.nvmrc`:

```
22.19.0
```

### 3. Fix the Zod import

In Astro 6, `z` is no longer exported from `astro:content`. Import it from `astro/zod` instead:

```ts
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
```

### 4. Delete node_modules and reinstall

```bash
rm -rf node_modules package-lock.json .astro
npm install --legacy-peer-deps
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
