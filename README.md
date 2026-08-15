# tomasjerousek — personal web

Two-page static site for Tomáš Jeroušek:

- **`index.html`** — landing page selling **„AI ve firmě za 30 dní"**, a fixed-price
  four-week AI-adoption sprint for Czech SMEs. Czech first, EN toggle.
- **`cv.html`** — professional CV, same design system, print-friendly
  (the print button produces an A4 CV in whichever language is active).

No frameworks, no build step. Plain HTML + one shared stylesheet + a few lines of
vanilla JS (language toggle, one scroll reveal). No cookies, no analytics, no forms.

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

The workflow enables Pages by itself on the first successful run
(`configure-pages` with `enablement: true`) — note the repository must be
**public** for Pages on a free GitHub plan. If a deploy ever fails at the
configure step, set it manually once: **Settings → Pages → Build and
deployment → Source = "GitHub Actions"**. The site lives at
`https://adamantinestudios.github.io/personal_web/`.

## Go-live checklist

Placeholders are intentional and grep-able. Before (or right after) going live:

```sh
grep -rn "\[CALENDLY_URL\]\|\[LINKEDIN_URL\]\|\[ICO\]\|\[ROK\]\|\[YEAR\]\|DOPLNIT\|TO FILL" index.html cv.html
```

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
