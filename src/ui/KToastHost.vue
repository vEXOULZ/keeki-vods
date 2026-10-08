<script setup lang="ts">
import { useToast } from './toast'

const { toasts, dismiss } = useToast()
</script>

<template>
  <div class="toasts" aria-live="polite">
    <button v-for="t in toasts" :key="t.id" type="button" class="toast" :class="`is-${t.kind}`" @click="dismiss(t.id)">{{ t.message }}</button>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed; left: 50%; bottom: 24px; z-index: 1200; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 8px; pointer-events: none;
}
.toast {
  pointer-events: auto; padding: 8px 14px; border: 1px solid var(--k-line); border-left: 4px solid var(--k-accent);
  background: var(--k-surface); color: var(--k-ink); font-size: 13px; box-shadow: var(--k-shadow); cursor: pointer;
}
.is-error { border-left-color: var(--k-bad); }
.is-info { border-left-color: var(--k-info); }
</style>
