<script setup lang="ts">
// An inline message with a coloured edge: something failed to load, with a way to try again.
withDefaults(defineProps<{ tone?: 'info' | 'ok' | 'warn' | 'error'; title?: string }>(), { tone: 'info' })
</script>

<template>
  <div class="callout" :class="`is-${tone}`" :role="tone === 'error' ? 'alert' : 'status'">
    <div class="body">
      <div v-if="title" class="title">{{ title }}</div>
      <slot></slot>
    </div>
    <div v-if="$slots.actions" class="actions"><slot name="actions"></slot></div>
  </div>
</template>

<style scoped>
.callout {
  --c: var(--k-info);
  display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 14px 16px; background: var(--k-panel);
  border: 1px solid var(--k-line); border-left: 4px solid var(--c); font-size: 14px;
}
.is-ok { --c: var(--k-ok); }
.is-warn { --c: var(--k-warn); }
.is-error { --c: var(--k-bad); }
.body { flex: 1 1 240px; min-width: 0; overflow-wrap: anywhere; }
.title { font-weight: 700; color: var(--c); }
.actions { display: flex; gap: 8px; }
</style>
