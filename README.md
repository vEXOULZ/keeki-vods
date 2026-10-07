# keekivods.vexoul.net

[keeki_dechu](https://twitch.tv/keeki_dechu)'s VOD archive: past broadcasts with their YouTube uploads, a timeline
across all parts, and the Twitch chat replayed alongside.

It's "Keeki Picture House": an old cinema with the lights down. The look and every page are this repo's own; the
logic underneath (the API client, the player and chat replay state, list filters, tags, games) is
[`@vexoulz/vods-core`](https://github.com/vEXOULZ/vods-core)'s, shared with
[vods.vexoul.net](https://github.com/vEXOULZ/vexoulz-vods). It isn't part of the vexoul.net network and doesn't use
its design (`@vexoulz/ui`); it links to vexoul.net only as its maker.

- `src/vods.config.ts`: the channel, its Twitch id, the archive API and the site's name.
- `src/main.ts`: the styles, `setupVodsSite()`, the router and the vods plugin.
- `src/theme.css`: the tokens (blackout colours, Big Shoulders title boards, bulbs) and the `.k-*` classes.
  Dark only.
- `src/ui/`: the controls (`KButton`, `KPopover`, `KChip`, …), `src/components/` and `src/pages/`: the site.
- `index.html` and `public/`: title, description, favicon.

Pages: Home (the latest VOD on the screen, the series now running, the most played games), `/vods` and
`/playthroughs` (filters and a card grid), the watch page (`/vods/:id`, with the YouTube parts on one timeline and
the chat replay) and `/games/:id`. Manage (`/manage`) is still to come, rebuilt in this UI.

```bash
npm install
npm run dev         # http://localhost:5176 (proxies /backend to the archive API)
npm run typecheck   # vue-tsc
npm run build       # → dist/
git config core.hooksPath .conventions/githooks   # once per clone: branch-name rules, see CONTRIBUTING.md
```

`main` is merge-only and branches follow [Conventional Branch](https://conventional-branch.github.io/)
(`feature/…`, `bugfix/…`, `hotfix/…`, `release/…`, `chore/…`). See [CONTRIBUTING.md](CONTRIBUTING.md).

## Config

See `.env.example`; everything is optional.

- `VITE_ARCHIVE_API`: the archive API (default `/backend`, same origin).
- `VITE_ADMIN_API`: the worker's admin API, for Manage once it's here (default `/backend-admin`, same origin).
- In dev, `/backend` is proxied to `VITE_DEV_API_TARGET` (default the public site), and `/backend-admin` is
  vods-core's in-memory mock (password `admin`) unless `VITE_DEV_ADMIN_TARGET` is set in `.env.local`.

## Assets still needed

- A favicon of its own (`public/favicon.ico` is vods.vexoul.net's for now).
- A marquee or logo mark for the header, if wanted (it's type only for now).
- The vector shapes for the drawn thumbnail tags, as on vods.vexoul.net (placeholders until then).

## Publishing

`.github/workflows/publish.yml` runs the checks, builds, and pushes `dist/` to the `deploy` branch on every merge
to `main`. The site is a single-page app, so the server must answer unknown paths with `index.html` and send
`/backend/*` to the archive API (and `/backend-admin/*` to the worker's admin API). `@vexoulz/vods-core` and
`@vexoulz/platform-web` are pinned to git tags in `package.json`, and Renovate opens the
bumps.

## Infrastructure

This repo is host-agnostic: it builds and publishes, nothing more. Details about where or how the site is hosted
(machines, addresses, proxy or tunnel config, server paths, deploy scripts) belong in the private `homelab-docs`
repo and must never be committed here. `.gitignore` blocks `.env*` (except `.env.example`), `*.local.*` and
`/deploy.local/` so local host files can't slip in.
