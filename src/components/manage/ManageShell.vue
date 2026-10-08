<script setup lang="ts">
// Frame for every Manage page: the site's shell, the Manage bar, and the page's heading with its actions.
import { session } from '@vexoulz/vods-core/kit'
import SiteShell from '@/components/SiteShell.vue'
import ManageBar from './ManageBar.vue'

defineProps<{ title: string }>()
</script>

<template>
  <SiteShell>
    <ManageBar v-if="session.authenticated" />
    <div class="head">
      <h1 class="k-display">{{ title }}</h1>
      <div v-if="$slots.actions" class="actions"><slot name="actions"></slot></div>
    </div>
    <slot></slot>
  </SiteShell>
</template>

<style scoped>
.head {
  display: flex; flex-wrap: wrap; align-items: flex-end; gap: 8px 16px; margin-bottom: 20px; padding-bottom: 8px;
  border-bottom: 2px solid var(--k-ink);
}
.head h1 { flex: 1 1 auto; margin: 0; font-size: 32px; overflow-wrap: anywhere; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
