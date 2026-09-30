# Codex Blog

A dark, editorial Astro blog with Tailwind CSS, Markdown content, an RSS feed, and an automatically generated sitemap.

## Start locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`, and preview it with `npm run preview`.

## Add a post

Create a Markdown file in `src/content/posts/` with frontmatter:

```md
---
title: "Your post title"
description: "A short description for listings and search previews."
pubDate: 2026-10-01
author: "Your name"
category: "Notes"
tags: ["astro", "ideas"]
draft: false
---

Write your post in Markdown here.
```

Post URLs use the filename as the slug. Posts marked `draft: true` are omitted from the site and RSS feed.

## Site URL

Before deploying, change the `site` value in `astro.config.mjs` from the example URL to your public domain. Astro uses it to create canonical URLs, RSS links, and the sitemap.
