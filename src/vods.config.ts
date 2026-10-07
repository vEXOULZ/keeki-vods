// What makes this site keekivods.vexoul.net: the channel it archives and how it shows on the vexoul.net network.
// The site itself (pages, player, Manage) is @vexoulz/vods-core/app.
import { defineVodsConfig } from '@vexoulz/vods-core'
import type { VodsAppOptions } from '@vexoulz/vods-core/app'

export const vodsConfig = defineVodsConfig({
  channel: 'keeki_dechu',
  twitchId: '90528258',
  apiBase: import.meta.env.VITE_ARCHIVE_API || '/backend',
  startDate: '2026-10-07',
})

export const site: VodsAppOptions['site'] = {
  id: 'keekivods',
  name: 'keekivods.vexoul.net',
  twitchUrl: 'https://twitch.tv/keeki_dechu',
}
