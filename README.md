# tomasjerousek — personal web

Static site for Tomáš Jeroušek, in two languages on separate URL trees:

- **`/` (Czech)** — `index.html` sells **„AI ve firmě za 30 dní"**, a fixed-price
  four-week AI-adoption sprint for Czech SMEs; `cv.html` is the professional CV
  (print button produces a 2-page A4 CV).
- **`/en/` (English)** — `en/index.html` + `en/cv.html`, generated mirrors of the
  root pages (see "Editing content" below). Cross-linked via `hreflang` and the
  CS | EN switch; `sitemap.xml` lists all four URLs.

No frameworks, no build step. Plain HTML + one shared stylesheet + a little
vanilla JS (scroll reveal, ambient background). No cookies, no storage,
no analytics, no forms.

**The living background** (`assets/mind.js`): a dense "thinking schematic" —
nodes joined by hairline synapses, red thought-pulses traveling the mesh and
lighting nodes up, gentle breathing drift, pointer proximity glow, click sparks.
Purely decorative (`z-index:-1`, `pointer-events:none`); static under
`prefers-reduced-motion`, hidden in print.

## Editing content

Root pages carry **both** language variants in the DOM (`lang="cs"`/`lang="en"`
tagged elements); each tree's `<html lang>` decides which one CSS shows.
**Edit only the root pages**, then regenerate the English mirrors:

```sh
python3 tools/sync_en.py
```

Never edit `en/*.html` by hand — the sync overwrites them.

## Run locally

```sh
# serve the PARENT directory so the /personal_web/ subpath matches GitHub Pages
cd .. && python3 -m http.server 8080
# then open http://localhost:8080/personal_web/
```

Serving the parent directory reproduces the `adamantinestudios.github.io/personal_web/`
URL prefix, so any accidentally root-absolute link breaks immediately instead of
only breaking in production.

## Deployment

Merges to `main` deploy automatically via `.github/workflows/deploy.yml`
(GitHub Pages, no build).

One-time setup (already done for this repo): the repository must be **public**
(GitHub Pages on private repos needs a paid plan), and Pages must be switched
on manually once — **Settings → Pages → Build and deployment → Source =
"GitHub Actions"**. The workflow's token cannot enable Pages by itself.
The site lives at `https://adamantinestudios.github.io/personal_web/`.

## Go-live checklist

Placeholders are intentional and grep-able. Before (or right after) going live:

```sh
grep -rn "\[CALENDLY_URL\]\|\[LINKEDIN_URL\]\|\[ICO\]\|\[ROK\]\|\[YEAR\]\|DOPLNIT\|TO FILL" index.html cv.html en/
```

Replace values in the **root** pages, then run `python3 tools/sync_en.py` so the
English tree picks them up.

1. `[CALENDLY_URL]` — booking link (hero CTA + pricing card on `index.html`).
2. `[LINKEDIN_URL]` — LinkedIn profile (footer of `index.html`, header of `cv.html`).
3. `[ICO]` — IČO in the footer of `index.html`.
4. `cv.html` — fill the `[ROK]`/`[YEAR]` periods and the `[DOPLNIT — …]` entries
   (previous employer, projects, education). Everything else on the CV is real.
5. Custom domain (optional, later): Settings → Pages → Custom domain; then update
   the `canonical`/OG/JSON-LD absolute URLs in both HTML files to the new domain.

## Fonts

IBM Plex Sans (400/600) + IBM Plex Mono (400), latin + latin-ext subsets
(Czech diacritics), self-hosted in `assets/fonts/` — no third-party font host.
Files are byte-identical to the published npm packages
`@fontsource/ibm-plex-sans@5.3.0` and `@fontsource/ibm-plex-mono@5.3.0`;
license in `assets/fonts/OFL.txt` (SIL OFL 1.1).

Total page weight (HTML + CSS + all fonts) is ~150 KB, well under the 300 KB budget.
