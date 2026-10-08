<script setup lang="ts">
// The drawn tags hanging off a VOD's thumbnail (lib/vodTags: which tags are drawn, their color and shape). The parent
// places it outside the thumbnail's link. Each names itself on hover, and is a link to the list narrowed to it (in
// the VOD's own tab) when the list can be (lib/listQuery, tagLink); the others let clicks through to the thumbnail.
import { tagLink, splitTags, tagStyle } from '@vexoulz/vods-core/kit'
import { KLink, KTooltip } from '@/ui'
import type { Vod } from '@vexoulz/vods-core'
import { computed } from 'vue'
import TagMark from '@/components/TagMark.vue'

const props = defineProps<{ vod: Vod }>()
const tags = computed(() =>
  splitTags(props.vod).drawn.map((name) => ({ name, style: tagStyle(name), to: tagLink(props.vod, name) })),
)
</script>

<template>
  <ul v-if="tags.length" class="thumb-tags">
    <li v-for="t in tags" :key="t.name">
      <KTooltip :text="t.style.label">
        <KLink v-if="t.to" :to="t.to" class="tag-link" :aria-label="`${t.style.label}: list only these`">
          <TagMark :tag="t.style" />
        </KLink>
        <TagMark v-else :tag="t.style" />
      </KTooltip>
    </li>
  </ul>
</template>

<style scoped>
.thumb-tags { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 5px; pointer-events: none; }
li { display: flex; }
li :deep(.k-tooltip) { display: flex; pointer-events: auto; }
.tag-link { display: flex; color: inherit; text-decoration: none; border-radius: var(--k-radius-sm); }
.tag-link:hover, .tag-link:focus-visible { filter: brightness(1.15); }
.tag-link:focus-visible { outline: 2px solid var(--k-accent); outline-offset: 2px; }
</style>
