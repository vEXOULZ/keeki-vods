# keekivods.vexoul.net

[keeki_dechu](https://twitch.tv/keeki_dechu)'s VOD archive: past broadcasts with their YouTube uploads, a timeline
across all parts, and the Twitch chat replayed alongside.

The site is [`@vexoulz/vods-core`](https://github.com/vEXOULZ/vods-core)'s `app` entry, the same one
[vods.vexoul.net](https://github.com/vEXOULZ/vexoulz-vods) runs, on the shared
[`@vexoulz/ui`](https://github.com/vEXOULZ/vexoulz-ui) design. This repo is only what makes it keeki_dechu's:

- `src/vods.config.ts`: the channel, its Twitch id, the archive API and the site's entry in the vexoul.net
  network (`keekivods` in vexoulz-ui's `SITES`, which gives it its accent).
- `src/main.ts`: the styles and one `createVodsApp()` call.
- `index.html` and `public/`: title, description, favicon.

Pages, the player, chat replay and `/manage` are documented in vods-core's README. Changes to them go there, not here.

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
- `VITE_ADMIN_API`: the worker's admin API for `/manage` (default `/backend-admin`, same origin).
- `VITE_AUTH_BASE`: vexoulz-auth, the shared *.vexoul.net sign-in. Off (empty) until this site is registered
  with it. Without it, `/manage` still works through the worker's own sign-in.
- In dev, `/backend` is proxied to `VITE_DEV_API_TARGET` (default the public site), and `/backend-admin` is
  vods-core's in-memory mock (password `admin`) unless `VITE_DEV_ADMIN_TARGET` is set in `.env.local`.

## Assets still needed

- A favicon of its own (`public/favicon.ico` is vods.vexoul.net's for now).
- The vector shapes for the drawn thumbnail tags, as on vods.vexoul.net (placeholders until then).

## Publishing

`.github/workflows/publish.yml` runs the checks, builds, and pushes `dist/` to the `deploy` branch on every merge
to `main`. The site is a single-page app, so the server must answer unknown paths with `index.html` and send
`/backend/*` to the archive API (and `/backend-admin/*` to the worker's admin API). `@vexoulz/ui`,
`@vexoulz/vods-core` and `@vexoulz/platform-web` are pinned to git tags in `package.json`, and Renovate opens the
bumps.

## Infrastructure

This repo is host-agnostic: it builds and publishes, nothing more. Details about where or how the site is hosted
(machines, addresses, proxy or tunnel config, server paths, deploy scripts) belong in the private `homelab-docs`
repo and must never be committed here. `.gitignore` blocks `.env*` (except `.env.example`), `*.local.*` and
`/deploy.local/` so local host files can't slip in.
