<script setup lang="ts">
// A labelled form field: the label, the control (the slot, given the id to put on it), then the error or help text.
import { useId } from 'vue'

defineProps<{ label: string; help?: string; error?: string }>()
const id = useId()
</script>

<template>
  <div class="k-field">
    <label :for="id" class="k-field-label">{{ label }}</label>
    <slot :id="id"></slot>
    <div v-if="error" class="k-field-error" role="alert">{{ error }}</div>
    <div v-else-if="help" class="k-field-help">{{ help }}</div>
  </div>
</template>
