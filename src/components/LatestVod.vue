<script setup lang="ts">
// The newest VOD, on the screen: its thumbnail in a frame of bulbs over a title board ("Now showing · today"), and
// beside it every chapter (each a link to that point), when it was streamed, its length, and Watch (or Resume).
import { boxArt, isFinished, toClock, watchPath, type Progress, type Vod } from '@vexoulz/vods-core'
import { gamesWithArt, relativeDay, useThumbnail } from '@vexoulz/vods-core/kit'
import { computed, watchEffect } from 'vue'
import { learnGameColors } from '@/lib/artColor'
import { gamePalette } from '@/lib/color'
import { KButton, KChapterBar, KChip, KLink, KPlaceholder, KPosters } from '@/ui'
import ThumbTags from './ThumbTags.vue'

const props = defineProps<{ vod: Vod; progress?: Progress | null }>()

const palette = computed(() => gamePalette(props.vod.chapters.map((c) => c.name)))
const games = computed(() => gamesWithArt(props.vod.chapters).map((g) => ({ ...g, color: palette.value.get(g.name) })))
watchEffect(() => learnGameColors(games.value))

const title = computed(() => props.vod.title || 'Untitled stream')
const date = computed(() =>
  props.vod.createdAt.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
)
const time = computed(() => props.vod.createdAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }))
const parts = computed(() => props.vod.uploads.filter((u) => u.type === 'vod').length || props.vod.uploads.length)
const cut = computed(() => props.vod.chapters.filter((c) => c.restricted && c.kind !== 'gap').length)
const to = computed(() => watchPath(props.vod, props.progress?.t))
// Finished before the VOD grew (a playthrough's new stream): `t` is where the new part starts.
const grown = computed(() => !!props.progress && isFinished(props.progress))
const watched = computed(() => (props.progress && props.vod.duration ? Math.min(1, props.progress.t / props.vod.duration) : 0))
const cta = computed(() => {
  const p = props.progress
  if (!p) return 'Watch'
  return grown.value ? `Watch what's new (${toClock(p.t)})` : `Resume at ${toClock(p.t)}`
})

const { src: thumb, srcset: thumbSet, onLoad: thumbLoaded, onError: thumbFailed } = useThumbnail(() => props.vod, 'always')
</script>

<template>
  <section class="latest" aria-label="Latest broadcast">
    <div class="screen">
      <div class="k-bulbs" aria-hidden="true"></div>
      <div class="thumb">
        <KLink :to="to" class="thumb-link" :aria-label="title" tabindex="-1">
          <img v-if="thumb" :src="thumb" :srcset="thumbSet" alt="" decoding="async" @load="thumbLoaded" @error="thumbFailed" />
          <KPlaceholder v-else label="no thumbnail" ratio="16 / 9" />
          <span class="dur k-mono">{{ toClock(vod.duration) }}</span>
          <span v-if="progress" class="watched" :style="{ width: `${watched * 100}%` }"></span>
          <KChapterBar v-if="vod.chapters.length" class="bar" :chapters="vod.chapters" :palette="palette" :height="6" />
        </KLink>
        <ThumbTags :vod="vod" class="tags" />
      </div>
      <div class="board">
        <span class="k-kicker kicker">Now showing · {{ relativeDay(vod.createdAt) }}</span>
        <h2 class="k-display title"><KLink :to="to">{{ title }}</KLink></h2>
      </div>
    </div>

    <div class="side k-panel">
      <span v-if="vod.chapters.length" class="k-eyebrow">Chapters · {{ vod.chapters.length }}</span>
      <ol v-if="vod.chapters.length" class="chapters">
        <li v-for="(c, i) in vod.chapters" :key="i">
          <KLink v-if="!c.restricted" :to="watchPath(vod, c.start)" class="chapter">
            <KPosters :games="[{ name: c.name, image: boxArt(c.image) ?? undefined, color: palette.get(c.name) }]" mode="row" :size="22" />
            <span class="name">{{ c.name }}</span>
            <span class="k-mono k-muted at">{{ toClock(c.start) }}</span>
          </KLink>
          <span v-else class="chapter is-cut" title="Cut from the YouTube uploads">
            <KPosters :games="[{ name: c.name, image: boxArt(c.image) ?? undefined, color: palette.get(c.name) }]" mode="row" :size="22" />
            <span class="name">{{ c.name }}</span>
            <KChip>cut</KChip>
          </span>
        </li>
      </ol>
      <div class="meta">
        <KChip k="streamed">{{ date }}, {{ time }}</KChip>
        <KChip k="length">{{ toClock(vod.duration) }}</KChip>
        <KChip v-if="parts > 1" k="parts">{{ parts }}</KChip>
        <KChip v-if="cut" k="cut" title="Chapters cut from the YouTube uploads">{{ cut }}</KChip>
        <KChip v-if="vod.drive.length" tone="ok">download</KChip>
      </div>
      <div class="actions">
        <KButton :to="to" variant="primary">{{ cta }}</KButton>
        <KButton v-if="progress" :to="watchPath(vod, 0)" variant="marquee">From the start</KButton>
        <KButton to="/vods" variant="marquee">See all VODs</KButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
.latest { display: flex; flex-wrap: wrap; gap: 28px; align-items: stretch; }
.screen {
  flex: 3 1 560px; max-width: 100%; min-width: 0; display: flex; flex-direction: column; padding: 14px;
  background: var(--k-frame); border-radius: var(--k-frame-radius);
}
.screen > .k-bulbs { margin: 0 4px 12px; }
.thumb { position: relative; }
.thumb-link { display: block; position: relative; aspect-ratio: 16 / 9; background: var(--k-thumb); color: inherit; }
.thumb-link img, .thumb-link :deep(.k-ph) { display: block; width: 100%; height: 100%; object-fit: cover; }
.dur { position: absolute; right: 10px; bottom: 16px; padding: 1px 7px; background: var(--k-bg); color: var(--k-ink); font-size: 12px; }
.watched { position: absolute; left: 0; bottom: 6px; height: 3px; background: var(--k-accent); z-index: 1; }
.bar { position: absolute; left: 0; right: 0; bottom: 0; }
.tags { position: absolute; left: -5px; top: 14px; z-index: 1; }
.board {
  display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 16px; text-align: center;
  background: var(--k-board); color: var(--k-board-ink);
}
.kicker { letter-spacing: 0.3em; }
.title { font-size: 34px; overflow-wrap: anywhere; }
.title a { color: inherit; text-decoration: none; }
.title a:hover { color: var(--k-accent); }
@container k-site (max-width: 560px) { .title { font-size: 26px; } }

.side { flex: 1 1 300px; min-width: 0; display: flex; flex-direction: column; gap: 12px; padding: 16px; }
.chapters { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; max-height: 22rem; overflow-y: auto; scrollbar-width: thin; }
.chapter {
  display: grid; grid-template-columns: 22px minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 8px 6px;
  color: var(--k-ink); text-decoration: none;
}
a.chapter:hover { background: var(--k-surface); }
a.chapter:hover .name { color: var(--k-accent); }
.chapter.is-cut { opacity: 0.6; }
.name { font-weight: 500; line-height: 1.3; overflow-wrap: anywhere; }
.at { font-size: 12px; }
.meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: auto; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
