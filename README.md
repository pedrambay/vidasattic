# vidasattic.com

Landing page and link hub for **Vida's Attic** — curated vintage by
[@ittybittyvida](https://www.instagram.com/ittybittyvida/).

Plain static site: no build step, no npm, no framework. Push to `main` and
GitHub Pages serves it at [vidasattic.com](https://vidasattic.com).

```
index.html            the landing page
media-kit.html        media kit placeholder page
assets/css/styles.css the whole design system
assets/js/main.js     animations, IG embeds, copy-to-clipboard
CNAME                 custom domain — do not edit
.nojekyll             stops Jekyll touching assets/
```

---

## Editing the three things you'll actually change

### 1. Add Instagram posts to the feed panel

Open [index.html](index.html) and find the four slots marked
`SLOT 1 — PASTE SHORTCODE HERE`.

An Instagram post URL looks like this:

```
https://www.instagram.com/p/DAbc123XyZ/
                            ^^^^^^^^^^  <- this is the shortcode
```

Reels work the same way (`/reel/DAbc123XyZ/` → `DAbc123XyZ`).

Paste it between the quotes:

```html
<div class="frame" data-ig data-shortcode="DAbc123XyZ">
```

Save and reload. That's the only change needed — the frame builds the embed
itself.

Notes:

- You can paste the **whole URL** instead of just the shortcode; it gets
  parsed either way.
- An empty slot stays a styled placeholder tile rather than breaking the
  layout, so it's fine to fill in one at a time.
- Want more or fewer than four? Copy or delete a whole
  `<div class="frame">…</div>` block. The grid reflows on its own.
- The post must be **public** — private-account posts can't be embedded.

### 2. Publish the real media kit

[media-kit.html](media-kit.html) opens with a comment block spelling out three
options: link a PDF, link a Notion/Canva page, or build the kit inline on that
page. All three are a one-line swap of the *Request early access* button.

When it goes live, delete this line from the top of the file so search engines
start indexing it:

```html
<meta name="robots" content="noindex, follow">
```

### 3. Change colours, type or copy

Every colour and font lives in one `:root` block at the top of
[assets/css/styles.css](assets/css/styles.css). Change a value there and it
updates across both pages.

Text is plain HTML — edit it in place.

---

## Running it locally

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Open the site over `http://` (not by
double-clicking the file) or the Instagram embeds won't load.

---

## Design system — "Powder Blue Haberdashery"

Vintage shop-front feel: baby blue awning stripes, aged-paper cards, brass
hairlines, hang-tag link buttons.

| Token | Hex | Used for |
| --- | --- | --- |
| `--sky-wash` | `#DCEAF2` | page background |
| `--powder` | `#BFD9E6` | primary baby blue |
| `--powder-deep` | `#8FB8CC` | shadows, hover states |
| `--porcelain` | `#F7F3EA` | aged-paper cards |
| `--ink` | `#2B3A42` | text, dark panels |
| `--ink-soft` | `#5A6E78` | secondary text |
| `--brass` | `#C8A96A` | hairlines, eyelets, foil |
| `--rose-tag` | `#D89A96` | stamps, tag flags |
| `--sage` | `#A9B99E` | confirmations |

**Type** — Bodoni Moda for display, Jost for body and all-caps labels, Pinyon
Script for flourishes only.

**Texture** is all CSS and inline SVG — the paper grain, awning stripes,
scalloped edge and halftone dots are generated, not images. There are no image
files to manage.

---

## Accessibility & motion

- Every animation is disabled under `prefers-reduced-motion: reduce`; content
  lands in its final readable state.
- Skip link, visible focus rings, `aria-label`s on all icon-only links.
- The split-letter wordmark carries an `aria-label` so screen readers read
  "Vida's Attic" as one phrase.
- No horizontal scroll at any viewport width down to 320px.
