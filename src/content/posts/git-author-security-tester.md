---
title: "Why My GitHub Commits Were Authored by Security Tester"
description: "A two-minute fix for the wrong Git identity, plus how to catch it before you push anything public."
pubDate: 2026-10-01
author: "Dase-pop"
category: "Tooling"
tags: ["git", "github", "tooling", "debugging"]
---

I published a blog. Then I looked at the commit history on GitHub and saw this:

```
Author: Security Tester <test@security.local>
```

I had never set that name. But every commit in the repository — every push, every fix, every deployment — was attributed to "Security Tester" with a fake email domain. On a public repo. Linked to my GitHub profile.

Here is what happened, why it matters, and how to fix it in under two minutes.

## Why It Happened

Git stores the author name and email in a config file, separate from your GitHub account. When you run `git commit`, Git uses whatever is in that config. It does not check it against GitHub, and it does not prompt you to confirm.

If that config was set once — by a script, a template, a bootstrapped environment, or a previous user on the same machine — every commit you make inherits it. Nothing warns you.

On my setup, the config was:

```bash
git config user.name
# Security Tester

git config user.email
# test@security.local
```

That is not my name. That is not my email. But it was the identity attached to every commit I pushed.

## Why It Matters

Three reasons:

1. **Your GitHub profile does not show the commits.** GitHub links commits to accounts by email address. If the email in your commits does not match an email on your GitHub account, the commits appear as an unverified stranger — not you. Your contribution graph stays empty, your profile looks inactive.

2. **Your public history is misattributed.** If you are building a public repo as a portfolio, the commit history is part of what people see. "Security Tester" tells them nothing about you, and may look odd on a professional profile.

3. **You cannot fix it silently later.** Once commits are pushed, the author metadata is part of the commit hash. Changing it requires rewriting history — `git rebase`, `git filter-repo`, or deleting the repository and starting over.

The third point is the one that hurts. If you push 50 commits under the wrong identity, fixing them all means rewriting your entire history.

## The Fix

Set the correct identity, globally:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Use the email address associated with your GitHub account. If you do not want your real email in public commits, GitHub provides a privacy-preserving alternative:

```
YOUR_USERNAME@users.noreply.github.com
```

For example:

```bash
git config --global user.email "Dase-pop@users.noreply.github.com"
```

This still links commits to your GitHub account and shows them on your profile — it just does not expose your personal email to the public.

Verify the change:

```bash
git config user.name
git config user.email
```

New commits will use the correct identity from this point forward.

## What About Existing Commits

Old commits keep the old author. You have two options:

**Option A: Leave them.** If the old commits are just scaffolding — initial setup, config files, no meaningful content — it is usually not worth the effort to rewrite them. New commits will be correct, and over time the old ones fade into the history.

**Option B: Rewrite them.** If the repo is public and the misattribution is embarrassing or problematic, you can rewrite history:

```bash
git rebase -i --root
```

Or, more robustly, with `git filter-repo`:

```bash
git filter-repo --name-callback "return b\"Your Name\"" \\
  --email-callback "return b\"you@example.com\""
```

Both approaches rewrite every commit, which changes every hash. Anyone who has cloned or forked the repo will have a diverged history. For a solo project with no collaborators, this is fine. For anything shared, coordinate first.

## How to Catch It Before You Push

Run this before your first push on any new machine or environment:

```bash
git config user.name
git config user.email
```

If either is empty, wrong, or unfamiliar, set them before committing.

You can also add an alias that shows the identity alongside the commit:

```bash
git config --global alias.whoami "!git config user.name && git config user.email"
```

Then `git whoami` shows the current identity in one command.

## Why I Wrote This

Because I did not notice for hours. I was deep in a different debugging problem, pushed a dozen commits, and only saw the author line when I checked the GitHub repo view. The commits were public the whole time.

It is a two-minute fix if you know to look for it. The cost of not looking is your entire commit history under someone else's name.

If you are starting a new repo — especially a public one — run the two `git config` commands first.
