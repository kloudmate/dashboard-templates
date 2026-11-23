# KloudMate templates

The site at [templates.kloudmate.com](https://templates.kloudmate.com/), where people browse the
KloudMate gallery: ready-made dashboards, alert rules and workflows they install by pasting an
item's ID into Import.

## Where templates come from

Templates are published from KloudMate itself: select resources on the Export panel and click
**Publish to gallery**. The site reads the public gallery API in the browser at page load, so a
new or updated template shows up without a deploy. This repository holds only the site.

- `/` lists every live item, with search and filters by type and tag.
- `/<id>/` is one item: its setup notes, what it holds and needs, Copy ID, Open in KloudMate and
  Download YAML.

## How it's built

`site/` is plain HTML, CSS and one JavaScript module, with no build step. On a push to `master`
that changes `site/`, `.github/workflows/publish.yml` copies `index.html` to `404.html` and
deploys `site/` to GitHub Pages. GitHub Pages answers an item URL with `404.html`, which renders
the item. The response status is 404, so search engines don't index item pages.

## Run it locally

```bash
npx serve --single --listen 8090 site
```

Open <http://localhost:8090>. `--single` serves `index.html` at every path, as GitHub Pages does
with `404.html`. On `localhost` the site reads the API at `http://localhost:4000` and links to
the app at `http://localhost:3001`.
