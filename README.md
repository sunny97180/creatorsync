# SyncDrop

Marketing site for **SyncDrop** — an AI products & services studio. Flagship capability is
lip-synced video generation: video in, audio in, perfectly lip-synced video out.

Live at **https://www.syncdrop.in/**

## Stack

Pure HTML, CSS and vanilla JavaScript. No frameworks, no bundler, no build step — the repo
is deployable as-is to GitHub Pages or any static host.

```
index.html            single page, all sections
assets/css/styles.css design system + every component
assets/js/main.js     nav, scroll reveal, counters, lip-sync demo
og.png                1200x630 Open Graph card
CNAME                 custom domain (www.syncdrop.in)
robots.txt sitemap.xml
```

The only external request is the Google Fonts stylesheet (Space Grotesk + Inter). Icons,
the logomark and the favicon are all inline SVG.

## The hero animation

`initDemo()` in `assets/js/main.js` drives a speech-shaped envelope function. The same
envelope feeds two things at once — the bar under the waveform playhead, and the mouth
path on the SVG face — so the two are visibly locked together. That is the product, shown
rather than described.

Everything animated is gated behind `prefers-reduced-motion`: the demo paints one static
frame, counters jump to their final value, and scroll reveals resolve immediately.

## Local preview

Any static server works:

```bash
python3 -m http.server 4177
```

Then open http://localhost:4177.

## Deploying

Push to the default branch with GitHub Pages set to serve from the repo root. The `CNAME`
file keeps the custom domain attached.

---

© 2026 SyncDrop
