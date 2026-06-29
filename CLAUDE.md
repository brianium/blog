# brianscaturro.com — personal blog

## Overview

A [Hugo](https://gohugo.io) static blog published at **https://brianscaturro.com**.
Source of truth: `github.com:brianium/blog`. The author writes posts in markdown;
the long-term aesthetic direction is a **minimal, dark-first reading experience whose
one signature element is a unique AI-generated video cover per post** (see
"Design direction" below).

This repo predates active Claude Code use — treat the current theme as the
*starting point we are evolving from*, not a finished design to preserve.

## Local development

The theme is a **git submodule** and is NOT checked out by default. A fresh clone
cannot build until it is initialized:

```bash
git submodule update --init --recursive   # REQUIRED before first build
hugo server -D                             # local preview with drafts, http://localhost:1313
hugo                                       # production build into ./public (gitignored)
```

If `hugo server` errors with a missing-theme / missing-layout message, the submodule
is the cause 90% of the time — re-run the `submodule update` line.

`hugo` is not assumed to be installed in every environment; install via `brew install hugo`
(the extended edition) if missing.

## Repository layout

```
hugo.toml                     # site config (baseURL, params, theme = "terminal")
content/posts/<slug>/index.md # one page bundle per post (markdown + its assets)
layouts/partials/head.html    # LOCAL override of the theme's <head> (see "Dark/light")
static/                       # served verbatim at site root
themes/terminal/              # git submodule: panr/hugo-theme-terminal (the base theme)
archetypes/                   # `hugo new` templates
deploy.lol                    # a joke file — NOT a real deploy mechanism (see "Deploy")
```

Posts are **page bundles**: each post is a directory under `content/posts/` containing
`index.md` plus its own images/gifs/covers, referenced by filename in front matter.

## Dark / light mode

Dark/light is driven by the **OS `prefers-color-scheme` setting** — there is no
in-page toggle. The mechanism lives in `layouts/partials/head.html`, which overrides
the theme's head to load two stylesheets and two favicons gated by media query:

```
static/terminal-dark.css    media="(prefers-color-scheme: dark)"   ← primary
static/terminal-light.css   media="(prefers-color-scheme: light)"
static/favicon-dark.png  /  static/favicon-light.png
```

**Dark is the primary experience; light is a supported alternate.** When changing the
design, treat both as first-class: prefer driving colors through CSS custom properties
so light is a token swap rather than a parallel hand-maintained stylesheet. The head
override also conditionally loads `static/style.css`, `static/og-image.png`, and
`apple-touch-icon.png` if present (all currently absent — safe no-ops).

## Authoring a post

```bash
hugo new posts/my-post-slug/index.md
```

Front matter is TOML (`+++` fences). Real example in
`content/posts/cogs-agents-as-channels/index.md`:

```toml
+++
title = "Cogs: Agents as Channels"
date = "2025-12-01T10:58:42-05:00"
author = "Brian Scaturro"
cover = "channel.gif"          # filename relative to this post's bundle dir
tags = ["clojure", "realtime", "ai"]
description = "..."            # used for SEO meta + OG description
showFullContent = false
+++
```

Drop cover/inline images into the same directory as `index.md` and reference them by
filename. The `cover` value is also used as the Open Graph image.

## Design direction (north star)

The blog is, intentionally, a freelance-credibility artifact: the medium is part of the
pitch. The plan:

- **Quiet, accessible reading body** — a real reading typeface (not monospace) for prose;
  monospace reserved for code and small labels. Calm, legible, fast.
- **One signature: a per-post AI-generated video cover** produced by the `storyboard`
  pipeline in the `ascolais` monorepo. This is where visual boldness is spent; everything
  around it stays disciplined.
- **Video-cover guardrails (non-negotiable):**
  - **Poster-frame first** — render a still image as the real cover; the video lazy-loads
    *over* it so text and LCP are fast before any video byte arrives.
  - **`prefers-reduced-motion: reduce` → show the poster only**, never autoplay.
  - **Contained hero, not full-page background** — a cinematic window at the top of the
    post, then plain readable markdown.
  - Muted, looping, short (~5s), `playsinline`.
- **Keep Hugo.** It handles SEO/RSS/feeds/markup well; do not rebuild the publishing
  pipeline. Design work happens in the theme/layout layer.

No automation to start — covers are produced by hand per post until the workflow is proven.

## Deploy

Published via **Cloudflare Pages**, connected to this GitHub repo. Cloudflare runs the
Hugo build on push and serves the result at `brianscaturro.com` — there is intentionally
no CI workflow or host config in the repo (`deploy.lol` is just a joke file). Implications:

- **A push to the production branch (`main`) goes live.** Branch for non-trivial work and
  preview locally with `hugo server` before merging.
- **Build settings live in the Cloudflare Pages dashboard, not the repo** — build command
  (`hugo`), output dir (`public`), and crucially the **`HUGO_VERSION` env var** and
  **submodule checkout** (Cloudflare must clone submodules, or the theme build fails the
  same way a local fresh clone does). If a build breaks, check the dashboard build log and
  these settings first.
- Pull requests / non-production branches get **Cloudflare preview deployments** with their
  own URLs — useful for reviewing a redesign before it touches the live domain.

## Commits

Conventional commits (`feat:`, `fix:`, `docs:`, `style:`, `chore:`). Branch for
non-trivial work rather than committing straight to `main`. Commit/push only when asked.
