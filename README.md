# Marco Cuscunà, personal site

Static site (plain HTML/CSS/JS, no build step) for GitHub Pages.

```
index.html
assets/css/style.css
assets/js/main.js              nav, scroll reveal, PDF.js thesis viewers, lazy Instagram embeds
assets/img/marco-cutout.png    portrait with background removed
assets/pdf/                    the two theses
```

## Publish on GitHub Pages

1. Create a public repo named exactly `Markus2409.github.io`.
2. Push the contents of this folder to its `main` branch (the original CV/photo/thesis files in the root are ignored via `.gitignore`).
3. Repo → Settings → Pages → Source: *Deploy from a branch*, `main` / root.
4. The site goes live at https://markus2409.github.io

## Editing

- **About me**: `index.html`, section `#about` (marked with a TODO).
- **Instagram photos**: saved in `assets/img/instagram/` (named by post ID). To add one, save the image there and copy one of the `<li>` tiles in `.insta__grid`, changing the post link, image, alt text and location.
- After changing CSS/JS, bump the `?v=` number in `index.html` so browsers fetch the new file.

## Local preview

```
node .claude/serve.mjs . 5173
```
then open http://localhost:5173 (the PDF viewer needs a server; it won't work from `file://`).
