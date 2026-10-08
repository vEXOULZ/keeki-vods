<script setup lang="ts">
import SiteShell from '@/components/SiteShell.vue'
import { KButton, KEmptyState } from '@/ui'
</script>

<template>
  <SiteShell>
    <KEmptyState code="404" title="Nothing showing here" text="That page doesn't exist. The VOD you're after is probably in the list.">
      <template #actions>
        <KButton to="/vods" variant="primary">Browse VODs</KButton>
        <KButton to="/" variant="marquee">Home</KButton>
      </template>
    </KEmptyState>
  </SiteShell>
</template>
