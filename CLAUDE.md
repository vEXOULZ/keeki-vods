@.conventions/CLAUDE.md

# keeki-vods

keekivods.vexoul.net: keeki_dechu's VOD archive. The site itself (list, watch page, chat replay, `/manage`) is
`@vexoulz/vods-core/app`; this repo holds only the channel config (`src/vods.config.ts`), branding and `main.ts`.
Published by `publish.yml` to the `deploy` branch.

- A change to the pages, player or Manage goes to vods-core, then a release, then a bump here (and in
  vexoulz-vods, which shares them). Never patch around vods-core here.
- The archive API (twitch-archive) is read-only from here: ask for new endpoints there.
- Dev server in `.claude/launch.json`: `keeki-dev` (:5176) proxies `/backend` to the public archive API and
  serves `/backend-admin` from vods-core's mock.
