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

**One palette, no dark sections.** An earlier version broke the animations page onto a
Manim blackboard; it was cut deliberately. The whole site is paper. Two exceptions, both
narrow: the **night board**, a hidden whole-site mode on the `b` key that remaps every
token at once (`html.board`), so the page is still one palette, just a different one; and
`--film`, the near-black inside a video frame, which is the film's own background rather
than a design choice. Neither licenses a dark band anywhere else.

**Canvas colour rule.** A canvas cannot read CSS variables, so no figure may hardcode a
hex value. `palette()` reads the tokens off the document once and hands them out;
flipping the board clears the cache and calls every registered repaint. Register static
figures with `onRepaint(fn)`; plotters register themselves. Break this and the night board
silently leaves black ink on a black board. Plotted figures use
`--ballpoint` for the drawn line, `rgba(33,30,23,.12)` for construction guides, and
`--laurel` for the moving point, which are the ink equivalents of Manim's chalk blue and
yellow and stay legible on warm stock.

## Prose

**No em dashes anywhere in site copy.** Use commas or parentheses for asides, a colon
before a summary, or a full stop and a new sentence. The en dash stays, but only for
names (Thue–Morse) and ranges (2025–26).

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
6. **Plotted ink figures** — a bare `.canvas-wrap` with **no frame and no fill**, since
   the drawings are ink and ink does not come in a box, plus a mono `fig. N · caption`
   beneath. Each draws itself like a pen plotter: a faint full guide underneath, the
   ballpoint line tracing over it, a laurel mark at the pen. Deltoid and Lorenz on
   animations, the Thue–Morse difference table on formalization, Ulam's spiral on the
   index, the Mandelbrot on 404.
7. **Contents filed among the primes** — on the index the spiral *is* the contents. The
   numerals are absolutely positioned onto six real primes (`.ulam-node`, paper backplate,
   hairline ring, 44px hit area via `::after`) and are **real links**, not decoration. A
   compact `.toc-line` legend sits beneath as the plain-text equivalent and the no-JS
   fallback; hovering either side lights the other through `.is-hot`. Separation between
   numerals scales with the figure (`pickAnchors(…, side)`); a fixed pixel threshold
   strands them on a narrow viewport.
8. **The prerequisite graph as navigation** (education) — every node is a real `<button>`
   over a canvas of curved edges, and selecting one fills a `.node-pop` card with dates, a
   line, and a jump link into the section below. Wide, it reads as two chains meeting.
   Under 560px the identical graph relayouts to one column in chronological order, chips
   centred on the nodes and edges bowed out to the side. Chip x is clamped to the figure,
   or a label near an edge hangs off it.
9. **The ledger** — hand-kept counts as an account book: mono platform label, handle,
   figure right-aligned in tabular numerals. Never a dashboard tile. A count of zero means
   "not written down yet" and keeps the dash.
10. **The epigraph** (`.quote`) — rules above and below, the line at 23px italic, the
    attribution in small tracked mono. At most once per page, where a chapter opens.
11. **The footer** — an offprint's last page, not a sitemap: signature and an epigraph on
    the left, the numbered contents in two hairline-ruled columns on the right, one meta
    rule beneath carrying `currently ·` and the key map. No colophon boilerplate about
    which typefaces were used; the page itself is the evidence.
12. **Film plates** — a real `<video>` in the frame, `object-fit: contain` over `--film`,
    the single dark token and the one place a dark surface is allowed. Manim renders on
    black, so a vertical reel is letterboxed against its own ground, never cropped and
    never matted onto paper.
13. **Link marks** — contact buttons carry a 15px inline SVG in `currentColor`, inheriting
    `--ink-3` and turning ballpoint on hover. Real brand marks; never emoji.

## Figures must be true

Every caption is a claim, on a site whose whole argument is that this person checks
things. Verify the mathematics before writing the caption, not after.

A worked example worth keeping: an earlier Thue–Morse *turtle* figure was going to be
captioned as the Koch snowflake, on the strength of a half-remembered result. Simulating
it first showed the path drifts without bound at every turn angle tried, so the claim was
false and the figure was cut. What replaced it is the **Thue–Morse difference table**
(ink cell (i, j) when t(i) ≠ t(j)), where every claim in the caption was checked in the
browser first: the cell equals t(i xor j) because digit-sum parity adds under xor, each
quadrant is the whole picture one size down, and the ink density is exactly one half.
Render at n = 32, not 64; at 64 the nesting is too fine to read at figure size.

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

Restrained on purpose. `transform` and `opacity` only, `cubic-bezier(0.23, 1, 0.32, 1)`,
one-shot, never replayed.

- **Scroll reveals** on section heads and theorem cards only: 380ms, 12px rise, 50ms
  stagger between siblings of a `[data-reveal-group]`. Nothing else on the page moves.
- **Thue–Morse rules draw in** tick by tick on first view, 14ms apart.
- **Index title block** staggers kicker → name → byline → affiliation at 80ms steps, once
  on load. This is the only entrance animation on the site.
- **Plotted figures** are the sole continuous motion: they pause off-screen and render one
  static complete drawing under `prefers-reduced-motion`.

**The reveal contract, which is not optional.** Hiding content in CSS and revealing it in
JS means any failure leaves text permanently invisible, so every mechanism fails open:

- JS adds the hidden class; without JS nothing is ever hidden.
- Reveals do not engage at all when `document.visibilityState === "hidden"`, because
  observers and transitions are throttled in background tabs and would strand text at
  opacity 0.
- After revealing, the animation classes are **removed**, so elements rest at their
  natural styles rather than depending on a transition having completed.
- A global 8s timer clears any remaining reveal state as a last resort.
- The title block reveals on rAF *and* a 400ms timer, then drops its classes at 1400ms.

The same rule governs the widgets, which are all progressive enhancement over complete
HTML:

- **Goal panel** ships the closed proof. JS only ever *hides* the result and offers a
  button to bring it back, so no-JS readers see a finished proof rather than a broken one.
- **Morphism widget** ships six static generations; JS replaces them with the interactive
  version. Cap at generation 8 (256 letters), and the output needs `pre-wrap` +
  `break-all` or a 256-character line blows out the mobile layout.
- **Count-up** ships the real numbers in the HTML and refuses to run in a hidden tab; a
  1.5s timer restores the exact string if rAF never fires.
- **Reading-progress bar** updates *synchronously* in a passive scroll listener rather
  than through rAF, because throttled rAF would freeze it. `scrollHeight` is cached on
  resize so the handler stays arithmetic plus one style write.
- **Ledger** ships dashes in the HTML and fills them from `data/socials.json`. A failed
  fetch leaves the dashes and every link still works. Numbers nobody can verify live are
  stamped with the date they were true instead of being faked as live.

Three canvas bugs worth not reintroducing: `stop()` must `cancelAnimationFrame` **and**
null the handle, or `start()` sees a stale handle and the figure deadlocks; `paint(0)`
must run once at init so a frame is never blank; and a figure whose progress-0 state draws
nothing (the Lorenz) needs a faint full-path guide underneath, or its frame sits empty
until it animates.

**A fourth, and the nastiest: a page can boot invisible.** In a background tab every
measurement is zero, so anything positioned from the DOM (the spiral numerals, the graph
chips) lands against nothing and stays there, because no resize event ever follows. Two
defences, both required: any layout function bails when its canvas measures under 40px
rather than committing a garbage position, and `visibilitychange` calls `repaintAll()` the
first time the page is actually looked at.

## Consistency rules

- Spacing values come from `--s1`…`--s8`. No arbitrary px.
- Colors come from the tokens. No literal hex in the HTML.
- One accent. If something needs to stand out and blue is taken, use weight or space.
- Radius stays 0. Shadows stay absent.
- No emoji anywhere; the math glyphs (∎ ⊢ § ⟨⟩) carry the character.
- No em dashes in copy. See Prose above.
- No dark sections. One paper palette across every page.
- Every placeholder is `<span class="fill">`, so unfilled content is visible, never plausible.
