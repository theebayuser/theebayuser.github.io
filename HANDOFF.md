# Handoff

Static site, live at https://theebayuser.github.io. No build step: edit HTML/CSS/JS
directly, push to `main`, GitHub Pages redeploys in about a minute.

## What's done

- 8 pages: `index`, `research`, `lean`, `manim`, `education`, `projects`, `404`, plus
  `cv.pdf` (a static resume, not an HTML page).
- Design system documented in `.interface-design/system.md` — read it before touching
  colors, spacing, or components. Read `README.md` for the file map and click-through
  list. Both are current as of the last commit.
- Every page ends in a **tailpiece**: a small figure with one quiet mono caption, drawn on
  canvas through `palette()` in `--ballpoint` so it repaints on the hidden night-board toggle
  (press `b`). Taste rule, hard-won: dense/emergent art (random walks, attractors, networks,
  text tables), never a thin single closed curve — see system.md item 14 for the rejected
  round. Captions are true claims (verify the count/construction before writing one).
- **Figures are numbered globally** (`fig. 1`…`18`, nav order from the homepage through the
  404). Insert one and you renumber the run — grep `fig\.` across the pages afterward.
- The **social card** is `assets/og.png`, drawn with the same ink-walk code, linked from
  every page. Regenerate it (not a stock image) if the name or look changes.
- Real content is in: schools, coursework, competition results, three uploaded films,
  two run projects (Tri-Valley Tutoring, USAMO Guide, both linked to their live sites),
  upstream Lean contributions (Talos, Mathlib PRs, a merged formal-conjectures theorem).
- Live follower counts for `@math.visualizations` live in `data/socials.json`, hand-kept
  (the platforms don't expose them to a static page) — update the file to refresh them.
- Keyboard nav: `1`–`5` jump sections, `6` opens the CV, `0` goes home, `b` flips the night
  board. The board also has a visible `◐ board` button in every topbar; both go through one
  `setBoard` in site.js, so don't add a second code path for it.
- **Thue–Morse strips are rationed to one per page** (the single real hinge). A round that
  put one between every section was pulled back; sibling cards get whitespace instead.

## Known open items

- **`cv.pdf`** still has an "Experience → Lean FRO, Contributor" line that reads a shade
  stronger than the site's own "contributor, nothing more" phrasing on `lean.html`. Not
  fixed because it's his PDF, not generated — flagged, not touched.
- Photos: `assets/photos/` is empty. The slideshow markup on `personal.html` (if it comes
  back) or wherever photos are wanted still needs real images.
- `data/socials.json` counts are only as fresh as the last manual edit — no live source.

## Where to look for more context

- `.interface-design/system.md` — the design system, updated every round.
- `README.md` — file map, "things you can click," deploy instructions.
- Cross-session memory (outside this repo) has a fuller history of round-by-round
  decisions and user feedback under the `portfolio-site` memory entry, if picking this
  up from a fresh session without that context loaded.
