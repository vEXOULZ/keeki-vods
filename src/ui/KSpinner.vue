<script setup lang="ts">
withDefaults(defineProps<{ size?: number; label?: string }>(), { size: 13, label: 'Loading' })
</script>

<template>
  <span class="k-spinner" role="status" :aria-label="label" :style="{ width: `${size}px`, height: `${size}px` }"></span>
</template>
