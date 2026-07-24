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
| `index.html` | Title block, abstract, contents, selected work, notebook, contact |
| `research.html` | What combinatorics on words is; the two research projects |
| `lean.html` | Formalization: goal-state panel, library stats, contents |
| `manim.html` | Self-drawing figures, film plates, and the channel ledger |
| `education.html` | Schools, coursework, clubs, competitions, prerequisite graph |
| `personal.html` | Photos, the Sierpinski marginalia, and where to find you |
| `404.html` | Not-found page, proved by contradiction, with a stippled Mandelbrot |
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
- **Home**: the six section numerals are pinned to six actual primes on Ulam's spiral, and
  hovering either the numeral or its row in the contents lights up the other.
- **Anywhere**: keys `1`–`5` jump to the sections, `6` opens the CV, `0` goes home. The
  strip under the nav is the Thue–Morse word filling in as you scroll.
- **Hidden**: press `b` for the night board, the same paper after dark. Every figure
  repaints itself in chalk. Press it again to come back; the choice is remembered.

All of it is a bonus layer over plain HTML. With JavaScript off, the goal panel shows a
finished proof, the morphism figure shows six generations, and the stats show their real
numbers.
| `beyond.html` | Photo slideshow, activities, things you're proud of |
| `cv.html` | Typeset CV; the Print button produces a clean PDF |
| `css/paper.css` | The entire design system — every color, size, and rule |
| `js/site.js` | Thue–Morse dividers, slideshow, the canvas figure |

## Filling it in

Every spot that needs your words is wrapped in `<span class="fill">…</span>` and renders
in italic angle brackets — ⟨like this⟩ — so nothing fake ever ships by accident.
Find them all:

```bash
grep -rn 'class="fill"' *.html
```

There are about 60. The ones that matter most, in order: the CV, the "A few honest things"
paragraph on `beyond.html`, and your **GitHub and Instagram URLs**. Both are currently
`href="#"`, so find them with:

```bash
grep -rn 'href="#"' *.html
```

They appear as buttons in the contact section of `index.html`, and as text links on
`beyond.html` and `cv.html`. Replace the `#` with the real URL and delete the
`<span class="fill">url</span>` next to it.

### Photos

Drop files into `assets/photos/`, then in `beyond.html` replace each placeholder

```html
<div class="show-slide" data-caption="Your caption."><span>⟨ … ⟩</span></div>
```

with the image itself, keeping the `data-caption`:

```html
<div class="show-slide" data-caption="Your caption."><img src="assets/photos/01.jpg" alt="Describe the photo."></div>
```

Add or remove slides freely — the counter and the Plate numerals recompute themselves.

### Films

Drop `.mp4` files into `assets/video/`, then in `manim.html` swap each
`<div class="plate-frame">…</div>` for

```html
<video class="plate-frame" controls preload="metadata" poster="assets/video/film-01.jpg">
  <source src="assets/video/film-01.mp4" type="video/mp4">
</video>
```

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
