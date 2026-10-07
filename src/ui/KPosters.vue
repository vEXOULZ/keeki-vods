<script setup lang="ts">
// Box-art posters (3:4) for a VOD's games, each edged in its game colour (the same as the chapter bar's).
// fan: two or three cards tilted like a hand · row: side by side.
import { computed } from 'vue'
import { gamePalette, initials } from '@/lib/color'
import KPlaceholder from './KPlaceholder.vue'

export type PosterGame = string | { name: string; image?: string; color?: string }

const props = withDefaults(defineProps<{ games: PosterGame[]; mode?: 'fan' | 'row'; size?: number; max?: number }>(), {
  mode: 'fan',
  size: 24,
  max: 3,
})

const all = computed(() => props.games.map((g) => (typeof g === 'string' ? { name: g } : g)))
const palette = computed(() => gamePalette(all.value.map((g) => g.name)))
const colorOf = (g: { name: string; color?: string }) => g.color ?? palette.value.get(g.name)!
const shown = computed(() => all.value.slice(0, props.max))
const extra = computed(() => all.value.length - shown.value.length)
const tilt = (i: number) => {
  if (props.mode !== 'fan' || shown.value.length < 2) return 0
  const mid = (shown.value.length - 1) / 2
  return ((i - mid) / Math.max(mid, 1)) * 6
}
</script>

<template>
  <span class="posters" :class="`is-${mode}`" :style="{ '--pw': `${size}px` }" :title="all.map((g) => g.name).join(' · ')">
    <span
      v-for="(g, i) in shown"
      :key="g.name"
      class="poster"
      :style="{ zIndex: 10 - i, transform: `rotate(${tilt(i)}deg)`, '--c': colorOf(g) }"
    >
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
  background: var(--c); border: 2px solid var(--k-panel);
}
.poster img, .poster :deep(.k-ph) { display: block; width: 100%; height: 100%; object-fit: cover; font-size: 9px; }
.poster::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: var(--c); }
.is-fan .poster + .poster { margin-left: calc(var(--pw) * -0.42); }
.is-row { gap: 4px; }
.is-row .poster { border-width: 0; }
.more { margin-left: 4px; font-size: 11px; color: var(--k-muted); }
</style>
