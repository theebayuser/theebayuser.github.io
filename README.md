# danielliao.github.io — portfolio

A static personal site. No build step, no dependencies, no framework: six HTML pages,
one stylesheet, one script.

```bash
python3 -m http.server 4173 --directory .
```

Then open <http://localhost:4173>.

## Files

| Path | What it is |
|---|---|
| `index.html` | Title block, abstract, the spiral contents, publications, contact |
| `research.html` | What combinatorics on words is, the projects, and the marginalia figures |
| `lean.html` | Formalization: goal-state panel, library stats, contents, Talos |
| `manim.html` | Self-drawing figures, the three films, and the channel ledger |
| `education.html` | The prerequisite graph as navigation; schools, coursework, clubs, results |
| `personal.html` | Photographs, the honest paragraph, and where to find you |
| `cv.html` | Typeset CV; the Print button produces a clean PDF |
| `404.html` | Not-found page, proved by contradiction |
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

- **Formalization**: press `by exact tm_overlapFree` in the goal panel and the goal
  closes; `reset` reopens it. The stats count up the first time they scroll into view.
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
  strip under the nav is the Thue–Morse word filling in as you scroll.
- **Hidden**: press `b` for the night board, the same paper after dark. Every figure
  repaints itself in chalk. Press it again to come back; the choice is remembered.

All of it is a bonus layer over plain HTML. With JavaScript off, the goal panel shows a
finished proof, the morphism figure shows six generations, and the stats show their real
numbers.

## Filling it in

Every placeholder is gone: nothing on the site says ⟨like this⟩ any more. Two things are
still waiting on you.

### Photographs

`assets/photos/` is **empty**, so the slideshow on `personal.html` shows a deliberate
empty state ("no plates filed"). Drop files into `assets/photos/`, then replace the single
placeholder slide with one `div` per photo:

```html
<div class="show-slide" data-active="true" data-caption="Your caption."><img src="assets/photos/01.jpg" alt="Describe the photo."></div>
<div class="show-slide" data-caption="Another caption."><img src="assets/photos/02.jpg" alt="Describe the photo."></div>
```

Update the `of 1` in `data-show-count`; the Plate numerals recompute themselves. Three to
eight photos is the right number.

### Follower counts

They live in `data/socials.json`, kept by hand and stamped with `updated`. A zero is
treated as "not written down yet", so that row shows a dash instead of claiming nobody
follows you. The animations page fills each row and a running total from this file; the
`now` field drives the "currently" line in every footer.

### Films

The three films are already in place on `manim.html`. To add another, drop the `.mp4` into
`assets/video/` and copy an existing `figure.plate` block:

```html
<video class="plate-frame" controls preload="metadata" playsinline>
  <source src="assets/video/YourFilm.mp4" type="video/mp4">
</video>
```

The frames are portrait (9:16) and crop to fill, so a **vertical reel fits exactly** and a
landscape file shows only its centre strip. Use the vertical export. Write the caption from
what the film actually shows.

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
