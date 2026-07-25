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
   ballpoint line tracing over it, a laurel mark at the pen. Lorenz and a double pendulum on
   animations, the Thue–Morse difference table on formalization, Ulam's spiral and the Lorenz
   again on the index, the Mandelbrot on 404. The Lorenz stands on two pages off one plotter:
   `lorenzPoints()` caches the integration at module level and the registration takes both ids
   (`#figure-lorenz, #figure-lorenz-home`), so a second instance costs nothing.
7. **Contents filed among the primes** — on the index the spiral *is* the contents. The
   numerals are absolutely positioned onto six real primes (`.ulam-node`, paper backplate,
   hairline ring, 44px hit area via `::after`) and are **real links**, not decoration. A
   compact `.toc-line` legend sits beneath as the plain-text equivalent and the no-JS
   fallback; hovering either side lights the other through `.is-hot`. Separation between
   numerals scales with the figure (`pickAnchors(…, side)`); a fixed pixel threshold
   strands them on a narrow viewport. The caption doubles as a **readout**: idle it names
   the figure, on hover it reads back the section, its phrase, and the prime the numeral
   sits on (`data-spiral-readout`, `min-height` reserved so the swap never shifts layout).
   **It draws itself** (round 16): the primes stipple outward in spiral order over 2.6s on
   first view and each numeral lands as the walk reaches the prime it sits on
   (`.ulam-node.spiral-pre`, opacity + `scale(0.9)`). It is the one plotted figure that does
   **not** loop: navigation that came and went would be unusable. Three things this required.
   The walk and the ink are **separate functions** (`ulamWalk` / `ulamDraw`), because the
   numerals are placed from the whole prime list while only part of it is drawn, and a figure
   whose navigation moved as it drew would be worse than a static one. The layout runs on
   resize and repaint only, never per frame. And **finishing must stop the loop**: see the
   note under the canvas bugs.
   **It is a wide band** (round 17): it was a 380px square in a 940px page, which made the
   most important drawing on the site the smallest thing on it. Now `12 / 5` at the full
   measure, same height, about 2.4× the primes at the same density. `ulamWalk` takes the cell
   size from the *height*, fits as many cells across as the width holds, walks the square that
   circumscribes the band and keeps only what falls inside it, so the band is a real window
   onto the spiral rather than a different figure. `pickAnchors` targets an **ellipse**, not a
   circle: aiming at plain radii put every numeral past half-way outside the band and all six
   collapsed into the middle third. Its radii are interleaved rather than ascending, or the far
   ones all land on one flank. **Under 760px it goes back to the square**, like the education
   graph flipping to `3 / 5`: a 375px band is 156px tall and the numerals would sit on top of
   each other. **Its caption sits above it**, the only one on the site that does, ruled off
   beneath and set left: it is not really a caption but a live readout that renames itself on
   hover, and centred text that changes length on every hover jitters.
8. **The prerequisite graph as navigation** (education) — every node is a real `<button>`
   over a canvas of curved edges, and selecting one fills a `.node-pop` card with dates, a
   line, and a jump link into the section below. Wide, it reads as two chains meeting.
   Under 560px the identical graph relayouts to one column in chronological order, chips
   centred on the nodes and edges bowed out to the side. Chip x is clamped to the figure,
   or a label near an edge hangs off it.
9. **The ledger** — hand-kept counts as an account book: mono platform label, handle,
   figure right-aligned in tabular numerals, and a `.ledger-sum` balance line ruled off
   at the foot with the running total. Never a dashboard tile. A count of zero means
   "not written down yet" and keeps the dash.
10. **The epigraph** (`.quote`) — rules above and below, the line at 23px italic, the
    attribution in small tracked mono. At most once per page, where a chapter opens.
11. **The footer** — an offprint's last page, not a sitemap: signature and an epigraph on
    the left, the numbered contents in two hairline-ruled columns on the right, one meta
    rule beneath carrying `currently ·` and the key map. No colophon boilerplate about
    which typefaces were used; the page itself is the evidence.
12. **Film plates** — a real `<video>` in a portrait 9:16 frame, `object-fit: cover` over
    `--film`, the single dark token and the one place a dark surface is allowed. The films
    are reels, so the frame is portrait and crops to fill; a vertical export lands exactly,
    a landscape one shows its centre strip. The uncovered edge falls back to film-black.
13. **Link marks** — contact buttons carry a 15px inline SVG in `currentColor`, inheriting
    `--ink-3` and turning ballpoint on hover. Real brand marks, taken from simple-icons (CC0)
    rather than drawn from memory; never emoji.
14b. **A handle you copy** (`[data-copy]`, `initCopy`, round 17) — Discord has no link format,
    so the one contact method that is a *handle* rather than a URL copies instead of navigating.
    It ships as a `<span>` carrying the handle in plain text, and JS promotes it to a real
    `<button>`: no-JS readers can read and select it, there is no dead control, and the keyboard
    and screen-reader behaviour come from the platform instead of a hand-rolled `role="button"`.
    Three states, because a control with no feedback reads as broken: label swaps to `copied`,
    the icon-only one in the footer tints ballpoint, and **if the clipboard is refused the
    handle is selected instead** so it can be copied by hand. No `--qed` green: that is reserved
    for things a machine checked, and a clipboard write is not one.
14. **The tailpiece** (`.tailpiece`) — a chapter-end ornament: one figure set ~320px,
    centred, muted (opacity .85), at the very foot of a page, with one quiet mono caption
    beneath it (`.tailpiece .figcap`, centred). **The taste, learned the hard way: closing
    art must be DENSE and EMERGENT** (a walk that thickens into cloud, a strange attractor
    stippled into smoke, a clustered network, a text triangle) **never a thin single closed
    curve** — the round of golden spiral / Recamán / spirograph / Lissajous was rejected
    outright for reading as clip-art. The set now: ink-walk (index), strange attractor
    (animations), ink-network (projects), Mandelbrot (research), Sierpinski mod 2
    (formalization), cubic-roots cloud (education). Canvas pieces draw through `palette()`
    (night-board safe), off a seeded `mulberry32` (identical every repaint), and bail when
    `clientWidth < 40`. The caption is a true claim like every other figure caption: verify
    the count or construction before writing it (walk = 90k steps, attractor = 42k points,
    roots = every integer cubic with coefficients in −5..5).
18. **The cubic-roots figure** (`cubicRoots`, education tailpiece) — the complex roots of
    every `ax³ + bx² + cx + d` with `a ∈ 1..5`, `b,c,d ∈ −5..5` (positive `a` covers the
    sign symmetry), each normalized to monic and solved by a 30-pass Durand–Kerner
    iteration, then stippled at low alpha so overlapping roots build density. This is our
    own ink recreation of a copyrighted "Bohemian roots" artwork the user linked, not the
    raster itself — recreating the mathematics keeps it night-board safe and license-clean.
19. **Film reels are seamless** (`[data-film]`, `initFilms`) — every `<video>` autoplays
    muted, loops, and carries no control bar; an IntersectionObserver plays it in view and
    pauses it off-screen, a click toggles play/pause, and under `prefers-reduced-motion`
    nothing autoplays (poster frame holds, click starts it). The muted/loop/autoplay
    attributes ship in the HTML so it still works with no JS. Export vertical: the manim
    film plates are 9:16 (`.plate-frame`), the projects showcase reel is 4:5 (`.reel`), both
    over `--film`.
20. **The showcase** (`.showcase`, projects) — a portrait reel with its numbers read down
    the side of it: the 4:5 video on one flank, a single ruled column of `.stat` rows
    (`.stats-col`) on the other, both standing vertically so a phone-shaped video and its
    stats share one line. Wraps to stacked on mobile.
21. **The texview** (`.texview`, projects) — a small Overleaf standing in for a project
    visual: a LaTeX **source** pane (real `\documentclass`/`\subsection*`/`\[…\]` in mono)
    beside the **typeset** result (STIX, pure HTML/CSS: italic `<i>` variables, `<sup>`/
    `<sub>`, `.bigsum` for stacked summation limits, `.boxed` for `\boxed{}`), split by a
    hairline and stacked under 560px. It holds a **worked problem**, not a formula list:
    problem, substitution, factorisation, the rejected root, the boxed answer — a tutoring
    artifact, which is what the card is about. **The preview starts empty** (`.tv-idle`,
    "no output yet · press compile") because an editor has nothing to show until you run it;
    the button reads `compile` until the first press, `recompile` after. The finished render
    ships in the HTML and `initTexview` takes it into JS memory before emptying the pane, so
    no-JS readers still get the whole solution. The LaTeX source must compile to exactly what
    the preview shows, and the mathematics is checked before shipping.
22. **Figures are numbered globally** — one `fig. N` sequence runs across the whole site in
    nav order from the homepage (1–3 index, 4–7 research, 8–11 lean, 12–14 animations, 15–16
    education, 17–18 projects, 19 the 404), interactive widgets and tailpieces included. Film
    plates keep their own Plate I–III roman series. Renumber the whole run when inserting a
    figure; the captions still have to be true. Do it highest-number-first
    (`for n in 18 17 … 2; do perl -pi -e "s/fig\. $n\b/fig. $((n+1))/g" *.html; done`) or the
    replacements collide.
23. **All tailpieces draw in one ink** — `--ballpoint`, so the closing figures read as a set.
    The faint ones were darkened (walk α .22, roots α .20); the dense ones keep their original
    density (attractor α .16) and only changed hue (Mandelbrot ink → ballpoint). Judge new
    alphas at the real 320px tailpiece size, not a shrunk grid cell, or a dense figure looks
    solid when it is fine full-size.
24. **Thue–Morse strips are rationed** — at most **one per page**, marking the single real
    hinge (index: title block → contents; research: intro → vocabulary; lean: numbers →
    contents; manim: figures → films; education: graph → record). Sibling cards on the same
    page (the two project entries) get whitespace and their own hairline, never a strip.
    A round that put one between every section was pulled back: repeated, the strip stops
    reading as a hinge and starts reading as furniture. Projects and 404 have none at all.
25. **The og:image** (`assets/og.png`, 1200×630) is drawn with the site's own ink-walk over
    paper stock plus the STIX title, generated by the same `mulberry32` walk the tailpieces
    use (regenerate with that code, not a stock image). Every page links it via `og:image` +
    `twitter:card summary_large_image`.
26. **The board toggle** (`.board-toggle`, every topbar) — the night board was a hidden `b`
    key for three rounds, which meant nobody found it. Now a bare `◐` sits at the end of the
    bar: glyph only, no label, `--ink-3` → ballpoint on hover, 40×40 hit area, `aria-pressed`
    synced and the name carried by `aria-label`. Button and key run through one `setBoard`,
    so state, storage, and `aria-pressed` cannot drift apart. The key map on the index
    contents note names both.
    **The OS gets a vote on the first visit** (round 17): with nothing in localStorage, an OS
    set to `prefers-color-scheme: dark` boots on the board. The site had a night palette for
    five rounds and nobody arriving in dark mode ever saw it. A stored choice always wins, the
    toggle persists from then on, and with no JS everyone gets paper, which is the palette the
    HTML ships in. `theme-color` is paired to match, so the browser chrome does not stay cream
    around a dark page.
27. **Drawn underlines** (`.uline`) — **at least one load-bearing phrase on every page**, marked in
    ballpoint the way you would mark a book you owned. The stroke is a `background-image`
    gradient sized `0% → 100%` over 620ms as the phrase comes into view (`initUlines`).
    Thickness is a custom property (`--stroke`, 1.5px) so the three states cannot drift apart,
    and `.display .uline` takes it to 3px: the name is the one phrase on the site set at 48px,
    and a hairline under it reads as a rendering mistake rather than emphasis.
    **The CSS default is the finished stroke**: JS pulls it back to zero and draws it, so
    no-JS and reduced-motion readers still get the emphasis. Print keeps it static.
28. **Print is a real target** (`@media print`) — the site claims to be a preprint, so it
    prints as one: 2cm page margins, no chrome or controls, films replaced by their plate
    captions, external links printing their URL, `break-inside: avoid` on every card and
    figure, sidenotes folded inline. Two contracts that are easy to get wrong: `beforeprint`
    **completes the interactive widgets** (the texview renders, the proof closes) so paper
    never shows a control waiting to be pressed; and it **drops the night board and
    repaints**, because a canvas is a raster and chalk-coloured figures print as nothing on
    white. `afterprint` puts the board back.
29. **The deskstack** (`.deskstack` / `.sheet`, index) — the work as it sits on a desk:
    two manuscript sheets and the library card they stand on, fanned by small rotations and
    negative margins, each a real link into its section. Hover squares a sheet up and lifts
    it. Transforms only, so nothing reflows; under 720px the fan becomes a squared pile and
    hover does nothing. It replaced a three-card list that duplicated the research page
    almost word for word: the homepage points, the section carries the substance.
30. **The pager** (`.pager`) — numbered sections should be walkable in order, so every
    section page ends on a two-ended hairline row: the section behind and the one ahead, in
    the nav's mono, number first. Projects wraps back to the contents rather than dead-ending.
31. **The word art answers the pointer** (`initWordart`, research) — every glyph is wrapped
    in its own span, centres cached once, and a rAF-throttled `pointermove` tints two radii
    (34px to ballpoint/laurel, 76px to full ink). **Colour and weight only, never position**,
    or a 216-letter block reflows under the cursor. Pointer devices only (`hover: hover and
    pointer: fine`), so touch and no-JS get the same static block.
33. **Structural rhythm beats decoration** — research and formalization had drifted into the
    same shape: three stacked `figure-row`s, cards left, figure right. Two identical spines
    read as one template however good the components are. They were pulled apart by giving
    each page a different sequence, not different styling: research runs
    `figure-row → .pair → .wide-fig → figure-row`, formalization runs
    `grid-2 → stats → .catalog-rail → figure-row.listing`. **When two pages feel the same,
    compare their spines before touching their surfaces.** The two rows that survived on both
    pages are still not the same row: research sets a drawing against cards as peers and
    centres it, formalization hangs a plate in a narrow rail beside a table and sets a code
    listing that runs the full height of its cards.
34. **`.pair`** — two things of equal standing, side by side. A column implies sequence; the
    two definitions on research are peers and now read as peers. `.wide-fig` gives a widget
    the full measure (the morphism reaches 256 letters and a half-column made it a wall).
    Two more row shapes, each with a reason a plain `.figure-row` could not give:
    **`.catalog-rail`** hangs the Thue–Morse difference table in a ~230px rail beside the
    catalog, top-aligned rather than centred, because the table leads and the figure annotates
    it; **`.figure-row.listing`** widens the figure column to `1.18fr` because Lean lines have
    a width the source chose and wrapping or scrolling them misrepresents it. Both must be
    named alongside `.figure-row` in the ≤900px collapse, or their own template outranks it
    and mobile and print stay two-column. (There was a `.mid-fig` for centred closing figures;
    both its users moved into rows and it was deleted rather than left as dead CSS.)
35. **`.morph`** — the morphism shown as a derivation, not a list of longer strings. Each
    generation is a labelled row (`n = 4 · 16 letters` in a mono gutter), each letter is its
    own glyph so `0` and `1` carry different ink and the self-similar texture reads as
    pattern, and the newest row groups its letters in **parent-pairs ruled off underneath**,
    which is the substitution itself made visible. Older rows recede to `--ink-4`. It opens on
    the same six generations the static HTML ships, so enabling JS never shows *less* than
    disabling it.
36. **`.catalog`** — a library has a catalog, not a stack of cards: ruled rows, the identifier
    in mono, the description in the body face. It exists to be structurally unlike the theorem
    cards on research. **No invented numbers**: a per-module "lines" column was cut mid-build
    because the counts would have been fabricated, and this site's whole argument is that its
    claims are checkable. The **status column came out too**, to give the table's namesake
    figure a rail beside it. Nothing checkable was lost, but the removal is only safe because
    the rows already say in words where the research half stops ("four named obligations remain
    open") and the stats row above still counts the two closed classical results. The page lede
    had to be rewritten in the same edit: it used to say "every claim marked machine-checked",
    and after this nothing on the page is marked.
37. **Films are not cards** (`.plate`) — the plates were the one component with a border and a
    raised background on a site whose depth strategy is hairlines only. The box is gone: the
    reel sits on paper with a 1px inset outline, caption beneath like any figure. **Hover-scrub**
    (`initFilms`): a fine pointer dragging across a frame seeks the reel and a ballpoint
    hairline tracks the position; leaving resumes the muted loop. Throttled on the clock, not
    rAF, because rAF is throttled in a background tab and the reel would freeze under a moving
    cursor. Touch keeps tap-to-toggle.
38. **`.reach` and `.onair`** — 52,244 followers was the last thing on § 03, below the fold.
    The number is now a figure at the top of that page (rules above and below, like the
    epigraph) and a compact line on the homepage. § 03's reads from `data/socials.json`
    through `initLedger`, so the headline and the itemised ledger at the foot cannot disagree.
    The ledger stays: the headline is the claim, the ledger is the evidence. **The homepage
    line is a different claim** as of round 16: 15,000,000+ total views, not followers. Views
    are not in `socials.json` and no platform will hand them to a static page, so the figure
    is hand-kept in the HTML and the element carries **no `data-reach-total`** — that
    attribute is what invites `initLedger` to overwrite it with the follower sum. It keeps
    `data-count` so it still counts up. The figure beside the
    homepage line **was** a film, and it was the Galton board, byte for byte the same file
    § 03 already shows as Plate III. The front page's one motion slot should not be a reprint,
    so it is now the Lorenz drawn live (`#figure-lorenz-home`, square, column widened from the
    260px a portrait reel wanted to 340px). Two consequences that are easy to miss: the copy
    described the balls and pegs and had to be rewritten, and the drawing is a figure, so it
    took a number and the whole run shifted by one.
39. **Widgets end somewhere real** — the texview's compile used to terminate in nothing. It now
    ends in a link to the actual handout library at trivalleytutoring.org/resources, shipped in
    the static HTML so no-JS readers get it too. A fake interaction that leads to a real
    destination is worth keeping; one that leads nowhere is decoration.
32. **View transitions** (`@view-transition { navigation: auto }`) — moving between pages
    fades rather than cuts, so the site reads as one document. The topbar carries its own
    `view-transition-name` and a 1ms group animation so the bar holds still while the page
    under it dissolves. CSS only, inside a `prefers-reduced-motion` guard; unsupporting
    browsers simply navigate.
15. **The goal stepper** — the Lean panel walks a real proof one tactic per click
    (`GOAL_STEPS` in site.js): each press rewrites `.goal-body` to the next state and puts
    the next tactic on the bar, ending on `No goals. ∎`; reset returns to step 0. The
    static HTML still ships the closed proof, so no-JS sees a finished theorem.
16. **The record** (`.record`) — everything under the education graph, packed into a quiet
    auto-fit grid of labelled columns (small mono kicker, tightened `.entry` rows), instead
    of four full sections repeating what the graph already shows.
17. **The footer contact row** — five icon-only links (`.foot-contact`, 40×40 hit areas,
    `--ink-3` going ballpoint on hover) replace the old keyboard-hint line. Reaching out is
    on every page; the key map lives on the home contents note and in this doc.

The reading-progress strip is the Thue–Morse word as a fixed row of boxes: dim at
`0.12`, and the first `round(p·n)` light up (1-boxes full, 0-boxes `0.55`) as you scroll,
dimming again on the way back. Synchronous on the scroll listener, never rAF (throttled in
background tabs); `scrollHeight` cached on resize.

## Figures must be true

**And decorative drawings are not figures.** A drawn desk behind the manuscript stack was
proposed and rejected: the deskstack already *is* the drawing, and a desk asserts nothing a
reader could check. Every drawing on this site is a real object — a spiral of primes, an
integrated attractor, a square-free word, the roots of every integer cubic. If a proposed
illustration has no checkable content, it does not belong here.

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
- `.plate-frame` — 9:16 film reel, `object-fit: cover` over `--film`, no controls
- `.reel` (showcase) — 4:5 portrait video, hairline border over `--film`
- `.stats-col` — `.stat` rows stacked into one hairline-ruled column, beside a reel
- `.stats-grid2` — six `.stat`s as a 2×3 block (1px hairline gaps over `--rule`), beside a reel
- `.texview` — a small Overleaf: `.texview-code` (LaTeX source) + `.texview-out` (STIX
  render), `.tv-run` recompile button, `.bigsum` for summation limits
- `.wordart` — a ternary word set as a solid block, three letters at three ink shades
- `.show-frame` — 3:2, images `object-fit: cover` with a 1px inset
  `rgba(0,0,0,0.1)` outline
- `.titleblock` — `--s6 0 --s5` (was `--s8 0 --s6`; trimmed in round 16 so the first screen
  reaches the Thue–Morse strip at 1280×800) · `.revision` 6px top, `--ink-4`, +0.06em tracked
- `.contents-hero .canvas-wrap` — `12 / 5` at the full measure, back to `1` and 380px under
  760px. Caption above, ruled off, left-aligned
- **The mobile top bar** — 214px and four lines at 375px, which is a quarter of the screen held
  permanently by a sticky element. Now ~143px: nav at `8px 6px / 12.5px` packs to two rows of
  three with the numbers intact and 40px hit areas kept, and `.nav { order: 1 }` puts the board
  toggle on the brand row instead of a fourth line of its own. Then `initBarHide` tucks the
  whole bar on scroll-down past 140px and returns it on scroll-up, on a passive synchronous
  listener with a 6px deadband. Never rAF: same reason as the progress strip
- `.btn` — `flex: 0 0 auto`, so a wrapping row wraps instead of crushing a button into its
  40px min-width and swallowing its own label
- `.canvas-wrap` — 4:3, 1px `--board-rule`, canvas DPR-scaled in JS
- `.catalog-rail` — `1fr / minmax(230px, 0.46fr)`, `align-items: start`, gap `--s5`; collapses
  at 860px
- `.figure-row.listing` — `1fr / 1.18fr`, the widest a Lean listing needs before it scrolls.
  Below 1.18 the longest line (`elliott_halberstam.variants.bombieri_vinogradov`) clips; above
  it the third theorem card's status wraps off its head. Both were measured, not guessed
- `.record` — education's four-column record, now a 2-up grid (`minmax(300px, 1fr)`)

## Motion

Restrained on purpose. `transform` and `opacity` only, `cubic-bezier(0.23, 1, 0.32, 1)`,
one-shot, never replayed.

- **Scroll reveals** on section heads and theorem cards only: 380ms, 12px rise, 50ms
  stagger between siblings of a `[data-reveal-group]`. Nothing else on the page moves.
- **Thue–Morse rules draw in** tick by tick on first view, 14ms apart.
- **Index title block** staggers kicker → name → byline → affiliation → revision → abstract
  at 80ms steps, once on load. Six children now, and the delay list has to cover all of them:
  a child past the last `nth-child` rule gets 0ms and arrives *first*, so the stagger reads
  backwards.
- **The first screen is where the entrance animations live** (round 16). There were none but
  the title stagger for fifteen rounds, and the landing page was the one page that opened on
  nothing but type. Two were added, both one-shot, both fail-open: the **name's ballpoint
  stroke** draws right after the stagger lands, and the **contents spiral inks itself in**
  (below). Nothing else on the site animates on load, and that is still the rule.
- **Marks on the first screen are staggered, deeper ones are not** (`initUlines`): three
  strokes drawing at once reads as decoration, so a mark above the fold at init waits
  `140 + i·220ms` in document order. A mark scrolled to later draws at 140ms flat, because a
  stagger there is indistinguishable from lag.
- **Plotted figures** are the sole continuous motion: they pause off-screen and render one
  static complete drawing under `prefers-reduced-motion`.
- **Text figures ink in** (`initInkRows`): the wordart block and the two Pascal triangles
  reveal one row at a time on first view, 40ms apart, the way a plotter lays down type.
  JS wraps each row in a block `<span>` — **join the spans with `""`, never `"\n"`**, or the
  separating newlines render too and double the height of the `<pre>`.
- **The board crossfades** (`.board-fading`): flipping the night board remaps every token at
  once, which snaps hard, so colour transitions are switched on for the 240ms of the swap and
  switched straight back off. Never leave a global colour transition on the page; it would
  make every hover feel laggy. Skipped entirely under `prefers-reduced-motion`.

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

**A fifth, from the spiral: a failsafe that does not stop the loop does nothing.** The
spiral's guard set `p = 1` and repainted, and the next animation frame promptly overwrote `p`
with its own value, so the contents shipped half drawn with the numerals sitting outside the
ink. A `done` flag that the frame loop checks is the fix. The same round taught the other
half of it: **the two failsafe cases are different.** A walk that started and stalled gets
8s, like every other reveal here. A walk that has not started because the reader is still on
the abstract gets 20s, because cutting it off at 8 means nobody reading at a normal pace ever
sees the figure draw. Both end in the same place, with the navigation visible.

## Consistency rules

- Spacing values come from `--s1`…`--s8`. No arbitrary px.
- Colors come from the tokens. No literal hex in the HTML.
- One accent. If something needs to stand out and blue is taken, use weight or space.
- Radius stays 0. Shadows stay absent.
- No emoji anywhere; the math glyphs (∎ ⊢ § ⟨⟩) carry the character.
- No em dashes in copy. See Prose above.
- No dark sections. One paper palette across every page.
- Every placeholder is `<span class="fill">`, so unfilled content is visible, never plausible.
