<script setup lang="ts">
// "Most played": the games keeki has played most, hung as a wall of framed posters with their titles on a board
// beneath: by how long they can be watched in total (the default), or by how many VODs they're in (the toggle,
// remembered in this browser). A poster opens the VOD list filtered to that game.
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
    <div v-else-if="!games" class="wall" aria-busy="true">
      <div v-for="i in 6" :key="i" class="frame"><KSkeleton ratio="3 / 4" /><KSkeleton w="70%" h="0.8em" /></div>
    </div>
    <ul v-else class="wall">
      <li v-for="g in top" :key="g.name">
        <button type="button" class="frame" :title="describe(g)" @click="emit('game', g.name)">
          <span class="art">
            <img v-if="art(g)" :src="art(g)" alt="" loading="lazy" decoding="async" />
            <KPlaceholder v-else :label="g.name" ratio="3 / 4" />
          </span>
          <span class="board">
            <span class="name">{{ g.name }}</span>
            <span class="count k-mono">{{ tag(g) }}</span>
          </span>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.most { display: flex; flex-direction: column; gap: 18px; container-type: inline-size; }

/* A poster wall: upright one-sheets side by side, each in its case with its title board beneath. Pointing at one
   lights its case; nothing moves. */
.wall {
  list-style: none; margin: 0; padding: 0; display: grid; gap: 18px 14px;
  grid-template-columns: repeat(auto-fill, minmax(124px, 1fr));
}
.wall > li { display: flex; min-width: 0; }
.frame {
  display: flex; flex-direction: column; gap: 6px; width: 100%; padding: 6px; font: inherit; color: inherit; text-align: left;
  background: var(--k-frame); border: 1px solid var(--k-line); border-radius: var(--k-frame-radius);
  box-shadow: 0 10px 24px rgb(0 0 0 / 0.55); cursor: pointer;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}
.art { display: block; aspect-ratio: 3 / 4; overflow: hidden; border-radius: var(--k-radius); background: var(--k-thumb); }
.art img, .art :deep(.k-ph) { display: block; width: 100%; height: 100%; object-fit: cover; }
.board {
  display: flex; flex-direction: column; gap: 2px; padding: 6px 7px 7px; min-height: 52px;
  background: var(--k-board); color: var(--k-board-ink); border-radius: var(--k-radius);
}
.name {
  font-family: var(--k-display); font-size: 15px; font-weight: 700; line-height: 1.1; text-transform: uppercase;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere;
}
.count { margin-top: auto; font-size: 11px; color: var(--k-accent); }
.frame:hover, .frame:focus-visible {
  outline: none; border-color: var(--k-accent);
  box-shadow: 0 0 0 1px var(--k-accent), 0 0 22px rgb(242 184 75 / 0.25), 0 10px 24px rgb(0 0 0 / 0.55);
}
@container (max-width: 480px) {
  /* A row of posters that scrolls sideways, two and a bit in view. */
  .wall {
    grid-template-columns: none; grid-auto-flow: column; grid-auto-columns: 40%; gap: 12px;
    overflow-x: auto; padding-bottom: 8px; scroll-snap-type: x mandatory;
    scrollbar-width: thin; scrollbar-color: var(--k-line) transparent;
  }
  .wall > li { scroll-snap-align: start; }
}
@media (prefers-reduced-motion: reduce) {
  .frame { transition: none; }
}
</style>
