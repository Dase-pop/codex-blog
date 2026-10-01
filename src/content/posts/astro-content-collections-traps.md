---
title: "Astro Content Collections: The Schema Traps That Silently Drop Posts"
description: "Three mistakes that make Astro report an empty content collection instead of an error, and how to diagnose each one."
pubDate: 2026-10-04
author: "Dase-pop"
category: "Web Development"
tags: ["astro", "content-collections", "debugging"]
---

When Astro content collections work, they are excellent: type-safe Markdown, schema validation, and fast builds. When they break, they break quietly.

The most common failure mode is a build that succeeds while every post silently disappears. The error you see is not a schema validation error. It is:

```
The collection "posts" does not exist or is empty. Please check your content config file for errors.
```

That message is misleading. It suggests the collection is missing or empty, when the real cause is almost always one of three specific schema problems. Here they are, in order of how often they trip people up.

## Trap 1: The zod import is in the wrong place

In Astro 5 and later, `z` is not exported from `astro:content`. If you import it from there, Astro silently accepts the import, `z` becomes `undefined`, the schema fails to construct, and the collection never registers.

The wrong way:

```ts
import { defineCollection, z } from "astro:content";
```

The right way:

```ts
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
```

This is the single most common cause of an empty content collection. It produces no error at import time. The only symptom is that no posts appear.

## Trap 2: The `type` field is no longer valid

In Astro 3, you declared a content collection with an explicit type:

```ts
const posts = defineCollection({
  type: "content",
  schema: z.object({ ... }),
});
```

That field was deprecated in Astro 4 and removed in Astro 5. If it is still present in an Astro 5 project, Astro may silently fail to register the collection.

The fix is to remove the line:

```ts
const posts = defineCollection({
  schema: z.object({ ... }),
});

## Trap 3: The schema rejects your frontmatter

If your Markdown frontmatter does not match the schema, Astro does not error. It drops the post. The collection looks empty, but the files are there.

Common mismatches:

- The schema expects `pubDate` as a date, but the frontmatter has `date`
- The schema expects a `description` string, but the frontmatter has `desc`
- The schema expects `tags` as an array, but the frontmatter has a comma-separated string
- The schema has required fields the frontmatter does not provide

The most reliable fix is to make the schema permissive while debugging. Replace the schema with an empty object:

```ts
const posts = defineCollection({});
```

If posts suddenly appear, the schema was rejecting them. Add fields back one at a time until the problem returns, and you will find the mismatch.

## Trap 4: The config file is in the wrong location

Astro changed the config file path between versions:

| Astro version | Config location |
|---------------|-----------------|
| Astro 3-4 | `src/content/config.ts` |
| Astro 5+ | `src/content.config.ts` |

If the file is at the wrong path, Astro does not find it and does not register any collections. The error is the same: "The collection does not exist or is empty."

Verify the location:

```bash
ls src/content.config.ts
ls src/content/config.ts 2>/dev/null
```

Exactly one of those files should exist. If both exist, Astro may load the wrong one. Remove the one that does not match your version.

## How to Diagnose These

When the collection error appears, run this sequence:

**1. Check the imports.**

```bash
head -2 src/content.config.ts
```

Expected output:

```
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
```

**2. Check for the deprecated `type` field.**

```bash
grep -n "type:" src/content.config.ts
```

If it prints a line, remove it.

**3. Check the config file location.**

```bash
ls src/content.config.ts
```

If this file does not exist, your config is in the wrong place.

**4. Check the posts exist.**

```bash
find src/content/posts -type f
```

If this returns nothing, the posts are missing or in the wrong folder.

**5. Clear the Astro cache and rebuild.**

```bash
rm -rf .astro
npm run build
```

The `.astro` folder caches the content collection state. If you have changed the schema, the cached state can persist the old (broken) behavior.

## The Full Working Config

For reference, here is a complete `src/content.config.ts` that works on Astro 5:

```ts
import { defineCollection } from "astro:content";
import { z } from "astro/zod";

const posts = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default("Anonymous"),
    category: z.string().default("Notes"),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
```

And a matching post at `src/content/posts/my-post.md`:

```markdown
---
title: "My post"
description: "A short description."
pubDate: 2026-10-04
author: "Your Name"
category: "Notes"
tags: ["astro"]
---

Content here.
```

If both are in place, and the imports are correct, and the `type` field is gone, the collection will register.

## Why Astro Fails Silently Here

Most of these problems could produce a clear error. `z` being `undefined` could throw at import time. A schema mismatch could log a validation error naming the file and field. A missing config could warn at startup.

Instead, Astro reports "the collection does not exist or is empty," which is technically true but completely unhelpful for diagnosis.

Until that changes, the five steps above are the fastest way to narrow down which of the four traps is causing the problem.
