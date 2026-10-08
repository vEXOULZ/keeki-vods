<script setup lang="ts">
// One list of VODs, by tag, each its own page (kit listQuery, TABS): /vods has the plain VODs (merges and splits
// included), /playthroughs the playthroughs (one game across streams, as one video). Under the film strip, the board
// with the page's name and count, then one filter row (All resets, title search, game, tag, date range; all combinable
// and kept in the URL), a grid of cards, and "load more". A tag on a card links here narrowed to it (ThumbTags).
import { resumeProgress, type GamePlayed, type Progress, type Vod } from '@vexoulz/vods-core'
import { useVods, useVodsContext } from '@vexoulz/vods-core/vue'
import {
  hasFilters,
  loadGamesPlayed,
  parseListQuery,
  site,
  toApiFilter,
  toListQuery,
  vodsConfig,
  watchDebounced,
  type ListState,
  type Tab,
} from '@vexoulz/vods-core/kit'
import { computed, nextTick, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GamePicker from '@/components/GamePicker.vue'
import SiteShell from '@/components/SiteShell.vue'
import TagPicker from '@/components/TagPicker.vue'
import VodCard from '@/components/VodCard.vue'
import { KButton, KCallout, KDateRange, KEmptyState, KInput, KPopover, KSkeleton } from '@/ui'

const props = defineProps<{ tab: Tab }>()

const { client, progress } = useVodsContext()
const route = useRoute()
const router = useRouter()
const state = computed(() => parseListQuery(route.query, props.tab))

function go(patch: Partial<ListState>, push = false) {
  const query = toListQuery({ ...state.value, page: 1, ...patch })
  return push ? router.push({ query }) : router.replace({ query })
}

// ---- list: pages [first .. last] of the current filters ----
const { vods, total, page, loading, error, refresh } = useVods(
  () => ({ ...toApiFilter(state.value), page: state.value.page, perPage: site.perPage }),
  { append: true },
)

const shownFrom = computed(() => (page.value - Math.ceil(vods.value.length / site.perPage)) * site.perPage)
const hasMore = computed(() => shownFrom.value + vods.value.length < total.value)
const loadMore = () => go({ page: page.value + 1 })

// ---- search (debounced into the URL) ----
const titleDraft = ref(state.value.title)
watch(
  () => state.value.title,
  (t) => {
    if (t !== titleDraft.value.trim()) titleDraft.value = t
  },
)
const cancelSearch = watchDebounced(
  titleDraft,
  (t) => {
    if (t.trim() !== state.value.title) go({ title: t.trim() })
  },
  350,
)

// ---- games: every game in the archive ----
const games = shallowRef<GamePlayed[] | null>(null)
const gamesError = ref<string | null>(null)
function fetchGames(retry = false) {
  gamesError.value = null
  loadGamesPlayed(client, retry)
    .then((g) => (games.value = g))
    .catch((e: Error) => (gamesError.value = e.message || 'Something went wrong'))
}
fetchGames()
const game = computed({
  get: () => state.value.game,
  set: (g: string) => go({ game: g }),
})

function resetAll() {
  cancelSearch()
  titleDraft.value = ''
  router.replace({ query: {} })
}

const playthroughs = computed(() => state.value.tab === 'playthroughs')

// ---- tag ----
const tag = computed({
  get: () => state.value.tag,
  set: (t: string) => go({ tag: t }),
})
// A tag picked on a card further down: bring the narrowed list's top (the filter row) into view.
const bar = ref<HTMLElement | null>(null)
watch(
  () => state.value.tag,
  async (t) => {
    if (!t || !bar.value || bar.value.getBoundingClientRect().top >= 0) return
    await nextTick()
    bar.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  },
)

// ---- dates ----
const dateFrom = ref(state.value.from)
const dateTo = ref(state.value.to)
watch(state, (s) => {
  dateFrom.value = s.from
  dateTo.value = s.to
})
watch([dateFrom, dateTo], ([from, to]) => {
  if (from !== state.value.from || to !== state.value.to) go({ from, to })
})
const minDay = vodsConfig.startDate.toISOString().slice(0, 10)
const dateLabel = computed(() => {
  const { from, to } = state.value
  if (!from && !to) return 'Any date'
  return `${from || '…'} → ${to || 'now'}`
})

// ---- resume positions ----
const saved = shallowRef(new Map<string, Progress>())
progress
  .list(500)
  .then((all) => (saved.value = new Map(all.map((p) => [p.vodId, p]))))
  .catch(() => undefined)
/** Where to pick each listed VOD up, if anywhere: one that grew since it was finished (a playthrough's new stream) at the new part. */
const resumeOf = (v: Vod) => resumeProgress(saved.value.get(v.id), v.duration)
const resume = computed(() => new Map(vods.value.map((v) => [v.id, resumeOf(v)])))

const kicker = computed(() =>
  loading.value && !vods.value.length
    ? 'Checking the files…'
    : `${total.value.toLocaleString()} showing${total.value === 1 ? '' : 's'} on file`,
)
const countText = computed(() => `Showing ${(shownFrom.value + vods.value.length).toLocaleString()} of ${total.value.toLocaleString()}`)
</script>

<template>
  <SiteShell>
    <div class="marquee">
      <div class="edge"><div class="k-sprockets is-sm" aria-hidden="true"></div></div>
      <div class="board">
        <h1 class="k-display">{{ playthroughs ? 'Playthroughs' : 'Past broadcasts' }}</h1>
        <span class="k-kicker" aria-live="polite">{{ kicker }}</span>
      </div>
    </div>

    <div ref="bar" class="filters">
      <KButton variant="filter" :pressed="!hasFilters(state)" label="Clear every filter" @click="resetAll">All</KButton>
      <KInput v-model="titleDraft" class="search" type="search" placeholder="Search titles…" clearable>
        <template #icon>⌕</template>
      </KInput>
      <GamePicker v-model="game" :games="games" :error="gamesError" @retry="fetchGames(true)" />
      <TagPicker v-model="tag" :tab="state.tab" />
      <KPopover width="min(320px, calc(100vw - 32px))" role="dialog">
        <template #trigger="{ toggle, open }">
          <KButton variant="filter" :pressed="open || !!(state.from || state.to)" @click="toggle">{{ dateLabel }} ▾</KButton>
        </template>
        <div class="date-pop">
          <div class="k-eyebrow">Streamed between</div>
          <KDateRange v-model:from="dateFrom" v-model:to="dateTo" :min="minDay" />
        </div>
      </KPopover>
    </div>

    <KCallout v-if="error" tone="error" title="Couldn't load the VODs">
      {{ error.message || 'Something went wrong' }}
      <template #actions><KButton size="sm" @click="refresh">Try again</KButton></template>
    </KCallout>

    <div v-else-if="loading && !vods.length" class="grid" aria-busy="true">
      <div v-for="i in 8" :key="i" class="sk">
        <KSkeleton ratio="16 / 9" />
        <KSkeleton w="80%" />
        <KSkeleton w="45%" h="0.8em" />
      </div>
    </div>

    <KEmptyState
      v-else-if="!vods.length"
      :title="playthroughs ? 'No playthroughs match' : 'No VODs match'"
      :text="
        hasFilters(state)
          ? 'Try another search, tag or date range.'
          : playthroughs
            ? 'No playthroughs have been put together yet.'
            : 'Nothing archived yet.'
      "
    >
      <template v-if="hasFilters(state)" #actions>
        <KButton variant="primary" @click="resetAll">Clear filters</KButton>
      </template>
    </KEmptyState>

    <template v-else>
      <div class="grid">
        <VodCard v-for="v in vods" :key="v.id" :vod="v" :progress="resume.get(v.id)" />
      </div>
      <div class="more">
        <KButton v-if="hasMore" variant="marquee" accent :loading="loading" @click="loadMore">
          Load {{ site.perPage }} more
        </KButton>
        <span class="k-muted count">{{ countText }}</span>
      </div>
    </template>
  </SiteShell>
</template>

<style scoped>
.marquee { display: flex; flex-direction: column; margin-bottom: 18px; }
.edge { background: var(--k-film); padding-bottom: 20px; }
.board {
  position: relative; margin-top: -20px; padding: 14px 18px; display: flex; flex-direction: column; gap: 4px;
  background: var(--k-board); color: var(--k-board-ink); border: 1px solid var(--k-line);
}
.board h1 { margin: 0; font-size: 40px; overflow-wrap: anywhere; }
@container k-site (max-width: 560px) { .board h1 { font-size: 30px; } }

.filters { scroll-margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 20px; }
.search { flex: 1 1 220px; max-width: 360px; }
@container k-site (max-width: 700px) {
  /* Search gets its own full-width line; All, game, tag and dates share the next. */
  .search { order: -1; flex-basis: 100%; max-width: none; }
}
.date-pop { display: flex; flex-direction: column; gap: 8px; padding: 8px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(270px, 100%), 1fr)); gap: 22px 18px; }
.sk { display: flex; flex-direction: column; gap: 8px; }
.more { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: 26px; }
.count { font-size: 12px; }
</style>
