---
title: "A Checklist for Silent Command Failures"
description: "Commands that return wrong output without erroring are the hardest bugs to catch. Here is a reusable checklist for diagnosing them."
pubDate: 2026-10-01
author: "Dase-pop"
category: "Tooling"
tags: ["shell", "debugging", "reference"]
---

Most bugs fail loudly. They print errors, exit with a non-zero code, or crash. You see them immediately and fix them.

The bugs that cost the most time are the ones that fail silently — commands that return plausible-looking output that is simply wrong. You trust the output, act on it, and only later realize nothing was what it seemed.

This is a checklist for that situation. It works for shell commands, scripts, and any tool whose output you rely on.

## The Symptoms

You know you are in this territory when:

- A command produces output that contradicts other evidence (a file exists but `ls` does not show it)
- Repeating the same command produces the same wrong result every time
- A different tool confirms the filesystem is fine, but one specific command disagrees
- The error message is absent where you would expect one

If the tool is behaving impossibly, do not assume you are wrong. Assume the tool is.

## Step 1: `type` — What Is This Command Actually?

```bash
type <command>
```

This answers the most fundamental question: is the command you are running the command you think it is?

It can return:

- `command is /usr/bin/command` — a real binary. Good.
- `command is a shell builtin` — a shell built-in. Also fine.
- `command is aliased to ...` — an alias is overriding the binary.
- `command is a function` — a shell function is overriding it.
- `command is hashed (/path/to/command)` — the shell cached the path to the binary.

The alias and function cases are where silent failures live. An alias can add flags, suppress errors, or call an entirely different tool.

Example of a broken alias:

```
$ type ls
ls is an alias for eza --icons 2>/dev/null || ls --color=auto
```

That alias silently replaces `ls` with `eza`, redirects all errors to `/dev/null`, and only falls back to real `ls` if `eza` exits with an error. If `eza` exits successfully but produces wrong output, you never see the fallback.

## Step 2: `command` — Run the Real Binary

```bash
command <command> <args>
```

The `command` prefix tells the shell to run the literal binary, ignoring aliases and functions.

```
$ ls -la src/
(wrong output)

$ command ls -la src/
(correct output)
```

If `command ls` works and `ls` does not, you have found an alias or function problem. Use `command` as a workaround while you track down the source.

## Step 3: `which` and `command -v` — Where Does It Resolve?

```bash
which <command>
command -v <command>
```

Both tell you what path the shell would run for a given command. `command -v` is the POSIX-standard version and also catches builtins and aliases. `which` is the older, more widely known one.

This is useful when the command is not aliased but still runs the wrong binary — for example, when a tool installed in `~/.local/bin` is shadowed by an older version in `/usr/bin`.

## Step 4: `test` — Ask Yes-or-No Questions

```bash
test -f <path> && echo "file exists" || echo "file missing"
test -d <path> && echo "dir exists" || echo "dir missing"
test -r <path> && echo "readable" || echo "not readable"
test -x <path> && echo "executable" || echo "not executable"
```

`test` does not produce formatted output. It returns an exit code and nothing else. This makes it immune to the class of bug that affects display commands like `ls` — there is no listing to be formatted wrongly.

When you need a definitive yes or no from the shell, `test` is the tool.

## Step 5: `stat` — Get Raw Filesystem Metadata

```bash
stat <path>
```

`stat` queries the kernel directly and returns structured metadata: size, permissions, inode, timestamps, owner, group. It does not format a directory listing.

Example output:

```
  File: src/
  Size: 4096       Blocks: 8       IO Block: 4096   directory
Device: 803h/2051d Inode: 1234567     Links: 5
Access: (0755/drwxr-xr-x)  Uid: ( 1000/   user)  Gid: ( 1000/   user)
```

If `stat` returns real metadata, the path exists. No interpretation required.

## Step 6: `find` — Locate by Name Independently

```bash
find . -name "<filename>"
```

If you are not sure where a file went, `find` walks the tree by name. It does not depend on directory listings or shell state.

A common pattern:

```bash
find . -name "*.md" -not -path "*/node_modules/*"
```

The `-not -path` filter excludes noisy directories. This is often the fastest way to answer "where is this file?" when `ls` is misbehaving.

## Step 7: The Environment Itself

Sometimes the problem is not a command but the environment it runs in.

```bash
echo $PATH
env
```

`echo $PATH` shows the order in which the shell searches for binaries. If a directory with an old version of a tool appears earlier than the directory with the new version, the old one wins.

`env` prints every environment variable. Useful for checking things like `NODE_ENV`, `PYTHONPATH`, or `SHELLOPTS` that can change behavior without you noticing.

## The Full Checklist

When a command is silently wrong:

1. `type <command>` — is it aliased or a function?
2. `command <command> <args>` — run the real binary
3. `which <command>` / `command -v <command>` — where does it resolve?
4. `test -f <path>` / `test -d <path>` — verify existence
5. `stat <path>` — get raw metadata
6. `find . -name "<file>"` — locate independently
7. `echo $PATH` / `env` — check the environment

This list covers the common ways a command can be subtly wrong: alias overrides, function overrides, PATH shadowing, environment drift, and broken display tools.

## The Meta Lesson

When a tool contradicts reality, suspect the tool first. Not every command is trustworthy, and the ones that fail silently are the hardest to catch.

The habit worth building is not memorizing this list but internalizing the first move: `type <command>`. If it is aliased or shadowed, that is often the whole story.

If a problem persists past that check, work down the list. By step 5 or 6, you will have enough independent evidence to know whether the filesystem or the tool is lying.

## When to Stop Debugging the Tool

At some point, the tool is not the problem. If `type`, `command`, `test`, and `stat` all agree, and the tool still disagrees, the tool has a genuine bug — and it is worth reporting or replacing rather than debugging.

The checklist above is for confirming which side is right. Once you know, move on to the fix.
