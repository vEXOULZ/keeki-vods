<script setup lang="ts" generic="T extends string">
// A small exclusive choice (rank by Time / VODs).
defineProps<{ options: { value: T; label: string; title?: string; disabled?: boolean }[]; label?: string }>()
const model = defineModel<T>()
</script>

<template>
  <div class="seg" role="radiogroup" :aria-label="label">
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      role="radio"
      :aria-checked="o.value === model"
      :disabled="o.disabled"
      :title="o.title"
      @click="model = o.value"
    >{{ o.label }}</button>
  </div>
</template>

<style scoped>
.seg { display: inline-flex; border: 1px solid var(--k-line); }
.seg button {
  height: var(--k-control); padding: 0 16px; border: 0; background: transparent; color: var(--k-ink); font-size: 14px;
  cursor: pointer;
}
.seg button[aria-checked='true'] { background: var(--k-accent); color: var(--k-accent-ink); font-weight: 700; }
.seg button:disabled { opacity: 0.45; cursor: default; }
</style>
