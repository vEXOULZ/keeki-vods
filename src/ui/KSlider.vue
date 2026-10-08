<script setup lang="ts">
withDefaults(defineProps<{ min?: number; max?: number; step?: number; label?: string; id?: string }>(), { min: 0, max: 100, step: 1 })
const model = defineModel<number>({ default: 0 })
</script>

<template>
  <input :id="id" v-model.number="model" class="slider" type="range" :min="min" :max="max" :step="step" :aria-label="label" />
</template>

<style scoped>
.slider { width: 100%; accent-color: var(--k-accent); }
</style>
