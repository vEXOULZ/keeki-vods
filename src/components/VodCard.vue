<script setup lang="ts">
// One VOD in a list, as a showing card: the thumbnail with its length and chapter strip, the games' posters hanging
// off its corner (a button: the chapters, each a link to that point), and the title in a strip below. Where you
// stopped shows on the thumbnail with a bar for how much you've seen. Drawn tags hang off the thumbnail's left edge
// (ThumbTags); the rest are chips by the date.
import { boxArt, isFinished, toClock, watchPath, type Progress, type Vod } from '@vexoulz/vods-core'
import { cutNote, gamesWithArt, splitTags, tagStyle, useThumbnail } from '@vexoulz/vods-core/kit'
import { computed, watchEffect } from 'vue'
import { learnGameColors } from '@/lib/artColor'
import { gamePalette } from '@/lib/color'
import { KChapterBar, KChip, KLink, KMenuItem, KPlaceholder, KPopover, KPosters } from '@/ui'
import ThumbTags from './ThumbTags.vue'

const props = defineProps<{ vod: Vod; progress?: Progress | null }>()

// One palette for this VOD's posters, chapter strip and chapter list, so similar games get told apart the same way.
const palette = computed(() => gamePalette(props.vod.chapters.map((c) => c.name)))
const games = computed(() => gamesWithArt(props.vod.chapters).map((g) => ({ ...g, color: palette.value.get(g.name) })))
watchEffect(() => learnGameColors(games.value))
const date = computed(() => props.vod.createdAt.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }))
const to = computed(() => watchPath(props.vod, props.progress?.t))
// Finished before the VOD grew (a playthrough's new stream): `t` is where the new part starts.
const grown = computed(() => !!props.progress && isFinished(props.progress))
const watched = computed(() => (props.progress && props.vod.duration ? Math.min(1, props.progress.t / props.vod.duration) : 0))
const title = computed(() => props.vod.title || 'Untitled stream')
const chips = computed(() => splitTags(props.vod).chips.map((name) => ({ name, ...tagStyle(name) })))

const { src: thumb, srcset: thumbSet, onLoad: thumbLoaded, onError: thumbFailed } = useThumbnail(() => props.vod, 'hidpi')
</script>

<template>
  <article class="card">
    <div class="thumb">
      <KLink :to="to" class="thumb-link" :aria-label="title" tabindex="-1">
        <img v-if="thumb" :src="thumb" :srcset="thumbSet" alt="" loading="lazy" decoding="async" @load="thumbLoaded" @error="thumbFailed" />
        <KPlaceholder v-else label="no thumbnail" ratio="16 / 9" />
        <span class="dur k-mono">{{ toClock(vod.duration) }}</span>
        <template v-if="progress">
          <span
            class="resume k-mono"
            :title="grown ? `New since you finished it, from ${toClock(progress.t)}. Opens the VOD right there.` : `You stopped at ${toClock(progress.t)}. Opens the VOD right there.`"
          >▶ {{ grown ? 'New ' : '' }}{{ toClock(progress.t) }}</span>
          <span class="watched" :style="{ width: `${watched * 100}%` }"></span>
        </template>
        <KChapterBar v-if="vod.chapters.length" class="bar" :chapters="vod.chapters" :palette="palette" />
      </KLink>
      <ThumbTags :vod="vod" class="tags" />
    </div>

    <KPopover v-if="games.length" class="hang" align="right" width="min(320px, calc(100vw - 24px))" :cap="340">
      <template #trigger="{ toggle, open }">
        <button
          type="button"
          class="poster-btn"
          :class="{ open }"
          :aria-label="`Chapters: ${games.map((g) => g.name).join(', ')}`"
          :aria-expanded="open"
          @click="toggle"
        >
          <KPosters :games="games" :size="20" />
        </button>
      </template>
      <template #default="{ close }">
        <div class="k-eyebrow menu-head">Chapters · {{ vod.chapters.length }}</div>
        <KMenuItem
          v-for="(c, i) in vod.chapters"
          :key="i"
          :to="c.restricted ? undefined : watchPath(vod, c.start)"
          :disabled="c.restricted"
          :sub="toClock(c.start)"
          @click="close()"
        >
          <template #lead>
            <KPosters :games="[{ name: c.name, image: boxArt(c.image) ?? undefined, color: palette.get(c.name) }]" mode="row" :size="22" />
          </template>
          {{ c.name }}
          <template v-if="cutNote(c)" #trail><KChip :title="cutNote(c)!.title">{{ cutNote(c)!.label }}</KChip></template>
        </KMenuItem>
      </template>
    </KPopover>

    <KLink :to="to" class="strip" :class="{ 'no-posters': !games.length }">
      <span class="title">{{ title }}</span>
      <span class="meta">
        <span>{{ date }}</span>
        <KChip v-for="t in chips" :key="t.name" class="tag" :style="t.color ? { color: t.color, borderColor: t.color } : undefined">{{ t.label }}</KChip>
        <span v-if="games.length" class="games">· {{ games.map((g) => g.name).join(', ') }}</span>
      </span>
    </KLink>
  </article>
</template>

<style scoped>
.card { display: flex; flex-direction: column; min-width: 0; background: var(--k-panel); border: 1px solid var(--k-line); }
.thumb { position: relative; }
.thumb-link { display: block; position: relative; aspect-ratio: 16 / 9; background: var(--k-thumb); color: inherit; }
.thumb-link img, .thumb-link :deep(.k-ph) { display: block; width: 100%; height: 100%; object-fit: cover; }
.dur, .resume { position: absolute; padding: 1px 7px; background: var(--k-bg); font-size: 12px; }
.dur { right: 8px; top: 8px; color: var(--k-ink); }
.resume { left: 8px; top: 8px; color: var(--k-accent); }
.watched { position: absolute; left: 0; bottom: 5px; height: 3px; background: var(--k-accent); z-index: 1; }
.bar { position: absolute; left: 0; right: 0; bottom: 0; }
.tags { position: absolute; left: -5px; top: 30px; z-index: 1; }

/* The posters hang in their frame off the thumbnail's bottom-right corner, over the strip. */
.hang { align-self: flex-end; height: 0; margin-right: 10px; position: relative; top: -24px; z-index: 2; }
.poster-btn { display: flex; padding: 0; border: 0; background: none; cursor: pointer; color: inherit; }
.poster-btn:hover, .poster-btn.open { filter: brightness(1.15); }
.menu-head { padding: 6px 8px; }

.strip {
  flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 6px; padding: 12px 14px 14px;
  color: inherit; text-decoration: none;
}
.strip:not(.no-posters) .title { padding-right: 84px; }
.title {
  font-family: var(--k-display); font-weight: 900; font-size: 21px; line-height: 1.05; text-transform: uppercase;
  color: var(--k-ink); overflow-wrap: anywhere;
}
.strip:hover .title, .strip:focus-visible .title, .card:has(.thumb-link:hover) .title { color: var(--k-accent); }
.meta { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 13px; color: var(--k-muted); }
.meta > span:first-child, .tag { white-space: nowrap; flex: none; }
.tag { padding: 0 6px; font-size: 12px; }
.games { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
