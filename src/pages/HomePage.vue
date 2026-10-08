<script setup lang="ts">
// The home page: the newest VOD on the screen, the series now running (the latest playthroughs), and the most played
// games. The full lists are their own pages (/vods, /playthroughs); a game card opens the VODs list narrowed to it.
import { resumeProgress, type GamePlayed, type Progress, type Vod } from '@vexoulz/vods-core'
import { useVods, useVodsContext } from '@vexoulz/vods-core/vue'
import { listPath, loadGamesPlayed, parseListQuery, toApiFilter, toListQuery, type Tab } from '@vexoulz/vods-core/kit'
import { computed, ref, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import LatestPlaythroughs from '@/components/LatestPlaythroughs.vue'
import LatestVod from '@/components/LatestVod.vue'
import MostPlayed from '@/components/MostPlayed.vue'
import SiteShell from '@/components/SiteShell.vue'

const { client, progress } = useVodsContext()
const router = useRouter()

const tabFilter = (t: Tab) => toApiFilter(parseListQuery({}, t))
const { vods: latestVods } = useVods(() => ({ ...tabFilter('vods'), page: 1, perPage: 1 }))
const latest = computed(() => latestVods.value[0] ?? null)
const { vods: latestPlaythroughs, loading: playthroughsLoading } = useVods(() => ({ ...tabFilter('playthroughs'), page: 1, perPage: 2 }))

const games = shallowRef<GamePlayed[] | null>(null)
const gamesError = ref<string | null>(null)
function fetchGames(retry = false) {
  gamesError.value = null
  loadGamesPlayed(client, retry)
    .then((g) => (games.value = g))
    .catch((e: Error) => (gamesError.value = e.message || 'Something went wrong'))
}
fetchGames()
const openGame = (game: string) => router.push({ path: listPath('vods'), query: toListQuery({ ...parseListQuery({}), game }) })

const saved = shallowRef(new Map<string, Progress>())
progress
  .list(500)
  .then((all) => (saved.value = new Map(all.map((p) => [p.vodId, p]))))
  .catch(() => undefined)
/** Where to pick a VOD up, if anywhere: one that grew since it was finished (a playthrough's new stream) at the new part. */
const resumeOf = (v: Vod) => resumeProgress(saved.value.get(v.id), v.duration)
</script>

<template>
  <SiteShell>
    <div class="home">
      <LatestVod v-if="latest" :vod="latest" :progress="resumeOf(latest)" />
      <LatestPlaythroughs :vods="latestPlaythroughs" :loading="playthroughsLoading" :resume="resumeOf" />
      <MostPlayed :games="games" :error="gamesError" @game="openGame" @retry="fetchGames(true)" />
    </div>
  </SiteShell>
</template>

<style scoped>
.home { display: flex; flex-direction: column; gap: 32px; }
</style>
