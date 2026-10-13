<script setup lang="ts">
// A game with no box art (or no category): a blank poster in its case, the game's name set on it like a title card.
// Fills its parent (a 3:4 box). Narrow ones (the inline icons) show the initials instead. Tinted with --c, the game's
// colour, when the parent sets it (KPosters).
import { initials } from '@vexoulz/ui/utils'

defineProps<{ name: string }>()
</script>

<template>
  <span class="k-noposter" role="img" :aria-label="name">
    <span class="case" aria-hidden="true"></span>
    <span class="name" aria-hidden="true">{{ name }}</span>
    <span class="ini" aria-hidden="true">{{ initials(name) }}</span>
  </span>
</template>
