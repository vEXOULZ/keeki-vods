<script setup lang="ts">
// "Nothing here": no results, nothing archived yet, a 404. A title board under a row of bulbs; always offers a way
// on (the actions slot).
defineProps<{ title: string; text?: string; code?: string }>()
</script>

<template>
  <div class="empty">
    <div class="k-bulbs is-sm" aria-hidden="true"></div>
    <div v-if="code" class="k-kicker">{{ code }}</div>
    <h2 class="k-display title">{{ title }}</h2>
    <p v-if="text || $slots.default" class="k-muted text"><slot>{{ text }}</slot></p>
    <div v-if="$slots.actions" class="actions"><slot name="actions"></slot></div>
  </div>
</template>

<style scoped>
.empty {
  display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 0 24px 44px; text-align: center;
  background: var(--k-board); border: 1px solid var(--k-line);
}
.empty .k-bulbs { align-self: stretch; margin: 0 -10px 24px; padding: 0; background-color: var(--k-frame); height: 29px; background-position: 10px 10px; background-origin: content-box; }
.title { font-size: 30px; color: var(--k-board-ink); }
.text { margin: 0; max-width: 46ch; }
.actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 6px; }
</style>
