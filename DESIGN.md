# DESIGN.md — brianscaturro.com design system

> The token system the custom theme is built from (Phase 5). Dark-first; light is
> a token swap. Every color and type decision in the CSS should trace back to this
> file. Companion to `CLAUDE.md` (durable facts) and `HANDOFF.md` (the why).

## Brief

- **Subject:** the personal blog of Brian Scaturro — an AI + Clojure engineer.
- **Audience:** sharp technical prospects (founders, CTOs) evaluating him for freelance
  work, plus engineers who came for a deep essay.
- **The page's one job:** make a prospect think *"I want whoever made this."* The medium
  is the pitch.
- **Fixed constraints:** dark-first (light supported as a token swap, OS `prefers-color-scheme`
  only); custom theme replacing `terminal`; the **per-post AI-generated video cover is the
  signature**; covers committed to each post bundle.

## Concept — "Screening room"

The site is a quiet, near-neutral dark room. **Each post opens with its cinematic
generative cover — full-bleed, edge to edge — and that cover is the only saturated color
on the page.** Everything else (type, chrome, links) is hushed and disciplined so the
moving cover is unmistakably *the* event. The cover is a **full-width cinemascope band**
that fades into the page (no frame, no hard edge); the post title is set like a **film
title card** in a dramatic editorial serif, large, on the neutral page just beneath it.

This is the brief's core discipline made literal: spend all boldness in one place (the
video), and let the rest be precise and calm. It also solves a real problem — covers will
vary wildly in hue post to post, so the page itself must be chromatically neutral to frame
*any* of them without clashing.

## Color tokens

Dark is the designed-for default; light is the same structure with swapped values. Driven
entirely by CSS custom properties so light is a token swap, not a parallel stylesheet.

### Dark (primary)

| Token            | Hex       | Role                                                   |
|------------------|-----------|--------------------------------------------------------|
| `--ink`          | `#0C0E12` | Page background. Near-black with a faint cool cast — not flat `#000`. |
| `--surface`      | `#14171C` | Raised surfaces: code blocks, cards, the cover well.   |
| `--line`         | `#232830` | Hairline borders, dividers, rules.                     |
| `--text`         | `#E7E9EC` | Primary reading text. Soft off-white, never pure `#FFF` (less glare). |
| `--text-dim`     | `#9AA1A9` | Meta, captions, mono labels, secondary text.           |
| `--accent`       | `#9D8DF1` | The single chromatic whisper — **muted iris**. Links, focus ring, small markers only. |
| `--accent-hover` | `#BBB0FF` | Link/marker hover + focus emphasis.                    |

The accent is deliberately a *muted iris* (a nod to "latent space," the generative world the
covers come from) — explicitly **not** a bright acid-green/vermilion, and **not** the
inherited terminal orange. It appears only on interactive affordances; it never decorates.

### Light (supported)

| Token            | Hex       | Role                                              |
|------------------|-----------|---------------------------------------------------|
| `--ink`          | `#F4F5F6` | Page background. A clean neutral paper — pointedly **not** the cream `#F4F1EA`. |
| `--surface`      | `#FFFFFF` | Raised surfaces.                                  |
| `--line`         | `#DEE2E6` | Borders, dividers.                                |
| `--text`         | `#15181C` | Primary text.                                     |
| `--text-dim`     | `#5C636B` | Secondary text.                                   |
| `--accent`       | `#5B49C9` | Iris, darkened for AA contrast on light.          |
| `--accent-hover` | `#3F2FA6` | Hover.                                            |

## Type

Three roles. The personality lives in the display face; the body stays fast and legible;
mono is demoted to a utility role (a quiet nod to the terminal roots, no longer the whole
outfit).

| Role        | Typeface                | Usage                                                        |
|-------------|-------------------------|-------------------------------------------------------------|
| **Display** | **Instrument Serif** (400 + italic) | Post titles ("title cards"), the site wordmark, big headings. Dramatic, high-contrast, editorial. |
| **Body**    | **Hanken Grotesk** (400/500/600)    | All reading prose, UI text. Humanist, warm, built for fast long-form reading. |
| **Mono**    | **IBM Plex Mono** (400/500)         | Code blocks, inline code, and small UPPERCASE eyebrow labels (dates, tags, kickers). |

Self-hosted as `woff2` in the theme (no FOUC, no third-party request, no layout shift).

**Scale** (fluid where it helps; `rem` base = 16px):

```
title card   clamp(2.5rem, 6vw, 4rem)   Instrument Serif 400, line-height 1.05
h2           1.6rem                      Instrument Serif 400
h3           1.2rem                      Hanken Grotesk 600
body         1.125rem (18px)             Hanken Grotesk 400, line-height 1.7
small/label  0.78rem                     IBM Plex Mono 500, UPPERCASE, letter-spacing .08em
measure      ~66ch reading column
```

## Layout

A single centered reading column for prose; the cover hero is allowed to breathe slightly
wider than the text for cinematic effect. Generous vertical rhythm, restraint everywhere
that isn't the cover.

**Single post** — the cover is a full-bleed cinemascope band that fades into the page; the
title card and the first lines of the essay sit above the fold (chosen treatment "B"):

```
┌───────────────────────────────────────────────────────────┐  ← cover-hero: FULL-BLEED
│                                                           │     cinemascope band, 21:9,
│                  [ video cover ]                          │     max-height ~72vh, no frame,
│                                                           │     the only color on the page
└── soft fade into --ink (no hard edge) ────────────────────┘
              CLOJURE · REALTIME · AI · 2025                   ← mono eyebrow (dim)

              Cogs: Agents as Channels                        ← Instrument Serif "title card"
              Brian Scaturro                                  ← body, dim
              ─────────────────────────────────              ← hairline (--line)
              Long-form essay in a ~66ch column,              ← body begins above the fold
              Hanken Grotesk at 18px / 1.7. Code in
              IBM Plex Mono on --surface blocks.
```

The cover band runs the full viewport width; the title and prose return to the centered
~66ch reading column beneath it.

**Home / list** — a quiet index; each post is a row, its poster still as a small thumbnail
(stills only, never autoplaying video in a list — performance + the "one event" rule):

```
   Brian Scaturro                                        ← wordmark (Instrument Serif)
   Essays on software, languages, and the tools we build ← subtitle (body, dim)

   ──────────────────────────────────────────────────

   ┌──────┐   Cogs: Agents as Channels                   ← title (Instrument Serif)
   │poster│   CLOJURE · AI · 2025-12-01                  ← mono eyebrow (dim)
   └──────┘   A deep dive into treating LLM agents…      ← description (body, dim)

   ┌──────┐   Next post title…
   │poster│   …
   └──────┘
```

## Signature

The per-post **video cover** (already prototyped: poster-first, lazy, reduced-motion-safe)
rendered as a **full-bleed cinemascope band that fades into the page**, **plus** the
typographic "title card" treatment just beneath it, **plus** the rule that *the cover is the
only color on an otherwise neutral page*. The three together are what the site is remembered
by.

### Hero spec (chosen treatment: "B — cinemascope band")

- **Full viewport width**, breaking out of the reading column; the title and prose return to
  the ~66ch column below.
- **Aspect ratio 21:9**, `max-height: ~72vh` so the title card and the first lines of the
  essay stay above the fold (it reads as a writing site, not a splash page).
- **No frame, no border-radius.** A soft `linear-gradient(transparent → --ink)` fade (~140px)
  at the bottom edge so the cover melts into the page instead of looking boundary-less in
  dark mode.
- **Poster-first / lazy / reduced-motion** guardrails unchanged from the prototype.
- **Responsive `srcset`** on the poster (full-width = large LCP element); serve ~1440/2160/2880
  widths and compress. Keep LCP fast.
- **Source covers** are 16:9 today (center-cropped by `object-fit: cover` to the 21:9 band);
  ideally author future covers at ~21:9 so nothing important lives in the cropped top/bottom.
- **Mobile:** the band keeps full width; cap height (e.g. `max-height: 56vh`) so it doesn't
  dominate a small screen.

## The one deliberate risk

**A near-colorless page.** I'm desaturating the entire site to a neutral dark (and neutral
light) and letting each post's cover supply all the chroma — down to using only a single
muted-iris whisper for links. Most dev blogs reach for an identity *color*; this one refuses
one on purpose, so the moving cover owns every drop of color. It's a risk because a colorless
page can feel austere — mitigated by warm-soft (not stark) neutrals, the editorial serif's
character, and the cover doing the emotional work.

## Self-critique vs. the three AI-default looks

The `frontend-design` skill flags three clusters. Checking each:

1. **Cream + high-contrast serif + terracotta** — actively avoided. Light mode is a clean
   *neutral* paper (`#F4F5F6`), explicitly not cream; the accent is iris, not terracotta.
   (The current terminal theme flirts with this — we are leaving, not returning.)
2. **Near-black + single bright acid accent** — this is the trap dark-first sits next to, so
   the differentiation is deliberate: the accent is a *muted* iris (not neon acid/vermilion),
   it's used only for interaction, the ink is a considered layered neutral (not flat
   `#0a0a0a`), and the identity comes from an editorial title-card + a per-post video gallery
   rather than from the accent. The structure rhymes with the default; the execution and point
   of view don't.
3. **Broadsheet hairline rules + zero radius + dense columns** — avoided. One generous reading
   column (not multi-column), rounded cover well, hairlines used sparingly as structure (one
   rule under the title), not as a newspaper motif.

## Small open choices (reversible, your taste)

1. **Body face:** Hanken Grotesk (crisp sans, recommended) vs. a literary serif reading face
   (e.g. Literata) for a warmer, more "essays" feel. Sans is the safer, more modern-technical
   read; serif leans literary.
2. **Mono face:** IBM Plex Mono (workhorse) vs. a more characterful mono (e.g. Commit Mono).
3. **Accent presence:** keep the muted-iris accent, or go fully colorless (links via underline
   + weight only, zero hue on the page) for the purest version of the risk.

## What Phase 5 builds from this

- New `layouts/` (baseof, single, home/list, header, footer, head) + `assets/css/` driven by
  these tokens; retire the `terminal` submodule.
- Self-host the three font families.
- Restyle code highlighting (Chroma) to a muted scheme from this palette — not the default
  neon (Monokai/Dracula).
- Re-home the proven `cover-hero` seam into the new single template.
- Sweep the polish backlog (`og-image.png`, `apple-touch-icon.png`, GA tracking ID, favicons).
