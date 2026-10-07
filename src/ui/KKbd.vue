<script setup lang="ts">
// A key, as in the shortcuts list.
</script>

<template>
  <kbd class="kbd"><slot></slot></kbd>
</template>

<style scoped>
.kbd {
  display: inline-block; min-width: 22px; padding: 0 6px; border: 1px solid var(--k-line); border-bottom-width: 2px;
  border-radius: var(--k-radius); background: var(--k-panel); font-family: var(--k-mono); font-size: 12px;
  line-height: 20px; text-align: center; color: var(--k-ink);
}
</style>
