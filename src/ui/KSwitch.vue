<script setup lang="ts">
// An on/off switch, with its label (the default slot or `label`).
withDefaults(defineProps<{ label?: string; disabled?: boolean; id?: string }>(), { disabled: false })
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <label class="check" :class="{ disabled }">
    <button :id="id" type="button" role="switch" class="switch" :class="{ on: model }" :aria-checked="model" :disabled="disabled" @click="model = !model"></button>
    <slot>{{ label }}</slot>
  </label>
</template>

<style scoped>
.check { display: inline-flex; align-items: center; gap: 10px; min-height: 32px; cursor: pointer; font-size: 14px; }
.check.disabled { opacity: 0.5; cursor: default; }
.switch {
  position: relative; flex: none; width: 38px; height: 22px; padding: 0; border: 1px solid var(--k-line);
  border-radius: 11px; background: var(--k-bg); cursor: inherit;
}
.switch::after {
  content: ''; position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; border-radius: 50%;
  background: var(--k-muted); transition: transform 120ms ease;
}
.switch.on { background: var(--k-accent); border-color: var(--k-accent); }
.switch.on::after { transform: translateX(16px); background: var(--k-accent-ink); }
@media (prefers-reduced-motion: reduce) { .switch::after { transition: none; } }
</style>
