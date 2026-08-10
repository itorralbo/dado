# 🎲 Virtual dice

Web app for rolling a six-sided die. A pure-CSS 3D cube that tumbles and stops
showing the face that came up. Roll it by pressing the button, clicking the die
itself, or hitting the spacebar.

Below it there is a histogram of how many times each face has come up, with a
reference line at the expected value (total / 6), so you can watch the
distribution converge as rolls pile up.

No dependencies, no build step, no install: it's three static files
(`index.html`, `styles.css`, `app.js`).

**Live at https://itorralbo.github.io/dado/** — public, no sign-in needed.

## Running it locally

Just open `index.html` in a browser. If you'd rather serve it:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Publishing to GitHub Pages

The repository includes the `.github/workflows/deploy-pages.yml` workflow, which
deploys the site on every push to `main`.

Pages is already enabled for this repository, so nothing else is needed. To set it
up on a fork, there are two steps only the repository owner can do:

1. **Settings → General → Default branch**: keep `main` as the default branch. GitHub
   only allows deploying to the `github-pages` environment from the default branch.
2. **Settings → Pages → Source**: pick **GitHub Actions**. This can't be automated from
   the workflow itself, because the `GITHUB_TOKEN` isn't allowed to create the site.

After that, any push to `main` (or a manual **Run workflow** from the Actions tab)
publishes the site.

## Details

- Each roll's value comes from `crypto.getRandomValues` with rejection of biased
  values, so all six faces are equally likely.
- The histogram is stored in `localStorage`, so rolls accumulate across visits. The
  **Reset** button clears them.
- The result is announced through an `aria-live` region for screen readers.
- `prefers-reduced-motion` is respected: when it's on, the result appears without
  animation.
- Automatic light and dark themes following system preferences.
