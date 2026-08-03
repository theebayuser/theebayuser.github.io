# danielliao.github.io — portfolio

A static personal site. No build step, no dependencies, no framework: seven HTML pages,
one stylesheet, one script.

```bash
python3 -m http.server 4173 --directory .
```

Then open <http://localhost:4173>.

## Files

| Path | What it is |
|---|---|
| `index.html` | Title block (the name inks itself in), abstract, the spiral contents as a wide band that draws itself, the manuscript deskstack, the animation block (a live Lorenz beside the view count), contact including a Discord handle you copy, an ink-walk tailpiece |
| `research.html` | Combinatorics on words: intro + ternary word-art, two definitions side by side, the morphism derivation full width, manuscripts with the turtle figure beside them, a Mandelbrot tailpiece |
| `lean.html` | Formalization: the goal stepper, the library measured, the catalog with its namesake figure in the rail, upstream contributions with the Elliott–Halberstam listing, a Sierpinski tailpiece |
| `manim.html` | What and how I animate, self-drawing figures (Lorenz, then a double pendulum), the reach headline, the three films (hover to scrub), the channel ledger, a strange-attractor tailpiece |
| `education.html` | "Learning, not Education": the prerequisite graph as navigation; the record (a 2×2 grid); a cubic-roots tailpiece |
| `projects.html` | Tri-Valley Tutoring (Overleaf-style worked problem, blank until compiled), USAMO Guide (video showcase + 2×3 stats), a short "also running" list, a cubic-roots tailpiece |
| `404.html` | A proof-by-contradiction not-found page, with a Clifford-attractor tailpiece |
| `cv.pdf` | The CV, a static PDF. To update it, replace this file |
| `css/paper.css` | The entire design system: every colour, size, and rule |
| `js/site.js` | Every figure, widget, and key binding |
| `data/socials.json` | Follower counts and the "currently" line (see below) |

### Follower counts

None of TikTok, Instagram, or Facebook will tell a web page how many followers an
account has: there is no public API without server-side tokens, and CORS blocks reading
the pages directly. Anything claiming to do this live is a third-party service that
rate-limits, breaks, and occasionally reports wrong numbers, which is the last thing this
site should do.

So the counts are kept by hand. Open `data/socials.json`, set each `followers` number and
the `updated` date, and the animations page picks them up and rolls them into place. The
same file holds `now`, the one-line "currently" status in every footer.

```json
{ "updated": "2026-07-23", "now": "what you are working on", "channels": [ … ] }
```

If the file fails to load, the counts stay as dashes and every link still works.

### Things you can click

- **Formalization**: the goal panel is a stepper. Press the tactic on the bar to walk the
  proof forward one line at a time (three steps) until the goal closes; `reset` starts
  over. The stats count up the first time they scroll into view.
- **Research**: press `Apply 0 → 01, 1 → 10` to grow the Thue–Morse word one generation
  at a time, up to generation 8.
- **Home**: the contents *are* Ulam's spiral. The six numerals are pinned to six actual
  primes (163, 173, 457, 887, 907, 1051) and are real links; hovering either a numeral or
  its entry in the legend beneath lights up the other and reads the section, its phrase,
  and its prime into the caption line. The legend is the no-JS fallback.
- **Education**: the prerequisite graph is the page's navigation. Every node is a button;
  clicking one opens a card with the dates and a jump link to the section below. Wide, it
  reads left to right as two chains meeting. Under 560px the same graph becomes one
  column, in the order things actually happened.
- **Anywhere**: keys `1`–`5` jump to the sections, `6` opens the CV, `0` goes home. The
  strip under the nav is the Thue–Morse word, its boxes lighting left to right as you
  scroll and dimming again as you go back up. Every page ends with a small drawn ornament
  (a tailpiece); each footer carries the five ways to reach out.
- **Hidden**: press `b` for the night board, the same paper after dark. Every figure
  repaints itself in chalk. Press it again to come back; the choice is remembered. If your
  system is set to dark and you have never chosen, the site opens on the board.
- **On a phone**: the top bar tucks itself away as you scroll down and comes back the moment
  you scroll up.
- **Discord** has no link, so the handle in the contact row and in every footer copies itself
  when you click it. If the browser refuses the clipboard, it selects the handle instead.

All of it is a bonus layer over plain HTML. With JavaScript off, the goal panel shows a
finished proof, the morphism figure shows six generations, and the stats show their real
numbers.

## Filling it in

Every placeholder is gone: nothing on the site says ⟨like this⟩ any more.

### The CV

The CV is a static PDF, `cv.pdf`, linked from the nav, the footer, the spiral, and the
`6` key. To update it, replace that one file. (The old typeset `cv.html` page is retired.)

### Follower counts

They live in `data/socials.json`, kept by hand and stamped with `updated`. A zero is
treated as "not written down yet", so that row shows a dash instead of claiming nobody
follows you. The animations page fills each row and a running total from this file; the
`now` field drives the "currently" line in every footer.

### Films

The three films live on `manim.html` (the homepage used to repeat one of them and now draws
a Lorenz instead). To add another, drop the `.mp4` into
`assets/video/` and copy an existing `figure.plate` block:

```html
<video class="plate-frame" data-film muted loop playsinline preload="metadata">
  <source src="assets/video/YourFilm.mp4" type="video/mp4">
</video>
```

The frames are portrait (9:16) and crop to fill, so a **vertical reel fits exactly** and a
landscape file shows only its centre strip. Use the vertical export. Write the caption from
what the film actually shows.

Any `[data-film]` video is a **seamless loop**: `initFilms` (in `site.js`) strips the
control bar, autoplays it muted while it is on screen, pauses it off-screen, and toggles
play/pause on click, and (with a fine pointer) scrubs as you drag across the frame; under
`prefers-reduced-motion` it never autoplays. Strip the audio
track on export (`ffmpeg -i in.mov -an … out.mp4`) since it plays muted anyway. The projects
showcase reel (`.reel`, 4:5) uses the same `data-film` behaviour in a portrait frame beside
a `.stats-grid2` (six numbers, 2×3).

### Underlines and printing

`<em class="uline">phrase</em>` marks a phrase in ballpoint; the stroke draws itself as the
line scrolls into view and is simply present without JS.

**The site prints.** `@media print` in `paper.css` strips the chrome, keeps figures with their captions, and prints external links with their URLs. Two
things happen in JS on `beforeprint`: the interactive widgets complete themselves (the
texview renders, the proof closes) and the night board is dropped and every canvas
repainted, because a chalk-coloured raster prints as nothing on white.

### Figures and the social card

Every captioned figure carries a **global `fig. N`** number: one sequence, 1–20, running in
nav order from the homepage through the 404 (interactive widgets and tailpieces included;
film plates keep their own Plate I–III series). Inserting a figure means renumbering the run,
so grep `fig\.` across the pages after any change. Renumber from the highest number down, or
the replacements collide.

`assets/og.png` (the link-preview card, 1200×630) is **drawn**, not photographed: the same
`mulberry32` ink-walk the tailpieces use, over paper stock, with the STIX title. Regenerate
it with that walk code (a short Python/PIL or canvas script) if the name or look changes;
it is linked from every page via `og:image` + `twitter:card`.

### Research detail

The research pages are deliberately written at teaser level — areas and status, no theorem
statements and no manuscript titles. When the preprints post, that is the moment to name
the results and link them; the theorem cards are already shaped to hold a real statement.

## Deploying to GitHub Pages

Create an empty repo named `<your-username>.github.io`, then:

```bash
git remote add origin https://github.com/<your-username>/<your-username>.github.io.git
git push -u origin main
```

In the repo's Settings → Pages, set the source to the `main` branch, root folder. The site
appears at `https://<your-username>.github.io` within a minute or two. Any static host
(Netlify, Vercel, Cloudflare Pages) works the same way — there is nothing to build.

## Notes

- **Write no em dashes.** The site uses commas, parentheses, colons, and full stops
  instead. `grep -c '—' *.html` should stay at 0. En dashes are fine in Thue–Morse and
  year ranges.
- Fonts load from Google Fonts and fall back to Palatino/Georgia and the system monospace
  offline, which changes the texture slightly but breaks nothing.
- The figures pause when scrolled out of view and render as a single static drawing under
  `prefers-reduced-motion`. Animation is a bonus layer: if JavaScript is off, if the tab
  loads in the background, or if anything else fails, every element stays fully visible.
- No `og:image` is set yet, so link previews show text only. Add one once there is a real
  image worth showing.
- The design system is documented in `.interface-design/system.md`. Read it before changing
  colors or spacing — the values are chosen, not arbitrary.
