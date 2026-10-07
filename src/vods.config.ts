// What makes this site keekivods.vexoul.net: the channel it archives and its name. The logic (API, player, chat,
// lists) is @vexoulz/vods-core's; the pages and look are this repo's own (src/).
import { defineVodsConfig } from '@vexoulz/vods-core'
import type { VodsSiteOptions } from '@vexoulz/vods-core/kit'

export const vodsConfig = defineVodsConfig({
  channel: 'keeki_dechu',
  twitchId: '90528258',
  apiBase: import.meta.env.VITE_ARCHIVE_API || '/backend',
  startDate: '2026-10-07',
})

export const site: VodsSiteOptions['site'] = {
  id: 'keekivods',
  name: 'Keeki Picture House',
  twitchUrl: 'https://twitch.tv/keeki_dechu',
}
