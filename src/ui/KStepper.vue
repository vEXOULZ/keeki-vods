<script setup lang="ts">
// A number with − / + buttons. Shift-click steps ×10 (chat delay: 0.1s, shift for 1s).
import { clamp, decimalsOf, stepValue } from '@/lib/number'

const props = withDefaults(defineProps<{ step?: number; min?: number; max?: number; unit?: string; label?: string; id?: string }>(), {
  step: 1,
  unit: '',
})
const model = defineModel<number>({ default: 0 })

function press(dir: 1 | -1, e: MouseEvent) {
  model.value = stepValue(model.value, dir, { step: props.step, min: props.min, max: props.max, big: e.shiftKey })
}
function typed(e: Event) {
  const v = (e.target as HTMLInputElement).valueAsNumber
  if (Number.isFinite(v)) model.value = clamp(Number(v.toFixed(decimalsOf(props.step))), props.min, props.max)
}
</script>

<template>
  <span class="stepper" role="group" :aria-label="label">
    <button
      type="button"
      class="k-btn is-icon is-sm"
      :title="`−${step}${unit} (shift: −${step * 10}${unit})`"
      :aria-label="`Decrease by ${step}${unit}`"
      :disabled="min != null && model <= min"
      @click="press(-1, $event)"
    >−</button>
    <input :id="id" class="k-input k-mono" type="number" :value="model" :step="step" :min="min" :max="max" :aria-label="label" @change="typed" />
    <button
      type="button"
      class="k-btn is-icon is-sm"
      :title="`+${step}${unit} (shift: +${step * 10}${unit})`"
      :aria-label="`Increase by ${step}${unit}`"
      :disabled="max != null && model >= max"
      @click="press(1, $event)"
    >+</button>
  </span>
</template>

<style scoped>
.stepper { display: inline-flex; align-items: center; gap: 4px; }
.stepper .k-input { width: 64px; height: var(--k-control-sm); padding: 0 6px; text-align: center; font-size: 13px; -moz-appearance: textfield; appearance: textfield; }
.stepper .k-input::-webkit-inner-spin-button { display: none; }
</style>
