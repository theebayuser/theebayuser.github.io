# Handoff

Everything you need to pick this site up cold.

## 1. What this is

Daniel Liao's personal site, live at <https://theebayuser.github.io>. Seven HTML pages, one
stylesheet, one script, no build step and no dependencies. Editing a file and pushing to
`main` is the entire deploy: GitHub Pages republishes in about a minute.

The design has a name and a thesis: **"a living preprint."** The site is typeset like a
mathematics paper on warm stock, and that conceit is load-bearing, not decorative. It decides
the palette, the hairlines, the numbered sections, the theorem environments, and the rule that
every figure states something true. When a change would look fine anywhere else but wrong in a
preprint, it is wrong here.

## 2. Run it

```bash
python3 -m http.server 4173 --directory .
```

Then open <http://localhost:4173>. There is nothing to install.

Read in this order before changing anything:

1. `.interface-design/system.md` — the design system, 39 numbered decisions with the reasoning
   for each. **This is the authority.** Most questions are answered there.
2. `README.md` — the file map, "things you can click," how to update content.
3. This file — the rules and contracts that break quietly if you ignore them.

## 3. The map

| Path | What it is |
|---|---|
| `index.html` | Title block, abstract, the Ulam-spiral contents, the manuscript deskstack, the animation block (a live Lorenz beside the reach line), contact |
| `research.html` | § 01. Ternary word art, two definitions, the morphism widget, two manuscripts with the turtle figure beside them |
| `lean.html` | § 02. The goal stepper, the library measured, the catalog with its figure in the rail, upstream contributions |
| `manim.html` | § 03. Two live figures, the reach headline, three film plates, the follower ledger |
| `education.html` | § 04. The prerequisite graph as navigation, the record grid |
| `projects.html` | § 05. Tri-Valley Tutoring with the LaTeX viewer, USAMO Guide with the showcase reel |
| `404.html` | Not-found, proved by contradiction |
| `css/paper.css` | The entire design system. Every colour, size, and rule lives here |
| `js/site.js` | Every figure, widget, and key binding. One IIFE, no modules |
| `data/socials.json` | Hand-kept follower counts and the "currently" line |
| `assets/og.png` | The link-preview card (1200×630), drawn with the site's own ink-walk |
| `assets/video/` | Four `.mp4` files: three films and the USAMO Guide showcase |
| `cv.pdf` | A static PDF. To update it, replace the file |

`assets/photos/` exists and is empty.

## 4. Rules that are not negotiable

These are the ones that keep the site coherent. Breaking any of them is visible immediately.

- **One paper palette.** No dark sections, no second accent. `--ballpoint` blue is the only
  accent; `--qed` green and `--laurel` gold are rationed to machine-checked status and awards.
  The night board (`html.board`) is a whole-site remap, not a dark band.
- **Hairlines only, radius 0, no shadows.** Three rule weights that mean different things.
  If something reads as a *card*, it is wrong — that is exactly what the film plates were, and
  they were fixed.
- **No em dashes in site copy.** Commas, colons, parentheses, or a new sentence. En dashes
  survive for names (Thue–Morse) and ranges (2025–26).
- **Figures must be true.** Every caption is a claim on a site whose argument is that this
  person checks things. Verify the mathematics *before* writing the caption. A Koch-snowflake
  caption was cut once because simulating it showed the claim was false, and a per-module
  "lines of Lean" column was cut because the numbers would have been invented.
- **Decorative drawings are not figures.** If a proposed illustration has no checkable content,
  it does not belong. Every drawing here is a real object: a spiral of primes, an integrated
  attractor, a square-free word, the roots of every integer cubic.
- **Figure captions go below, with one named exception.** fig. 1 on the homepage sits *above*
  its figure, because it is not a caption but a live readout that renames itself on hover.
  Every other figure keeps its caption underneath. Do not generalise the exception.
- **Figures are numbered globally.** One `fig. N` run, currently 1–19, in nav order from the
  homepage through the 404. Insert one and you renumber the rest, highest number first or the
  replacements collide: `grep -o 'fig\. [0-9]*' *.html`.
  Film plates keep their own Plate I–III series.
- **Every widget is progressive enhancement over complete HTML.** The static markup must be
  usable and honest on its own; JS may only improve it. See §5.
- **Every page carries at least one `.uline`** — a drawn ballpoint underline on a phrase that
  matters.
- **Thue–Morse strips are rationed to one per page.** A round that put one between every
  section was pulled back; sibling cards get whitespace.
- **Spacing comes from `--s1`…`--s8`, colours from tokens.** No arbitrary px, no literal hex in
  HTML.
- **When two pages start to feel the same, compare their spines, not their surfaces.** Research
  and formalization had both drifted into three stacked `figure-row`s. The fix was different
  section *sequences*, not different styling.

## 5. Contracts that break silently

Each of these has already caused a bug. They fail quietly, which is why they are written down.

**Reveals must fail open.** JS adds the hiding class; without JS nothing is ever hidden.
Reveals do not engage when `document.visibilityState === "hidden"`, because observers and
transitions are throttled in background tabs and would strand text at opacity 0. After
revealing, the animation classes are *removed* so elements rest at their natural styles, and a
global 8s timer clears any leftover state.

**Canvases cannot read CSS variables.** No figure may hardcode a hex. `palette()` reads the
tokens once and hands them out; flipping the board clears that cache and calls every registered
repaint. Register static figures with `onRepaint(fn)`; plotters register themselves. Break this
and the night board leaves black ink on a black board.

**Four canvas bugs worth not reintroducing:**

1. `stop()` must `cancelAnimationFrame` **and** null the handle, or `start()` sees a stale
   handle and the figure deadlocks.
2. `paint(0)` must run once at init, or a frame is blank.
3. A figure whose progress-0 state draws nothing (the Lorenz, the pendulum) needs a faint
   full-path guide underneath, or its frame sits empty until it animates.
4. **A page can boot invisible.** In a background tab every measurement is zero, so anything
   positioned from the DOM (the spiral numerals, the graph chips) lands against nothing and
   stays there. Two defences, both required: any layout function bails when its canvas measures
   under 40px, and `visibilitychange` calls `repaintAll()` the first time the page is looked at.

**Two flexbox traps, both of which shipped once.** A `.btn` in a wrapping row must carry
`flex: 0 0 auto`, or at 375px it is crushed to its 40px min-width and swallows its own label:
that is how the Discord handle disappeared on a phone. And the mobile nav is a full-width flex
line, so anything after it in the markup lands on a line of its own; `.nav { order: 1 }` is what
keeps the board toggle up on the brand row and saves the bar 48px.

**A failsafe must stop the animation, not just set its end state.** The contents spiral's
guard set progress to 1 and repainted; the next frame overwrote it and the figure shipped half
drawn with the numerals outside the ink. Anything that force-finishes an rAF loop needs a flag
the loop itself checks. And the two cases are not the same: *started and stalled* gets 8s,
*never started because nobody scrolled there* gets 20s, or the animation is dead for anyone
who reads at a normal pace.

**A row that overrides `grid-template-columns` must be named in the collapse.** `.figure-row`
drops to one column under 900px, which is also what print gets. `.figure-row.listing` and
`.catalog-rail` set their own templates at higher specificity, so unless they are listed in
that media query too they stay two columns on a phone and on paper. This fails quietly: the
page does not overflow, it just goes cramped where nobody is looking.

**Do not depend on `requestAnimationFrame` for direct manipulation.** rAF is throttled in
background tabs. The film hover-scrub is throttled on the clock (40ms) for exactly this reason;
an earlier rAF version froze the reel under a moving cursor.

**Print completes the widgets.** `beforeprint` renders the texview, closes the proof, and drops
the night board so canvases repaint in ink. Test print changes with a real print preview —
break this and figures print blank or invisible.

**Hand-kept data fails to dashes.** A failed `socials.json` fetch leaves the dashes and every
link still works. A count of zero means "not written down yet," not "nobody follows this."
Count-up ships the real numbers in the HTML and restores them on a 1.5s timer if rAF never
fires.

**The reading-progress bar updates synchronously** in a passive scroll listener, never through
rAF, because throttled rAF would freeze it. `scrollHeight` is cached on resize.

**Enabling JS must never show less than disabling it.** The morphism widget opens on the same
six generations the static HTML ships. This was a real regression once: the rebuilt widget
started at one letter while the no-JS markup showed six.

## 6. Hand-kept data

Nothing on this site calls a live API. Five things are maintained by hand:

- **`data/socials.json`** — follower counts per platform, the `updated` date, and `now` (the
  "currently" line in every footer). None of TikTok, Instagram, or Facebook exposes counts to a
  static page without server-side tokens. The animations page fills the ledger, the total, and
  the headline reach figure from this one file, so the claim and the evidence cannot disagree.
- **The 15,000,000+ total views** on the homepage animation block. Views are not in
  `socials.json` and no platform hands them to a static page either, so the number lives in the
  HTML. It deliberately carries **no `data-reach-total`**: that attribute is what tells
  `initLedger` to replace a figure with the follower sum, and it would silently turn 15M views
  into 52k followers. It keeps `data-count`, so it still counts up.
- **The `v17 · July 2026` revision line** under the title block. Bump it when you do a round;
  it is the only thing on the site that says when any of this was true.
- **The Discord handle `ebayuser`** lives in a `data-copy` attribute in eight places: the
  homepage contact row and the footer of all seven pages. Change it and change all eight, or
  half the site copies the wrong name: `grep -c 'data-copy' *.html`.
- **The USAMO Guide statistics** on `projects.html` (42,000+ lines, 993 problems, 158 sections)
  were counted from a clone of `github.com/usamoguide/usamo-guide` in July 2026. Recount them
  if they are ever questioned.
- **The Lean library figures** (7,665 lines, 394 theorems) come from the working repository,
  July 2026, and appear in three places: the stats row and catalog foot on `lean.html`, and the
  library card in the homepage deskstack. Update all three together.

## 7. Open items

- **`cv.pdf`** has an "Experience → Lean FRO, Contributor" line that reads a shade stronger than
  the site's own contributor phrasing. Untouched because it is his PDF, not generated.
- **`assets/photos/` is empty.** The site is entirely drawn figures and type; one real
  photograph (the math club tournament, a tutoring session) would land hard precisely because it
  would be the only one.
- **Only the current revision is dated.** The homepage carries `v17 · July 2026`, which is half
  the fix. There is still no history: an arXiv-style v1/v2/v3 list with a line each would turn
  seventeen rounds of revision into evidence instead of a single number.
- **The abstract promises AI** ("I work to connect frontier mathematics with AI"), the keywords
  now say AI too, and no page delivers on it. This is the loudest open item on the site: either
  add the evidence or soften the claim.
- **No downloadable artifacts except the CV.** The tutoring handouts are now linked
  (trivalleytutoring.org/resources) but nothing is hosted here.

### A nicer URL

`danielliao.github.io` is not available: a GitHub Pages user site is named after the account, and
the `danielliao` account is taken by someone else. Two ways to a better address, both his to do
because both are account actions:

1. **A custom domain**, the clean option. Buy `danielliao.com` (or `.me`, `.dev`) at any
   registrar, then: add a file called `CNAME` at the repo root containing just the bare domain;
   at the registrar point four `A` records for the apex at `185.199.108.153`, `185.199.109.153`,
   `185.199.110.153`, `185.199.111.153`, and a `CNAME` for `www` at `theebayuser.github.io`;
   then in the repo's Settings → Pages set the custom domain and tick **Enforce HTTPS** once the
   certificate is issued (usually minutes, sometimes an hour). Old `theebayuser.github.io` links
   keep working, GitHub redirects them. The `og:url` and `og:image` tags in all seven pages are
   absolute and would need the new host.
2. **Rename the GitHub account** to something free like `daniel-liao`. Pages follows the rename
   automatically and costs nothing, but every old `theebayuser` link, including the ones in the
   footers of this site, changes.

## 8. How to do a round

The loop this project actually runs on:

1. **Read `system.md` first.** The decisions are made and written down; re-deciding them
   produces drift.
2. **Build.** Match the existing components before adding new ones. If a component repeats,
   it belongs in `paper.css` with a comment explaining *why*, not just what.
3. **Verify in a browser.** Not by reading the diff. Desktop and mobile widths, both palettes
   (press `b`), and actually click the widget you changed. The figures and widgets are the part
   most likely to break silently.
4. **Check the whole-page contract**: no horizontal overflow at 375px, no console errors, every
   figure still numbered in sequence, captions still true.
5. **Update the docs in the same commit** — `system.md` for new decisions, `README.md` for
   anything a visitor-facing feature changes, this file for new contracts.
6. **Commit and push.** Every round deploys; there is no staging environment.

A note on process, since it has mattered: this site is edited by both Daniel and Claude, and
the voice is Daniel's. Copy written for him should be plain, direct, definitional (say what a
thing *is* before what it means to him), and friendly. When rewriting his words, change the
voice, never the facts.
