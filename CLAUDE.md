@.conventions/CLAUDE.md

# keeki-vods

keekivods.vexoul.net: keeki_dechu's VOD archive, "Keeki Picture House". It has its own UI and is not part of the
vexoul.net network: it never uses `@vexoulz/ui` or vods-core's `app` entry, and links to vexoul.net only as its maker
(the footer). Published by `publish.yml` to the `deploy` branch.

- What's shared with vods.vexoul.net is the logic, from `@vexoulz/vods-core`: the root (types, helpers), `/vue`
  (`createVods`, `useVods`, `useWatch`, `useChat`) and `/kit` (list query, tags, games, composables, the admin
  client). A fix to that logic goes to vods-core, then a release, then a bump here. Never patch around it.
- Everything you see is this repo's: `src/theme.css` (the tokens and `.k-*` classes; dark only), `src/ui/` (the
  `K*` controls), `src/components/` and `src/pages/`. New colours, sizes and fonts become tokens in `theme.css`.
- `/manage` isn't here yet: it's to be rebuilt in this UI on vods-core's `/kit` admin client.
- The archive API (twitch-archive) is read-only from here: ask for new endpoints there.
- Dev server in `.claude/launch.json`: `keeki-dev` (:5176) proxies `/backend` to the public archive API and
  serves `/backend-admin` from vods-core's mock.
