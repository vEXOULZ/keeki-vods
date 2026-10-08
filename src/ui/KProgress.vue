<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ value: number; max?: number; label?: string }>(), { max: 100 })
const pct = computed(() => Math.min(100, Math.max(0, (props.value / (props.max || 1)) * 100)))
</script>

<template>
  <div class="k-progress" role="progressbar" :aria-valuenow="value" aria-valuemin="0" :aria-valuemax="max" :aria-label="label">
    <span :style="{ width: `${pct}%` }"></span>
  </div>
</template>
