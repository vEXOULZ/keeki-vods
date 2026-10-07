<script setup lang="ts">
// Box-art posters (3:4) for a VOD's games, each with a strip of its game colour (the same as the chapter bar's).
// bill: hung side by side in their frames, like the posters outside a cinema · row: bare, for inline icons.
import { computed } from 'vue'
import { gamePalette, initials } from '@/lib/color'
import KPlaceholder from './KPlaceholder.vue'

export type PosterGame = string | { name: string; image?: string; color?: string }

const props = withDefaults(defineProps<{ games: PosterGame[]; mode?: 'bill' | 'row'; size?: number; max?: number }>(), {
  mode: 'bill',
  size: 24,
  max: 3,
})

const all = computed(() => props.games.map((g) => (typeof g === 'string' ? { name: g } : g)))
const palette = computed(() => gamePalette(all.value.map((g) => g.name)))
const colorOf = (g: { name: string; color?: string }) => g.color ?? palette.value.get(g.name)!
const shown = computed(() => all.value.slice(0, props.max))
const extra = computed(() => all.value.length - shown.value.length)
</script>

<template>
  <span class="posters" :class="`is-${mode}`" :style="{ '--pw': `${size}px` }" :title="all.map((g) => g.name).join(' · ')">
    <span v-for="g in shown" :key="g.name" class="poster" :style="{ '--c': colorOf(g) }">
      <img v-if="g.image" :src="g.image" :alt="g.name" loading="lazy" />
      <KPlaceholder v-else :label="initials(g.name)" ratio="3 / 4" />
    </span>
    <span v-if="extra > 0" class="more k-mono">+{{ extra }}</span>
  </span>
</template>

<style scoped>
.posters { display: inline-flex; align-items: center; flex: none; }
.poster {
  position: relative; display: block; flex: none; width: var(--pw); aspect-ratio: 3 / 4; overflow: hidden;
  background: var(--c);
}
.poster img, .poster :deep(.k-ph) { display: block; width: 100%; height: 100%; object-fit: cover; font-size: 9px; }
.poster::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: var(--c); }
.is-row { gap: 4px; }

/* Each in a dark frame with a lit edge, the way posters hang in their cases. */
.is-bill { gap: 3px; padding: 3px; background: var(--k-frame); box-shadow: 0 4px 12px rgb(0 0 0 / 0.6); }
.is-bill .poster { outline: 1px solid rgb(242 184 75 / 0.35); outline-offset: -1px; }
.more { margin-left: 4px; font-size: 11px; color: var(--k-muted); }
.is-bill .more { margin: 0 3px 0 1px; }
</style>
