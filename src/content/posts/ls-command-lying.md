---
title: "How My ls Command Was Lying to Me"
description: "A debugging story about a shell alias that silently ignored its arguments, and the four commands that caught it."
pubDate: 2026-10-01
author: "Dase-pop"
category: "Tooling"
tags: ["shell", "zsh", "debugging", "tooling"]
---

I spent an hour convinced I had deleted a directory. I had not. My `ls` command was lying to me.

This is the story of how that happened, why it is more common than it sounds, and the four commands that cut through it.

## The Problem

I was working on an Astro project and needed to check the contents of `src/`. I ran:

```bash
ls -la src/
```

And got back:

```
astro.config.mjs   package.json  src
node_modules       public        tsconfig.json
package-lock.json  README.md
```

That is the contents of the current directory — not `src/`. The `src/` directory was clearly there in the listing, but `ls` refused to look inside it.

I assumed the argument was wrong. I tried `ls src`, `ls ./src`, `ls /full/absolute/path/to/src`. Every single one returned the same output: the current directory, over and over.

I spent the next hour convinced the directory did not exist. But other commands — `cd`, `find`, `test -d` — all confirmed it did.

## The Cause

`ls` was not `ls`. It was an alias:

```bash
type ls
# ls is an alias for eza --icons 2>/dev/null || ls --color=auto
```

That alias replaces `ls` with `eza --icons`, a modern replacement. The intent is fine. But this version of `eza` had a bug: when given a path argument, it silently ignored it and listed the current directory instead.

The `2>/dev/null` part hid the error. If `eza` failed, the shell was supposed to fall back to `ls --color=auto`. But because `eza` exited cleanly (with wrong output), the fallback never triggered.

So every `ls <path>` I ran was hijacked by a broken tool, with errors suppressed, returning plausible-looking wrong answers.

## Why This Class of Bug Is Dangerous

Most bugs fail loudly. They print errors, exit with non-zero codes, or crash. You notice them immediately.

This one failed silently. It returned output that looked correct — file listings in the expected format — but it was the wrong output. Every command I ran was "working" in the sense that it produced something. The something was just wrong.

Silent failures are the worst kind because they erode your trust in the tools you rely on most. For an hour, I trusted `ls`. It was not trustworthy.

## The Four Commands That Caught It

What eventually broke the loop was a set of commands that query the filesystem independently of `ls`:

### 1. `type` — Show what a command actually is

```bash
type ls
```

This tells you whether `ls` is a binary, a function, or an alias. In my case, it revealed the `eza` alias. This one command would have saved me an hour if I had run it first.

You can also use `which ls` or `command -v ls`, but `type` is the most informative because it shows aliases and functions, not just binaries.

### 2. `command` — Bypass aliases and functions

```bash
command ls -la src/
```

The `command` prefix tells the shell to run the literal binary, ignoring any alias or function with that name. This immediately showed me the correct contents of `src/`.

This is the fastest workaround when you suspect an alias is broken. It also works for `command cat`, `command grep`, and any other aliased command.

### 3. `test` — Ask yes-or-no questions

```bash
test -d src && echo "src is a directory" || echo "src is not"
test -f src/content.config.ts && echo "config exists" || echo "config missing"
```

`test` does not produce formatted output. It returns an exit code, which you echo manually. This makes it immune to the class of bug that was affecting `ls` — there is no listing to be formatted wrongly, just a boolean.

When you need to verify the existence of a file or directory and do not trust `ls`, `test` is the reliable answer.

### 4. `stat` — Get raw filesystem metadata

```bash
stat src/
```

`stat` queries the filesystem directly and returns structured metadata: size, permissions, inode, timestamps, owner. It does not format a directory listing, so it is not vulnerable to whatever was breaking `eza`.

When `stat src/` returns real metadata, you know the path exists. No interpretation required.

## The Fix

The broken alias lives in a shell config file, usually `~/.zshrc` or `~/.bashrc`. You can find it with:

```bash
grep -rn "alias ls" ~/.zshrc ~/.zprofile ~/.bashrc ~/.profile 2>/dev/null
```

If it shows up, remove the line or comment it out. If it does not show up in any of those files, it may be defined in a sourced file or by a framework like Oh-My-Zsh, Powerlevel10k, or a Termux default config.

To remove it from `~/.zshrc`:

```bash
sed -i "/alias ls=/d" ~/.zshrc
source ~/.zshrc
type ls
```

After that, `type ls` should point to a real binary — something like `/usr/bin/ls` or `/data/data/com.termux/files/usr/bin/ls`. No aliases.

## The General Lesson

When a tool behaves impossibly — when its output contradicts reality — do not trust it. Every debugging step I took for an hour assumed `ls` was truthful. It was not. Running `type ls` would have exposed the problem in two seconds.

The habit worth building: when output looks wrong, suspect the tool before you suspect the filesystem. Run `type <command>` first. If it is aliased or shadowed, that is often the whole story.

## A Checklist for Suspicious Commands

When a command is not behaving:

1. `type <command>` — is it what you think it is?
2. `command <command> <args>` — run the real binary, bypass aliases
3. `which <command>` — where does it resolve from?
4. `test -f <path>` / `test -d <path>` — verify existence independently
5. `stat <path>` — get raw metadata without interpretation
6. `find . -name "<filename>"` — locate by name across the tree

Any of these can break a silent failure loop. Together, they cover the common ways a command can be subtly wrong.

## The Part I Am Still Annoyed About

The alias had `2>/dev/null` in it, which suppressed errors. Whoever wrote it probably meant "hide the noise if `eza` is not installed." But because `eza` was installed and failing silently, the suppression turned a visible error into a hidden wrong answer.

Suppressing errors is sometimes reasonable. Suppressing errors on a command you use twenty times an hour is not.

If you have aliases with `2>/dev/null` in your config, this is a good moment to audit them.
