# Design system — "a living preprint"

## Direction and feel

The site reads like a beautifully typeset mathematics preprint on warm stock: a LaTeX
title block with an abstract, numbered sections, theorem environments instead of project
cards, and hairline rules instead of boxes. The animation section breaks to a Manim
blackboard — the one deliberate tonal shift, earned because that is the surface those
films are actually drawn on.

Rejected defaults, on purpose: the gradient hero, the identical icon-card project grid,
the skill-percentage bars. Each was replaced by something the content itself supplies
(a real abstract, numbered environments with honest status, counted statistics).

## Depth strategy

**Hairline borders only.** No shadows anywhere, in either theme. `border-radius: 0`
throughout — print does not round corners, and the one place softness creeps in is the
first place the preprint illusion breaks.

Rules come in three weights and mean different things: `--rule-soft` separates rows
inside a group, `--rule` bounds a section or component, `--rule-strong` is emphasis
(button borders, the tick marks).

## Spacing

Base unit **8px**; every value is a multiple, exposed as `--s1`…`--s8` (8/16/24/32/48/64/88/104).
Density is airy on purpose — sections breathe at 88px, cards pad at 24px. Reading measure
is capped at `68ch` via `.prose`; the page grid is 940px.

## Type

- **STIX Two Text** for everything editorial (it is a Times/STIX cut designed for math
  typesetting — the point of the whole direction), fallback Iowan Old Style → Palatino → Georgia.
- **IBM Plex Mono** for kickers, nav, metadata, code, and statuses.
- Scale ×1.25 off a 17px body: `11.5 label · 13 meta · 17 body · 21 h3 · 26 h2 · 33 h1 ·
  clamp(40–58) display`.
- Hierarchy uses **three levers together** — size, weight (400/600 only), and one of four
  ink levels. Never size alone.
- Display type carries −0.02em tracking; mono kickers are uppercase at +0.14em. All
  numbers are `tabular-nums`.

## Color

60/30/10 — paper, ink, and one accent. `--ballpoint` (#2358A7) is the *only* accent and
appears on links and interactive affordances alone. Two semantic colors are rationed:
`--qed` green marks machine-checked or complete, `--laurel` gold is reserved for awards.
Everything else is the paper/ink ramp.

Ink has four levels (`--ink`, `--ink-2`, `--ink-3`, `--ink-4`) — primary, supporting,
metadata, disabled. Using only two flattens the hierarchy.

The blackboard palette is separate and scoped to `.board`: `--board` #101319 with
`--chalk-blue` #58C4DD (Manim's BLUE_C) and `--chalk-yellow` #FFD866.

## Signature elements

Each appears on more than one page — that is what makes it a signature rather than a flourish.

1. **Thue–Morse tick strips** as section dividers. Generated in JS from the parity of
   the binary digit sum: filled tick for 1, hollow for 0. It is one of his own formalized
   theorems used as ornament. `<div class="tm" data-n="24"></div>`
2. **Theorem environments** — run-in bold kind, italic parenthetical name, mono status
   pinned right (`✓ machine-checked` green, `⋯ in progress` gray, `∎` complete).
   Bordered top and bottom by hairlines, never boxed.
3. **Abstract block** — hairline rules above and below, run-in bold-italic "Abstract.",
   mono Keywords line beneath.
4. **Dot-leader contents list** — section number, title, dotted leader, action word.
5. **Lean goal-state panel** — mono, inset fill, `⊢` in ballpoint, closing on a green
   `No goals. ∎`.
6. **Blackboard interlude** — full-bleed dark band with the live canvas figure.
7. **Colophon ending in ∎**.

## Component measurements

- `Nav link` — 13px mono · 12px 10px pad · 40px min height · active gets
  `inset 0 -2px 0 var(--ballpoint)`, never a filled pill
- `.btn` — 40px min height/width · 0 14px pad · 1px `--rule-strong` border ·
  `:active scale(0.97)`
- `.env` (theorem card) — 24px vertical pad · hairline top · body capped at 68ch · 16px body
- `.stat` — 30px/600 value with tabular numerals · 11.5px uppercase mono key ·
  grid gapped by 1px over a `--rule` background, so the dividers *are* the gap
- `.plate-frame` — 16:9, inset fill, mono placeholder label
- `.show-frame` — 3:2, images `object-fit: cover` with a 1px inset
  `rgba(0,0,0,0.1)` outline
- `.canvas-wrap` — 4:3, 1px `--board-rule`, canvas DPR-scaled in JS

## Motion

Transitions ≤220ms on `transform`/`opacity` and color only, `cubic-bezier(0.23, 1, 0.32, 1)`.
Nothing animates on entrance. The canvas figure is the sole continuous motion on the site;
it pauses via `IntersectionObserver` when off-screen and renders one static complete curve
under `prefers-reduced-motion`, which the media query also enforces globally.

Two bugs worth not reintroducing: `stop()` must `cancelAnimationFrame` **and** null the
handle, or `start()` sees a stale handle and the figure deadlocks; and `draw(0)` must run
once at init so the frame is never blank before the first animation frame.

## Consistency rules

- Spacing values come from `--s1`…`--s8`. No arbitrary px.
- Colors come from the tokens. No literal hex in the HTML.
- One accent. If something needs to stand out and blue is taken, use weight or space.
- Radius stays 0. Shadows stay absent.
- No emoji anywhere — the math glyphs (∎ ⊢ § ⟨⟩) carry the character.
- Every placeholder is `<span class="fill">`, so unfilled content is visible, never plausible.
