---
title: "How to Host a Blog for Free in 2026 (Astro + Cloudflare Pages)"
description: "A realistic cost breakdown of running a blog for 0 dollars a month, including the exact stack, the free-tier limits, and when you would actually need to pay."
pubDate: 2026-10-01
author: "Dase-pop"
category: "Web Development"
tags: ["astro", "cloudflare", "hosting", "static-site"]
---

Most people assume a blog costs money to run. A cheap host, a domain, a theme, an email service -- it adds up to 20 to 50 dollars a month before you have written a single word.

This is a breakdown of an alternative stack that runs a real blog for **0 dollars per month**, and the specific conditions under which that stops being true.

## The Stack

| Layer | Tool | Cost |
|-------|------|------|
| Framework | Astro | 0 |
| Styling | Tailwind CSS | 0 |
| Hosting | Cloudflare Pages | 0 |
| CDN | Cloudflare edge network | 0 |
| SSL | Auto-provisioned by Cloudflare | 0 |
| Version control | GitHub | 0 |
| Search indexing | Google Search Console | 0 |
| RSS + sitemap | Generated at build time | 0 |

**Total: 0 dollars per month.** The only optional paid item is a custom domain (~10 dollars per year).

## Why This Is Free

The trick is that the site is **static**. Every page is generated at build time as plain HTML. There is no server runtime, no database, no PHP, no container. Cloudflare serves the HTML files from its global CDN, which is designed to serve static assets at near-zero marginal cost.

Cloudflare Pages free tier includes:

- **Unlimited bandwidth** -- no egress fees, no matter how much traffic you get
- **500 builds per month** -- one per git push, which for a personal blog is more than enough
- **100 custom domains per project**
- **Free SSL certificates** for all of them
- **Global edge caching** across hundreds of locations

For a blog, these limits are effectively unbounded. You would need to publish more than 15 posts per day to exceed 500 builds a month.

## What This Costs in Practice

Here is the same list of features priced out from alternative providers:

| Feature | Typical paid cost |
|---------|-------------------|
| Hosting with CDN | 20-30 dollars/mo (Vercel Pro, Netlify Pro) |
| SSL certificate | 0-50 dollars/yr |
| DDoS protection | 20 dollars/mo (Cloudflare Pro) |
| CDN bandwidth (1TB/mo) | ~85 dollars/mo (AWS CloudFront) |
| Managed blog platform | 9-29 dollars/mo (Ghost, Substack Pro) |
| CI/CD pipeline | 0-10 dollars/mo (GitHub Actions) |

Total for the same functionality: **100-150 dollars per month**, or **1200-1800 dollars per year**.

You are running the equivalent for **0 dollars**. The reason is that modern static hosting has essentially no marginal cost -- serving a file from a CDN is cheaper than serving a dynamic page from a server, and Cloudflare offers it free because it drives adoption of their paid products.

## When You Would Actually Pay

There are four realistic scenarios where this free stack stops being enough:

**1. Custom domain.** The pages.dev subdomain is free, but a .org or .com is ~10 dollars per year. Not strictly necessary, but worth it if you plan to share your site on a resume or in a job application.

**2. Email newsletter.** If you want to send emails to subscribers, you need a service like Buttondown, ConvertKit, or Mailchimp. These start free up to a few hundred subscribers, then cost 10-30 dollars per month.

**3. Custom analytics.** Cloudflare offers basic analytics for free. If you want detailed visitor analytics, Plausible is 9 dollars/mo, Fathom is 14 dollars/mo, and Google Analytics is free (but privacy-invasive).

**4. Comments.** Giscus (GitHub-based) is free. Disqus Pro is 10 dollars/mo. Self-hosted options like Isso are free but require a small server (5 dollars/mo).

None of these are required for a working blog. They are all optional and can be added later.

## How to Set It Up

The full setup takes about 30 minutes. The steps are:

1. **Scaffold the Astro project** with npm create astro
2. **Add Tailwind 4** for styling
3. **Set up content collections** for Markdown posts
4. **Add RSS and sitemap** integrations
5. **Push to GitHub**
6. **Connect to Cloudflare Pages** via the dashboard
7. **Configure the build**: command npm run build, output directory dist
8. **Submit the sitemap** to Google Search Console

I wrote a detailed walkthrough of these steps in [How I Set Up a Free Blog with Astro and Cloudflare Pages](/blog/free-blog-astro-cloudflare/), including the version pinning that avoids the most common build failures.

## What the Free Tier Actually Limits

Cloudflare Pages has a few soft limits worth knowing:

- **500 builds per month.** For a personal blog, this is nothing. If you were running a multi-author site with dozens of daily commits, you would hit it.
- **100 custom domains.** Not relevant unless you are running a multi-tenant platform.
- **20-minute build timeout.** Astro builds take 30 seconds to a few minutes. Not a concern unless you have hundreds of images and a very large site.
- **25 MiB per file.** Static assets under this size are fine. Large videos would need external hosting.

None of these limits apply to a typical blog.

## The Trade-offs

Running a free static blog has trade-offs worth being honest about:

**You own the pipeline.** Unlike a hosted blog platform (Medium, Substack), you control the entire stack. That means you also maintain it. Upgrading Astro, updating Tailwind, and dealing with dependency changes is your responsibility. In practice this is a few hours a year.

**You write in Markdown.** No rich-text editor, no WYSIWYG. Markdown is simpler, faster, and more portable -- but not ideal if you prefer a visual editor.

**You do not get a built-in audience.** Substack and Medium promote your posts to their readers. A self-hosted blog starts with zero traffic and builds slowly. This is the biggest trade-off.

**You are responsible for SEO.** There is no platform-level optimization. You configure meta tags, sitemaps, and canonical URLs yourself. In practice, Astro handles most of this with a few lines of config.

## When to Consider Something Else

If any of the following are true, a free static blog might not be the right choice:

- You want to build a paid newsletter business (use Substack or Ghost)
- You want to write for an existing audience (use Medium or dev.to)
- You are non-technical and do not want to touch code (use WordPress or Squarespace)
- You need dynamic features like user accounts, comments with auth, or a forum (use a server-based stack)

For a personal blog, documentation site, portfolio, or project landing page, the static stack is almost always the right choice.

## The Bottom Line

A blog can cost **0 dollars per month** to run, and it can have better performance, better security, and better reliability than paid alternatives. The trade-off is time: you set up the stack yourself, and you are responsible for maintaining it.

If you write regularly and want to own your content, the free static stack is a real option. Not a compromise -- an upgrade.
