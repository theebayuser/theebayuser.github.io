# Handoff — round 21

Written for a session starting cold. Picks up after round 20 (the three number
treatments — `.vecf`, `.eqf`, `.railf` — replacing `.tabf`) and covers this round's
uncommitted work on top of it.

## Read first

[.interface-design/system.md](.interface-design/system.md) has the direction ("a living
preprint"), the depth strategy, the type scale, and detailed notes on every component
touched this round: the numbered signature entries 6, 20, 38, and the "Component
measurements" section's `.goals` / `.eqf-row` / `.implied` / `.sum` / `code` entries.

## Uncommitted right now

`git status` shows `js/site.js`, `css/paper.css`, `manim.html`, `lean.html`,
`projects.html`, `index.html`, `HANDOFF.md`, `.interface-design/system.md` modified,
and this file untracked. Nothing is committed.

## What this round did

1. **The bézier figure** (`manim.html`, `js/site.js`) — § 03 opened on the Lorenz
   attractor, the same drawing the homepage runs (`#figure-lorenz-home`), so the page's
   headline figure was a reprint. Replaced with `bezierWeave`: a cubic bézier drawn as
   the envelope of its own de Casteljau construction rather than stroked directly —
   many level-2 tangent segments swept across `t`, whose common envelope is the curve.
   The tangency claim was verified numerically before shipping (max deviation
   `1.2e-15`, floating-point exact) for the chosen control points. Id renamed
   `#figure-lorenz` → `#figure-bezier`; kept `fig. 12`, no renumbering. **Solid, tested,
   committable.**

2. **Lean's stale figures, refreshed** — `lean.html`'s Table 1 claimed 7,665 lines and
   394 theorems "counted July 2026"; the live repo at
   `/Users/danielliao/my_project` has grown to **10,707 lines, 509 theorems and
   lemmas** across 100 `.lean` files. Refreshed everywhere it appears: `.vecf`
   (`lean.html`), the catalog foot, and the homepage deskstack card (`index.html`).
   The catalog's "Four named obligations remain open" on Manuscript I was also stale —
   P2 is now sorry-free per the repo's own `docs/progress_tracker.md` — rewritten to say
   so and point at where the frontier actually is (P3, 7 obligations). **Solid, counts
   cross-checked against the source repo's own dashboard, committable.**

3. **The turnstile ledger** (`.goals`, lean.html) — fills the space beside `.vecf` with
   what Table 1 doesn't show: `⊢ 7` named obligations open (P3), `∎ 0` `sorry` in the
   classification (P2, end to end), `⊢ 32` trusted evaluations (`native_decide`, base
   cases 11–42). Colors matched to the existing goal panel exactly (`--ballpoint` /
   `--qed`), not invented. The third row is disclosure: the source repo's own rule is
   that a "machine-verified" claim needs its trust base stated, so the axiom count
   ships rather than being left off. **Solid, tested, committable.**

4. **The follower sum, worked** (`.sum`, manim.html) — `.reach` was a single 52,244
   with its evidence sixty lines below. Now the three addends (3,263 · 41,462 · 7,519)
   stack above the total, each with a share-of-total hairline underneath (Instagram is
   79% of the total and 12.7× TikTok, invisible in one number). `initLedger` re-derives
   all three from `data/socials.json`, the same file the total and foot ledger already
   read. **One real bug caught and fixed here**: the share bar was a flex child with no
   explicit width, so it collapsed to zero — fixed with `flex-wrap` on the row and a
   `calc()` width on the bar. **Solid, tested, committable.**

5. **Tri-Valley, three in a row** (`.eqf-row`, projects.html) — the three bounds
   (`≥ 25`, `≥ 2,000`, `≥ 100`) now sit side by side on one hairline instead of
   stacked, `≥` and figure sharing one cell so they stack as a unit above the label.
   Deliberately checked against the KPI-tile grid the site has now deleted twice
   (`.stats`, `.tabf`): what keeps this from being a third version is what's missing —
   no box, no fill, no tracked label — plus the `≥` itself. **Solid, tested,
   committable.**

6. **USAMO's implied column** (`.implied`, projects.html) — the ~200px empty to the
   right of the rail now holds the quotients its own counts imply: `200,000 ÷ 25,000 =
   8` visits a user, `25,000 ÷ 20 = 1,250` users a staff member (both exact), `993 ÷
   158 ≈ 6.3` problems a section. Fitting a third column inside 876px cost the reel and
   rail some width (300→270, 340→296); re-measured against the rendered DOM afterward
   to confirm the rail's own labels still don't overlap at 296px. **Solid, tested,
   committable.**

## What was verified, and how

Every truth claim was checked before it was captioned, not after — the site's own
rule ("Figures must be true"):

- The bézier's tangency claim: sampled `t` across [0,1], level-2 segment direction vs.
  `B'(t)`, max deviation `1.2e-15`.
- The Lean counts: recounted directly against `/Users/danielliao/my_project` and
  cross-checked against that repo's own `docs/progress_tracker.md` (updated the same
  day), not just against my own grep.
- The follower sum: `3,263 + 41,462 + 7,519 = 52,244`, and the three share percentages
  sum to 100.00%.
- The three implied quotients: two are exact (`200,000 ÷ 25,000`, `25,000 ÷ 20`, both
  divide with zero remainder) and marked `=`; the third is a genuine ratio and kept `≈`.

Then the layout and contract sweep, **measuring the rendered DOM rather than
eyeballing**, at 1280/760/500, both palettes, print, reduced-motion, no-JS:

- No new element overflows its container at any tested width (`.showcase`'s three
  columns fit inside 876px with the reel still exactly 4:5).
- Night board flips every new component: the bézier through `palette()`, the goals
  ledger's turnstile and qed marks, the rail marks, the sum's bars, the eqf-row and
  implied figures — ink lands on the correct side of the paper in both palettes.
- `prefers-reduced-motion`: the bézier paints its full weave as a static final frame;
  the sum settles to its exact figures with no animation.
- No-JS: every new figure ships correct static text in the HTML source (grepped
  directly, not inferred) — the sum, the goals ledger, the implied column, and all
  `data-count` targets.
- Print: the eqf-row and the three-column showcase both hold their layout.
- Console clean on all three touched pages (`Uncaught` grepped for specifically; the
  GPU shared-image warnings in headless Chrome's own log are compositor noise, not
  page errors).

## Two things still open

1. **375px is unverified**, same limitation as last round: headless Chrome clamps its
   layout viewport at 500px. The narrowest confirmed width for all of this round's new
   components is 500px. Check on a real phone before treating this as final,
   particularly `.eqf-row`'s collapse and the goals ledger's label wrapping.
2. **The reel still prints as a solid black rectangle** (pre-existing, flagged last
   round, not touched this round either). `@media print` hides `video` but not `.reel`,
   which keeps its `--film` background. Two rounds now without a decision: print
   `.reel` as a border only, or hide it and let the caption carry the plate.

## Standing conventions worth knowing before editing further

- No shadows anywhere, radius 0 throughout, hairline borders in three weights
  (`--rule-soft` / `--rule` / `--rule-strong`).
- One accent (`--ballpoint`), rationed semantic colors (`--qed` green, `--laurel`
  gold). Match new color use to an *existing* established meaning before inventing one
  — the goals ledger's turnstile/qed colors were pulled from the goal panel's own CSS,
  not chosen fresh.
- Every canvas figure reads color through `palette()`, never a literal hex — the
  bézier weave included, since it draws on `<canvas>` like every other plotted figure.
  DOM-based figures (`.railf`, `.sum-bar`) read CSS custom properties directly instead
  and need no `palette()`/`onRepaint()` call at all.
- Figures caption below (`fig. N`, one global sequence, currently a clean 1–20); tables
  caption above (`Table N`, currently just 1 and 2 — `Table 3` was retired in round 20
  when it became a figure).
- Every progressive-enhancement JS feature ships a complete static/no-JS fallback and
  fails open. Verify this by grepping the raw HTML source for the real final values,
  not by disabling JS in a headless browser and trusting an empty dump (that failed
  silently this round — `--blink-settings=scriptEnabled=false` combined with
  `--dump-dom` returned nothing rather than an error).
- When refreshing a measured figure (line counts, theorem counts, follower counts),
  recount from the actual source, don't just edit the number in place — this round
  found the site's own headline Lean count was 40% low because it had never been
  updated since the library grew.
