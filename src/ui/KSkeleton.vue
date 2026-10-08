<script setup lang="ts">
// A loading stand-in shaped like what it replaces, so nothing jumps when the data arrives.
withDefaults(defineProps<{ w?: string; h?: string; ratio?: string; round?: boolean }>(), { w: '100%', h: '1em', round: false })
</script>

<template>
  <span
    class="k-skeleton"
    aria-hidden="true"
    :style="{ width: w, height: ratio ? 'auto' : h, aspectRatio: ratio, borderRadius: round ? '50%' : undefined }"
  ></span>
</template>
