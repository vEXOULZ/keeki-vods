<script setup lang="ts">
// A strip of game colours, one segment per chapter, sized by length; cut chapters hatched. Sits along the bottom of
// a thumbnail.
import { computed } from 'vue'
import { gamePalette } from '@/lib/color'

const props = withDefaults(
  defineProps<{ chapters: { name: string; start: number; end: number; restricted?: boolean }[]; height?: number; palette?: Map<string, string> }>(),
  { height: 5 },
)
const colors = computed(() => props.palette ?? gamePalette(props.chapters.map((c) => c.name)))
const segments = computed(() => props.chapters.map((c) => ({ ...c, len: Math.max(0, c.end - c.start) })))
</script>

<template>
  <div class="chapterbar" :style="{ height: `${height}px` }" :title="chapters.map((c) => c.name).join(' → ')">
    <span v-for="(c, i) in segments" :key="i" :class="{ cut: c.restricted }" :style="{ flexGrow: c.len, '--c': colors.get(c.name) }"></span>
  </div>
</template>

<style scoped>
.chapterbar { display: flex; }
.chapterbar > span { flex-basis: 0; min-width: 1px; background: var(--c); }
.chapterbar > .cut {
  background: repeating-linear-gradient(135deg, var(--c) 0 3px, color-mix(in srgb, var(--c) 30%, var(--k-bg)) 3px 6px);
}
</style>
