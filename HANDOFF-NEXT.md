# Handoff — 2026-07-27 session, continued

Written for a session starting cold. Picks up right after the "round 19" commit
(`02e4da7`) and covers uncommitted work on top of it.

## Read first

This portfolio has its own design system doc at
[.interface-design/system.md](.interface-design/system.md). Read it before touching
any UI — it has the direction ("a living preprint"), the depth strategy (hairlines
only, no shadows), the type scale, and detailed notes on every signature component
including the ones touched this session (entries 7, 8, 18, 20, 22, 23, 29 in the
numbered list).

## Uncommitted right now

`git status` shows `js/site.js`, `css/paper.css`, `lean.html`, `projects.html`,
`404.html` and `.interface-design/system.md` modified, and this file untracked.
Nothing is committed yet. `_proto.html`, the scratch prototype page, has been deleted
now that the stat treatments are chosen.

### What's actually done and working

1. **Contents-spiral figure fixes** (index.html) — canvas aspect-ratio bug fixed
   (canvas is now `position: absolute; inset: 0` so declared `aspect-ratio` actually
   renders), numerals reordered outward-from-centre so they land 01→06 in sequence,
   frame-edge clamping fixed, ink hierarchy inverted so the six numerals are the
   loudest marks instead of the quietest. **This part is solid, tested, committable.**

2. **Education graph rebuild** — arrowheads, edge-to-chip-box clipping, ancestor/
   descendant chain highlighting on selection, `needed N · led to M` counts, hover
   preview, arrow-key navigation, node repositioning to eliminate edge/chip overlaps
   (verified zero crossings at the 876px layout). **Solid, tested, committable.**

3. **Projects tailpiece (cubic roots figure)** — tightened view radius and raised
   alpha so it reads as a drawing instead of a haze. **Solid, tested, committable.**

4. **Number stats, resolved** (lean.html, projects.html, paper.css) — `.tabf` is gone,
   and so is the idea of one stat component. Three treatments now ship, chosen by what
   the numbers are: `.vecf` a column vector for lean's three exact counts (`Table 1`),
   `.eqf` an align block with real `≥` relations for Tri-Valley's three lower bounds
   (`Table 2`), `.railf` a logarithmic rail for USAMO Guide's six counts across four
   decades (`fig. 18`, beside the reel). Documented in system.md's "Numbers: three
   treatments". **Solid, verified against the rendered DOM, committable.** See below
   for what was checked and the two things still open.

5. **Draggable manuscript sheets** (index.html deskstack) — pointer-drag anywhere on
   the page, clamped to viewport, persisted in `sessionStorage`, "tidy the desk"
   reset control, full print/reduced-motion/no-JS fallback contracts. **Solid,
   tested, committable.**

6. **Spiral polish, this exact session** — removed the pen-ring + leader-line
   annotation around each numbered box per user feedback ("box with number is
   enough"); numeral now sits directly on its prime. Draw duration cut 2.6s → 1.5s
   per user feedback ("speed up prime drawing"). Deleted now-dead code:
   `ULAM_LEAD`, `ULAM_GAP`, the `offsetFor` ray-box intersection, per-anchor
   leader/ring canvas drawing. **This is the last edit made, verified in-browser
   (numerals still land in prime order, insets still clamped ≥36px), not yet
   reflected in `.interface-design/system.md`.**

### Number stats — done, with two things still open

Fourteen prototypes were built across two rounds (round 1 A–F typographic, round 2 G–N
mathematical). The user picked three, one per call site, and they are implemented:

| site | was | is |
|---|---|---|
| lean.html, `Table 1` | `.tabf` booktabs | **`.vecf`** column vector, `L = [ … ]` |
| projects.html, `Table 2` | `.tabf`, figures `25+` | **`.eqf`** align block, `≥ 25` |
| projects.html, `Table 3` | `.tabf` beside the reel | **`.railf`** log rail, now `fig. 18` |

`_proto.html` is deleted (a copy sits at `/tmp/protoshot/_proto.html.bak` until that
directory is cleared, if the losing prototypes are ever wanted again).

**Consequences worth knowing.** Making the rail a figure renumbered the global run:
cubic roots 18 → 19, the 404's Clifford 19 → 20, and the sequence is a clean 1–20 with
no gaps. `Table 3` is retired, so the table series is now just 1 and 2. `.showcase .reel`
needed `align-self: flex-start`, because the rail is taller than the reel and
`align-items: stretch` was silently stretching the 4:5 frame to 300×440.

**What was verified**, by measuring the rendered DOM rather than eyeballing: every rail
mark sits at log10 of its count to within 0.01%; every figure settles to its `data-count`
after the count-up; the vector's closing bracket lands exactly on the figure column's
edge and the labels clear it; no two rail labels overlap (the tightest pair, 25,000 and
42,000, clears by 2.8px); the reel holds 4:5; the night board flips the axis, marks and
brackets and the ink lands on the right side of the paper in both palettes; the print
rules keep all three from breaking across pages; no `.tabf`/`.stats` element is left in
any DOM. Checked at 1280, 760 and 500.

**Two things still open.**

1. **375px is unverified.** Headless Chrome clamps its layout viewport at 500px, so
   nothing below that was actually rendered. Check the vector and the align block on a
   real phone: both have a long label column that will wrap.
2. **The reel prints as a solid black rectangle.** `@media print` hides `video` but not
   `.reel`, which keeps its `--film` background, so a printed page carries a 300×372
   block of ink. This is **pre-existing**, not caused by this round, but it was noticed
   while checking print and should be fixed (print `.reel` as its border only, or hide
   it and let the caption carry the plate).

A third thing worth a decision rather than a fix: system.md says a signature element
"appears on more than one page — that is what makes it a signature rather than a
flourish." These three each appear exactly once. The defence is that they are one
family answering one question, and the data genuinely has three shapes; the risk is
three bespoke components where one would have done. Left as is deliberately.

### Verification note

All six items above were checked live in the Browser pane against
`python3 -m http.server 8899` this session (not yet against a fresh server — start
one if continuing). No console errors were seen at the checkpoints tested. The
education-graph zero-crossing claim and the spiral prime-ordering claim were both
verified by measuring live DOM/canvas state in-browser, not by eyeballing.

## Standing conventions worth knowing before editing further

- No shadows anywhere, radius 0 throughout, hairline borders in three weights
  (`--rule-soft` / `--rule` / `--rule-strong`) — see system.md's "Depth strategy".
- One accent (`--ballpoint`), rationed semantic colors (`--qed` green, `--laurel`
  gold) — see "Color".
- Every canvas figure reads color through `palette()`, never a literal hex, so the
  night-board dark mode (`html.board`, toggled by the `b` key or the topbar glyph)
  repaints correctly. Any new canvas work must call `onRepaint()`.
- Figures caption below (`fig. N`, one global sequence); tables caption above
  (`Table N`, a separate sequence) — established this session, documented in
  system.md entry 22.
- Every progressive-enhancement JS feature (goal stepper, morphism widget, ledger,
  spiral, deskstack drag) ships a complete static/no-JS fallback in the HTML and
  fails open, never leaving content hidden if JS errors.
