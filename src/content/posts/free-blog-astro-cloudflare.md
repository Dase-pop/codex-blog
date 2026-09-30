---
title: "How I Set Up a Free Blog with Astro and Cloudflare Pages"
description: "A complete walkthrough: Astro 5, Tailwind 4, RSS, sitemap, and auto-deploy from GitHub to Cloudflare Pages — for free."
pubDate: 2026-10-01
author: "Dase-pop"
category: "Web Development"
tags: ["astro", "cloudflare", "static-site", "tutorial"]
---

You can host a fast, professional blog for free. No VPS, no monthly bill, no ads. The full stack is: **Astro** for the site, **Tailwind** for styling, **GitHub** for version control, and **Cloudflare Pages** for hosting. Every push to `main` triggers a build and deploys automatically.

Here is the exact setup, including the version traps that cost me hours.

## Why This Stack

- **Astro** builds static HTML. No server runtime, no database, no cold starts. Pages load instantly because they are just files on a CDN.
- **Cloudflare Pages** hosts static sites for free with unlimited bandwidth and 500 builds per month. Custom domains and SSL are included.
- **GitHub** is the source of truth. Cloudflare watches the repo and rebuilds on every push.
- **RSS and sitemap** are generated at build time, so search engines and feed readers can discover your content.

## 1. Scaffold the Astro Project

```bash
npm create astro@latest my-blog
cd my-blog
npm install
npm run dev
```

Astro prompts you for a template. Choose the **blog** starter, or **empty** and add Tailwind manually. For Tailwind 4:

```bash
npm install tailwindcss @tailwindcss/vite
```

Then wire Tailwind into `astro.config.mjs`:

```js
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://your-site.pages.dev",
  vite: { plugins: [tailwindcss()] },
});
```

## 2. Set Up Content Collections

Astro content collections give you type-safe Markdown posts with schema validation. Create `src/content.config.ts`:

```ts
import { defineCollection } from "astro:content";
import { z } from "astro/zod";

const posts = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    author: z.string().default("Your Name"),
    category: z.string().default("Notes"),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
```

Then write posts in `src/content/posts/`. Example frontmatter:

```markdown
---
title: "My first post"
description: "A short description for listings and search previews."
pubDate: 2026-10-01
author: "Your Name"
category: "Notes"
tags: ["astro", "blog"]
---

Your post content in Markdown.
```

## 3. Add RSS and Sitemap

```bash
npm install @astrojs/rss @astrojs/sitemap
```

Then update `astro.config.mjs`:

```js
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://your-site.pages.dev",
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
```

Create `src/pages/rss.xml.js`:

```js
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
  const posts = await getCollection("posts", ({ data }) => !data.draft);
  return rss({
    title: "Your Blog",
    description: "Notes on web development.",
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.id.replace(/\\.md$/, "")}/`,
    })),
  });
}
```

## 4. Push to GitHub

```bash
git init -b main
git add .
git commit -m "Initial blog"
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

## 5. Deploy on Cloudflare Pages

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and sign in.
2. Navigate to **Workers & Pages** → **Create application** → **Pages** tab.
3. Connect your GitHub repo.
4. Set the build configuration:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Click **Save and Deploy**.

Cloudflare will build the site on its servers and give you a URL like `your-repo.pages.dev` within a minute.

## 6. Pin the Build Environment

This is where I lost hours. Cloudflare uses `npm ci`, which strictly requires your `package-lock.json` to match `package.json`. To avoid failures:

**Pin the Node version** with `.nvmrc`:

```
22.19.0
```

**Generate the lockfile the same way Cloudflare reads it** — with plain `npm install`, not `--legacy-peer-deps`:

```bash
rm -rf node_modules package-lock.json
npm install
```

If you use `--legacy-peer-deps` locally, the lockfile can contain peer resolutions that `npm ci` rejects with cryptic errors like `Missing: X from lock file`.

**Match integration versions to your Astro core.** If you are on Astro 5, use `@astrojs/sitemap@3.2.1` and `@astrojs/rss@4.0.7`. Newer versions migrate to zod 4, which conflicts with Astro 5 and breaks the build with `z.function(...).optional is not a function`.

## 7. Write and Publish

Adding a post is now three commands:

```bash
# Write src/content/posts/new-post.md
git add src/content/posts/new-post.md
git commit -m "Add post: title"
git push origin main
```

Cloudflare detects the push and rebuilds in about 60 seconds. Your post is live.

## What This Costs

- **Domain**: optional. `.pages.dev` is free; a custom `.org` is ~$10/year.
- **Hosting**: free. Cloudflare Pages has unlimited bandwidth and 500 builds/month.
- **Build**: free. Cloudflare handles the build, not your machine.

Total: **$0** for a fast, professional, auto-deploying blog.

## What I Would Do Differently

Pin all versions from day one. Most of my debugging time came from version drift between Astro, Vite, zod, and the official integrations. If you set explicit versions in `package.json` and generate the lockfile correctly, you will not hit these traps.

The second thing: write the post while it is fresh. I documented this setup immediately after finishing it, which meant all the error messages and fixes were still accurate.
