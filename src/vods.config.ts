// What makes this site keekivods.vexoul.net: the channel it archives and its name. The logic (API, player, chat,
// lists) is @vex/vods-core's; the pages and look are this repo's own (src/).
import { defineVodsConfig } from '@vex/vods-core'
import type { VodsSiteOptions } from '@vex/vods-core/kit'

export const vodsConfig = defineVodsConfig({
  channel: 'keeki_dechu',
  twitchId: '90528258',
  apiBase: import.meta.env.VITE_ARCHIVE_API || '/backend',
  startDate: '2026-10-07',
})

export const site: VodsSiteOptions['site'] = {
  id: 'keekivods',
  name: 'Keeki Archives',
  twitchUrl: 'https://twitch.tv/keeki_dechu',
}

/**
 * Where chat's user cards look a chatter up on Twitch: doomtp-bot's `/api/v2/twitch/users` (its USER_LOOKUP_ORIGINS
 * must list this site). VITE_USER_LOOKUP overrides it; empty turns the lookup off, and a card shows what chat knows.
 */
export const USER_LOOKUP = import.meta.env.VITE_USER_LOOKUP ?? 'https://dtp.vexoul.net/api/v2/twitch/users'
