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
| `manim.html` | Blackboard section with the live canvas figure; film plates |
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
paragraph on `beyond.html`, and your GitHub URL (search for `href="#"`).

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

- Fonts load from Google Fonts and fall back to Palatino/Georgia and the system monospace
  offline, which changes the texture slightly but breaks nothing.
- The canvas figure pauses when scrolled out of view and renders as a single static curve
  under `prefers-reduced-motion`.
- The design system is documented in `.interface-design/system.md`. Read it before changing
  colors or spacing — the values are chosen, not arbitrary.
