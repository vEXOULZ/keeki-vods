<script setup lang="ts">
withDefaults(defineProps<{ label?: string; disabled?: boolean }>(), { disabled: false })
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <label class="k-check" :class="{ 'is-disabled': disabled }">
    <input v-model="model" type="checkbox" :disabled="disabled" />
    <slot>{{ label }}</slot>
  </label>
</template>
