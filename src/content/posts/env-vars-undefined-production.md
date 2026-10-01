---
title: "Why My Env Variables Were Undefined in Production"
description: "A Vite and Astro gotcha: why PUBLIC_ prefixed variables reach the client and everything else does not, and how to fix it without leaking secrets."
pubDate: 2026-10-05
author: "Dase-pop"
category: "Web Development"
tags: ["astro", "vite", "env", "debugging"]
---

Here is the error I hit on a production build:

```
TypeError: Cannot read properties of undefined (reading "API_URL")
```

The same code worked perfectly in development. The `.env` file was there. The variable was defined. And yet, in production, it was `undefined`.

This is one of the most common Vite and Astro gotchas, and the error message gives you nothing to work with. Here is what is happening and how to fix it.

## The Rule

Vite only exposes environment variables that are prefixed with `PUBLIC_` to the client. Everything else stays on the server.

```
PUBLIC_API_URL=https://api.example.com   # exposed to the browser
API_SECRET=abc123                       # stays on the server
```

If you try to reference `import.meta.env.API_SECRET` from a client-side component, it is `undefined`. Not because the variable is missing, but because Vite deliberately hides it.

This is a feature, not a bug. It prevents you from accidentally shipping an API key to every visitor who opens DevTools.

## The Symptom

The failure looks like this:

- Your `.env` file defines `API_KEY`
- Your component calls `import.meta.env.API_KEY`
- In development (`npm run dev`), it works
- In production, `import.meta.env.API_KEY` is `undefined`
- Your code throws a `TypeError` when it tries to use the value

The reason it works in development is that Vite is more permissive in dev mode. It loads `.env` and makes all variables available in the dev server. In production, the build step strips out anything not prefixed with `PUBLIC_`.

## The Fix

**Option 1: Rename the variable.**

If the value is safe to expose, prefix it with `PUBLIC_`:

```
PUBLIC_API_URL=https://api.example.com
```

Then reference it with the new name:

```javascript
const apiUrl = import.meta.env.PUBLIC_API_URL
```

**Option 2: Keep it server-side.**

If the value is a secret, do not expose it. Move the code that uses it into an API route or a server-side endpoint, and fetch the result from the client.

For Astro, that means creating a file at `src/pages/api/something.json.ts`:

```typescript
export const prerender = false

export async function GET() {
  const response = await fetch("https://api.example.com/data", {
    headers: { Authorization: `Bearer ${import.meta.env.API_SECRET}` }
  })
  const data = await response.json()
  return new Response(JSON.stringify(data))
}
```

Then call `/api/something.json` from the client. The secret stays on the server, the client gets the data.

## How to Diagnose It

When an env variable is `undefined`, work through this sequence:

**1. Check the prefix.**

```bash
grep -E "^(PUBLIC_|_)" .env
```

Only `PUBLIC_` variables reach the client. Anything else needs to be renamed or handled server-side.

**2. Check the variable name.**

```bash
grep -n "import.meta.env" src/**/*.astro 2>/dev/null
```

The name in the code must match the name in `.env` exactly. `API_URL` is not `APIURL`, and case matters.

**3. Check that `.env` is loaded.**

Astro loads `.env` automatically, but Cloudflare Pages needs the variables configured in the dashboard, not in a committed file. If you are deploying to Cloudflare, set the variable there too.

**4. Check the build environment.**

Variables in `.env` are for local development. Cloudflare Pages uses its own environment variables set in the dashboard under **Settings → Environment variables**. Both need to be configured.

## The Cloudflare Trap

Even after fixing the prefix, a second issue often appears: the variable is defined in `.env` locally, but Cloudflare has no idea it exists.

`.env` files should **not** be committed to Git. Cloudflare does not read them. You have to set the same variables in Cloudflare:

1. Go to Cloudflare Dashboard → Workers & Pages → your project
2. **Settings → Environment variables**
3. Add the variable for **Production** and **Preview**
4. Trigger a new deployment

If you skip this step, the variable is `undefined` at build time on Cloudflare even if it works locally.

## The General Rule

Environment variables in Vite and Astro fall into two categories:

| Prefix | Where it lives | Safe to expose? |
|--------|---------------|-----------------|
| `PUBLIC_` | Client and server | Yes |
| Anything else | Server only | No |

If a value is not prefixed with `PUBLIC_`, treat it as a secret. Never try to use it in client-side code. If you need it there, you almost certainly need an API route instead.

This is one of those rules that is obvious once you know it. Before you know it, the failure is invisible, and the error message gives you nothing.
