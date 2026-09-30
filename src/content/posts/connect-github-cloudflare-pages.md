---
title: "How to Connect GitHub to Cloudflare Pages"
description: "A step-by-step guide to deploying a static site from GitHub to Cloudflare Pages, including the build settings and integration gotchas."
pubDate: 2026-10-01
author: "Dase-pop"
category: "Web Development"
tags: ["cloudflare", "github", "static-site", "deployment"]
---

Cloudflare Pages is one of the best free hosts for static sites. It gives you unlimited bandwidth, 500 builds per month, free SSL, and automatic deploys on every push. But the setup flow has a few traps that are easy to miss the first time.

This is the exact process, including the parts that are not obvious.

## Prerequisites

- A GitHub account
- A repository with a buildable static site (Astro, Hugo, Next.js static export, plain HTML, etc.)
- A free Cloudflare account

For this guide, I will assume an Astro project where `npm run build` produces a `dist/` folder.

## 1. Create a Cloudflare Account

Go to [dash.cloudflare.com](https://dash.cloudflare.com) and sign up. The free plan is sufficient — no credit card required.

## 2. Install the Cloudflare GitHub App

Cloudflare needs permission to read your repository and receive webhooks on every push.

1. In the dashboard, go to **Workers & Pages**.
2. Click **Create application**.
3. On the next screen, choose the **Pages** tab — not **Workers**.
4. Click **Connect to Git**.
5. Authorize the Cloudflare GitHub App.

When GitHub asks which repositories to grant access to, choose **Only select repositories** and pick the one you want to deploy. Do not grant access to all your repositories unless you specifically want that.

**Common mistake:** If you accidentally choose the Workers flow instead of Pages, you will be asked for a "Deploy command" with `npx wrangler deploy` in it. That is the Workers setup, not Pages. Back out and find the Pages tab.

## 3. Select the Repository

After authorizing, Cloudflare lists your repositories. Select the one you want to deploy and click **Begin setup**.

## 4. Configure the Build

This is the screen where most people get stuck. Fill in the fields based on what your project actually produces:

| Field | Value for Astro |
|-------|-----------------|
| **Project name** | Anything — e.g. `my-blog`. This becomes `my-blog.pages.dev`. |
| **Production branch** | `main` (or `master` if that is your default) |
| **Framework preset** | `Astro` if listed, otherwise `None` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |

Leave **Root directory** empty unless your site lives in a subfolder of the repo.

Leave **Environment variables** empty unless your build needs secrets.

**Common mistake:** If your project uses a framework with a different output folder (Next.js uses `out/`, Hugo uses `public/`), make sure the output directory matches. Getting this wrong produces a deploy that succeeds but serves a blank page.

## 5. Deploy

Click **Save and Deploy**. Cloudflare will:

1. Clone your repository
2. Install dependencies with `npm ci`
3. Run your build command
4. Upload the output to its global CDN

The first build takes 1–3 minutes. You will get a URL like `my-blog.pages.dev` when it succeeds.

## 6. Understand the npm ci Trap

Cloudflare uses `npm ci`, not `npm install`. The difference matters:

- `npm install` reads `package.json`, resolves the latest compatible versions, and may update `package-lock.json`.
- `npm ci` reads `package-lock.json` exactly. It refuses to install if the lockfile is out of sync with `package.json`.

If your local lockfile was generated with flags like `--legacy-peer-deps`, it may contain peer-dependency resolutions that `npm ci` rejects. You will see errors like:

```
npm error `npm ci` can only install packages when your package.json
and package-lock.json or npm-shrinkwrap.json are in sync.
npm error Missing: some-package@x.y.z from lock file
```

**The fix:** regenerate the lockfile with plain `npm install` before committing:

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

If that build succeeds locally, it will succeed on Cloudflare. Commit and push the new lockfile.

## 7. Pin the Node Version

Cloudflare defaults to a specific Node version for your project, which may not match what you use locally. Pin it with a `.nvmrc` file in the repo root:

```
22.19.0
```

Cloudflare reads this file and installs that Node version before building. This prevents "it works on my machine" build failures.

## 8. Configure Automatic Deploys

Once connected, every push to your production branch triggers a new build and deploy. You can verify this in the **Deployments** tab.

- **Push to `main`** → production deploy
- **Push to another branch** → preview deploy at a separate URL
- **Pull request opened** → preview deploy with a comment on the PR

You do not need to configure anything — it works automatically after the initial connection.

## 9. Connect a Custom Domain (Optional)

`.pages.dev` is free and works fine. If you want a custom domain:

1. Go to your Pages project → **Custom domains** tab.
2. Click **Set up a custom domain**.
3. Enter your domain.

If your domain is registered through Cloudflare, DNS is configured automatically. If it is registered elsewhere, Cloudflare will give you a CNAME record to add at your registrar.

Update your site config to match the domain. For Astro, that means editing `site` in `astro.config.mjs`:

```js
export default defineConfig({
  site: "https://yourdomain.org",
  // ...
});

```

This ensures canonical URLs, RSS links, and sitemap entries use the correct domain.

## 10. What Happens on Every Push

After the initial setup, your workflow becomes:

1. Edit files locally
2. `git add`, `git commit`, `git push`
3. Cloudflare detects the push via webhook
4. Cloudflare clones the repo, runs the build, deploys the output
5. Your site is live within ~60 seconds

No manual deploy step, no FTP, no S3 sync. It just works.

## Troubleshooting

**Build fails at `npm ci`:** Regenerate the lockfile with plain `npm install` and commit the new `package-lock.json`.

**Build succeeds but the site is blank:** Your build output directory is wrong. Check that it matches what your framework produces (`dist` for Astro, `out` for Next.js, `public` for Hugo).

**The live site shows an old version:** Cloudflare caches by deployment. Check the **Deployments** tab — the newest successful build is the one being served.

**Wrong branch is deploying:** Check **Settings → Builds & deployments → Branch control**. The production branch should be `main` (or whatever your default is).

## Why This Stack Works

Cloudflare Pages is free because it only serves static files — there is no server to run. The build happens once per push, and the output goes to a CDN with hundreds of edge locations. For a blog, documentation site, or marketing page, this is the ideal architecture.

Combined with GitHub, you get version history, rollback, and collaborative workflow for free. The entire pipeline costs $0.
