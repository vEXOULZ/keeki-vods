<script setup lang="ts">
// A link: RouterLink for a route (`to`), a plain <a> for anywhere else (`href`; `external` opens a new tab).
import { RouterLink } from 'vue-router'

defineProps<{ to?: string; href?: string; external?: boolean }>()
</script>

<template>
  <RouterLink v-if="to" :to="to"><slot></slot></RouterLink>
  <a v-else :href="href" :target="external ? '_blank' : undefined" :rel="external ? 'noopener' : undefined"><slot></slot></a>
</template>
