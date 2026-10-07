<script setup lang="ts">
// "Series now running": the newest playthroughs, each with what it is beside its thumbnail (the game, how many
// streams it took and when, its length, ongoing or complete, how far you are) and the button that picks it up.
// Hidden while there are none.
import { boxArt, isFinished, toClock, watchPath, type Progress, type Vod } from '@vexoulz/vods-core'
import { COMPLETE_TAG } from '@vexoulz/vods-core/kit'
import { computed } from 'vue'
import { gamePalette } from '@/lib/color'
import { KButton, KChip, KLink, KPosters, KSkeleton } from '@/ui'
import VodCard from './VodCard.vue'

const props = defineProps<{ vods: Vod[]; loading: boolean; resume: (v: Vod) => Progress | null | undefined }>()

/** What sits beside one playthrough's card. */
function details(v: Vod, p: Progress | null | undefined) {
  const s = v.synthetic
  const names = [...new Set(v.chapters.filter((c) => c.kind !== 'gap').map((c) => c.name))]
  const palette = gamePalette(names)
  const games = names.map((name) => {
    const c = v.chapters.find((ch) => ch.name === name)!
    return { name, image: boxArt(c.image) ?? undefined, color: palette.get(name) }
  })
  const day = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  const first = s?.firstLiveAt ?? v.createdAt
  const last = s?.lastLiveAt ?? first
  return {
    games,
    streams: s ? new Set(s.segments.map((g) => g.stream)).size : 0,
    played: day(first) === day(last) ? day(first) : `${day(first)} → ${day(last)}`,
    complete: v.tags.includes(COMPLETE_TAG),
    to: watchPath(v, p?.t),
    you: you(v, p),
  }
}

/** How far you are, and the button that picks it up. */
function you(v: Vod, p: Progress | null | undefined) {
  if (!p) return { text: null, cta: 'Watch' }
  if (isFinished(p)) return { text: `New since you finished it, from ${toClock(p.t)}`, cta: "Watch what's new" }
  const pct = v.duration ? Math.min(99, Math.round((p.t / v.duration) * 100)) : 0
  return { text: `You're ${pct}% in, at ${toClock(p.t)}`, cta: `Resume at ${toClock(p.t)}` }
}

const entries = computed(() =>
  props.vods.map((vod) => {
    const progress = props.resume(vod)
    return { vod, progress, ...details(vod, progress) }
  }),
)

</script>

<template>
  <section v-if="loading || vods.length" class="running" aria-label="Latest playthroughs">
    <div class="k-section-head">
      <h2>Series now running</h2>
      <KLink to="/playthroughs" class="all">See all playthroughs</KLink>
    </div>
    <div class="list" :aria-busy="loading && !vods.length">
      <template v-if="!vods.length">
        <div v-for="i in 2" :key="i" class="item">
          <KSkeleton ratio="16 / 9" />
          <div class="info"><KSkeleton w="60%" /><KSkeleton w="90%" h="0.8em" /><KSkeleton w="40%" h="0.8em" /></div>
        </div>
      </template>
      <article v-for="d in entries" v-else :key="d.vod.id" class="item">
        <VodCard :vod="d.vod" :progress="d.progress" />
        <div class="info">
          <div v-if="d.games.length" class="games">
            <KPosters :games="d.games" mode="row" :size="21" />
            <span class="game-names">{{ d.games.map((g) => g.name).join(', ') }}</span>
          </div>
          <dl class="facts">
            <div v-if="d.streams"><dt>Streams</dt><dd class="k-mono">{{ d.streams }}</dd></div>
            <div><dt>Length</dt><dd class="k-mono">{{ toClock(d.vod.duration) }}</dd></div>
            <div><dt>Played</dt><dd>{{ d.played }}</dd></div>
          </dl>
          <div class="status">
            <KChip v-if="d.complete" tone="ok">complete</KChip>
            <KChip v-else tone="accent">ongoing</KChip>
            <KChip v-if="d.vod.drive.length" tone="ok">download</KChip>
          </div>
          <p v-if="d.you.text" class="you k-muted">{{ d.you.text }}</p>
          <KButton :to="d.to" variant="primary" class="cta">{{ d.you.cta }}</KButton>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.running { display: flex; flex-direction: column; gap: 18px; }
.all { padding: 8px 0; font-weight: 700; color: var(--k-accent); }
.list { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(520px, 100%), 1fr)); gap: 24px; }
.item { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr)); gap: 18px; min-width: 0; }
.info { display: flex; flex-direction: column; gap: 12px; min-width: 0; padding: 4px 0; }
.games { display: flex; align-items: center; gap: 10px; min-width: 0; }
.game-names { font-weight: 700; line-height: 1.3; overflow-wrap: anywhere; }
.facts { margin: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; font-size: 13px; }
.facts dt { color: var(--k-muted); }
.facts dd { margin: 0; overflow-wrap: anywhere; }
.status { display: flex; flex-wrap: wrap; gap: 6px; }
.you { margin: 0; font-size: 13px; }
.cta { align-self: flex-start; margin-top: auto; }
</style>
