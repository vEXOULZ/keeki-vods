<script setup lang="ts">
// A coloured dot for a state (live, ok, warn, down, off), with its text in the slot or `label`.
withDefaults(defineProps<{ status?: 'live' | 'ok' | 'warn' | 'down' | 'off'; label?: string }>(), { status: 'off' })
</script>

<template>
  <span class="k-status" :class="`is-${status}`">
    <span class="k-status-dot" aria-hidden="true"></span>
    <slot>{{ label }}</slot>
  </span>
</template>
