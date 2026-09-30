# Codex Blog

A dark, editorial blog built with **Astro 5**, **Tailwind 4**, and Markdown content collections. Deployed automatically on **Cloudflare Pages** from every push to `main`.

**Live**: [codex-blog-6v6.pages.dev](https://codex-blog-6v6.pages.dev)

## Features

- **Astro 5** — static site generation, no runtime
- **Tailwind 4** — utility-first styling via the Vite plugin
- **Content collections** — type-safe Markdown posts with schema validation
- **RSS feed** — `/rss.xml`, generated at build time
- **Sitemap** — `/sitemap-index.xml`, generated at build time
- **Auto-deploy** — Cloudflare Pages rebuilds on every push to `main`
- **Dark theme** — editorial layout with green accent

## Stack

| Layer | Tool |
|-------|------|
| Framework | Astro 5.18 |
| Styling | Tailwind CSS 4 |
| Hosting | Cloudflare Pages |
| Runtime | Node 22.19 |
| Build tool | Vite 7 (pinned — Vite 8 ships Rolldown, which breaks `@tailwindcss/vite`) |

## Run Locally

```bash
npm install
npm run dev
```

Site runs at `http://localhost:4321`.

## Writing a Post

Create a Markdown file in `src/content/posts/`: `my-post.md` renders at `/blog/my-post/`.

Posts are validated against a schema in `src/content.config.ts`. Posts marked `draft: true` are excluded.

## Deployment

Pushes to `main` auto-deploy via Cloudflare Pages. The build runs `npm run build` and publishes `dist/`.

### Version pinning

- **Vite 7** via `overrides` — Vite 8 ships Rolldown, incompatible with `@tailwindcss/vite`
- **`@astrojs/sitemap@3.2.1`** and **`@astrojs/rss@4.0.7`** — newer versions migrate to zod 4, which conflicts with Astro 5
- **Node 22.19** via `.nvmrc`

Do not upgrade these without testing `npm ci && npm run build` locally first.
