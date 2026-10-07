<script setup lang="ts">
// "Most played": the games keeki has played most, as a fanned hand of box art: by how long they can be watched in
// total (the default), or by how many VODs they're in (the toggle, remembered in this browser). A card opens the VOD
// list filtered to that game.
import { boxArt, type GamePlayed } from '@vexoulz/vods-core'
import { hasPlayTime, playTime, rankGames, relativeDay, type MostPlayedBy } from '@vexoulz/vods-core/kit'
import { computed, ref, watch, watchEffect } from 'vue'
import { learnGameColors } from '@/lib/artColor'
import { KButton, KPlaceholder, KSegmented, KSkeleton } from '@/ui'

const props = withDefaults(defineProps<{ games: GamePlayed[] | null; error?: string | null; limit?: number }>(), { limit: 8 })
const emit = defineEmits<{ game: [name: string]; retry: [] }>()

const KEY = 'vods.mostPlayedBy'
function stored(): MostPlayedBy {
  try {
    return localStorage.getItem(KEY) === 'vods' ? 'vods' : 'time'
  } catch {
    return 'time'
  }
}
const chosen = ref<MostPlayedBy>(stored())
watch(chosen, (by) => {
  try {
    localStorage.setItem(KEY, by)
  } catch {
    // private window or blocked storage: the choice just isn't remembered
  }
})
const timed = computed(() => hasPlayTime(props.games ?? []))
const by = computed<MostPlayedBy>(() => (timed.value ? chosen.value : 'vods'))
const BY = [
  { value: 'time' as const, label: 'Time' },
  { value: 'vods' as const, label: 'VODs' },
]

const top = computed(() => rankGames(props.games ?? [], by.value, props.limit))
const tag = (g: GamePlayed) =>
  by.value === 'time' ? playTime(g.watchableSeconds ?? 0) : `${g.vods} VOD${g.vods === 1 ? '' : 's'}`
function describe(g: GamePlayed) {
  const time = g.watchableSeconds !== null ? `, ${playTime(g.watchableSeconds)} to watch` : ''
  return `${g.name}: ${g.vods} VOD${g.vods === 1 ? '' : 's'}${time}, last played ${relativeDay(g.lastPlayed)}`
}
const art = (g: GamePlayed) => boxArt(g.image, 208) ?? undefined
watchEffect(() => learnGameColors(top.value.map((g) => ({ name: g.name, image: art(g) }))))
</script>

<template>
  <section class="most" aria-label="Most played games">
    <div class="k-section-head">
      <h2>Most played</h2>
      <KSegmented v-if="timed" v-model="chosen" :options="BY" label="Rank games by" />
    </div>
    <div v-if="error" class="k-muted">
      Couldn't load the games. <KButton size="sm" variant="ghost" @click="emit('retry')">Try again</KButton>
    </div>
    <div v-else-if="!games" class="hand" aria-busy="true"><KSkeleton v-for="i in 6" :key="i" w="112px" ratio="3 / 4" /></div>
    <ul v-else class="hand" :style="{ '--n': top.length }">
      <li v-for="(g, i) in top" :key="g.name" :style="{ '--i': i }">
        <button type="button" class="card" :title="describe(g)" @click="emit('game', g.name)">
          <img v-if="art(g)" :src="art(g)" alt="" loading="lazy" decoding="async" />
          <KPlaceholder v-else :label="g.name" ratio="3 / 4" />
          <span class="count k-mono">{{ tag(g) }}</span>
          <span class="name">{{ g.name }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.most { display: flex; flex-direction: column; gap: 18px; container-type: inline-size; }

/* A hand of cards: overlapping, fanned out from the middle, and the one you point at rises to the top. */
.hand {
  /* Cards shrink to fit the row (down to 80px, then the row scrolls). */
  --card: max(80px, min(132px, calc((100cqw - 24px + 20px * (var(--n) - 1)) / var(--n))));
  list-style: none; margin: 0; padding: 20px 12px 34px; display: flex; justify-content: center; gap: 0; min-width: 0;
  overflow-x: auto; overflow-y: hidden; scrollbar-width: thin; scrollbar-color: var(--k-line) transparent;
}
.hand > li {
  --off: calc(var(--i) - (var(--n) - 1) / 2);
  flex: none; position: relative; z-index: var(--i);
  transform: translateY(calc(var(--off) * var(--off) * 2px)) rotate(calc(var(--off) * 3deg));
  transition: transform 160ms ease;
}
.hand > li + li { margin-left: -20px; }
.hand > li:hover, .hand > li:focus-within { z-index: 20; transform: translateY(-10px) rotate(0deg); }
.card {
  position: relative; display: block; width: var(--card, 112px); aspect-ratio: 3 / 4; padding: 0; overflow: hidden;
  border: 2px solid var(--k-panel); border-radius: var(--k-radius); background: var(--k-surface);
  box-shadow: 0 8px 22px rgb(0 0 0 / 0.6); color: #fff; font: inherit; cursor: pointer; text-align: left;
}
.card img, .card :deep(.k-ph) { display: block; width: 100%; height: 100%; object-fit: cover; }
.card:hover, .card:focus-visible { border-color: var(--k-accent); outline: none; }
.count {
  position: absolute; top: 6px; right: 6px; padding: 0 6px; font-size: 11px; background: var(--k-bg); color: var(--k-accent);
}
.name {
  position: absolute; left: 0; right: 0; bottom: 0; padding: 20px 7px 6px; font-family: var(--k-display);
  font-size: 14px; font-weight: 700; line-height: 1.1; text-transform: uppercase;
  background: linear-gradient(transparent, rgb(0 0 0 / 0.9));
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
@container (max-width: 480px) {
  /* Too narrow to fan: a straight row that scrolls sideways. */
  .hand { justify-content: flex-start; padding: 4px 0 8px; --card: 96px; }
  .hand > li { transform: none; }
  .hand > li + li { margin-left: 8px; }
  .hand > li:hover, .hand > li:focus-within { transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .hand > li { transition: none; }
}
</style>
