<script setup lang="ts">
// The watch page body, shared by /vods/:id (and /live, /youtube) and /games/:id: YouTube player, the timeline across
// all parts, a controls row (chapters, part picker, copy link, download, theater, shortcuts) and the chat replay.
// On phones the same controls reflow under the video and chat goes below; nothing is dropped.
// A synthetic VOD (a merge, split or playthrough) plays windows of other VODs: its timeline is a SegmentTimeline, chat
// follows whichever source VOD is playing, and a "related" menu links a playthrough's streams and the playthroughs a VOD
// is part of. When a playthrough plays on into its next stream, a card over the video says so and counts down to go on;
// when any VOD plays to its end, a card like it suggests another one to watch.
import { gamesWithArt, useWatchView } from '@vexoulz/vods-core/kit'
import { KButton, KChip, KKbd, KMenuItem, KPopover, KPosters } from '@/ui'
import { gamePalette, learnGameColors, useToast } from '@vexoulz/ui/utils'
import { boxArt, toClock, watchPath, type DriveFile, type PlayableTimeline, type Position, type SegmentTimeline, type Span, type Vod } from '@vexoulz/vods-core'
import { computed, watchEffect } from 'vue'
import ChatPanel from '@/components/ChatPanel.vue'
import CountdownRing from '@/components/CountdownRing.vue'
import NextVodPreview from '@/components/NextVodPreview.vue'
import TickText from '@/components/TickText.vue'
import WatchTimeline from '@/components/WatchTimeline.vue'
import SiteShell from '@/components/SiteShell.vue'

const props = withDefaults(
  defineProps<{
    vod: Vod
    timeline: PlayableTimeline
    /** A synthetic VOD's timeline again, for chat and the related menu (null for a plain VOD). */
    segments?: SegmentTimeline | null
    /** A synthetic VOD's source VODs that loaded. */
    sources?: readonly Vod[]
    start: Position
    /** VOD time the timeline bar covers; defaults to the whole VOD. */
    range?: Span
    /** Label for part i in the picker and on the bar. */
    partLabel?: (i: number) => string
    /** Link to this page at VOD time t (for "copy link"). */
    shareUrl: (t: number) => string
    download?: DriveFile | null
    /** Save the watch position in this browser. */
    track?: boolean
  }>(),
  { download: null, track: true, segments: null, sources: () => [] },
)

const toast = useToast()
// The page's logic is vods-core's useWatchView (kit). Its `time` changes on every tick and is never read here: the
// clock, the time into the part and the timeline bar read it through getters, so this template doesn't re-render
// each tick.
const {
  chat,
  range,
  spans,
  label,
  cutNote,
  unplayable,
  ytEl,
  now,
  clockText,
  offsetText,
  playing,
  rate,
  partIndex,
  status,
  playerError,
  seek,
  playPart,
  statusText,
  curBad,
  prevOk,
  nextOk,
  chapters,
  chapter,
  chapterIdx,
  streamBreaks,
  streamJumps,
  chapterStream,
  theater,
  controlsOpen,
  showControls,
  fullscreen,
  toggleFullscreen,
  fullscreenLabel,
  copyLink,
  downloadUrl,
  madeOf,
  currentStream,
  appearsIn,
  relatedCount,
  AUTO_CONTINUE,
  handoffCard,
  countdown,
  grace,
  stopCountdown,
  closeHandoff,
  ending,
  rolling,
  another,
  replay,
  chatError,
  shortcuts,
} = useWatchView(props, { notify: (message, options) => toast.show(message, options) })

// Game colours are keeki's palette, so they stay with the look.
const palette = computed(() => gamePalette(props.timeline.chapters.map((c) => c.name)))
const posterGames = computed(() => gamesWithArt(chapters.value).map((g) => ({ ...g, color: palette.value.get(g.name) })))
watchEffect(() => learnGameColors(posterGames.value))
</script>

<template>
  <SiteShell fill :header="!theater">

    <div class="watch" :class="{ nochat: !chat.open }" :style="{ '--chat-w': `${chat.width}px` }">
      <section class="stage">
        <div class="video">
          <div class="video-box">
            <div class="yt"><div ref="ytEl"></div></div>
            <div v-if="playerError" class="unavail">
              <div class="k-panel un-card">
                <b>The YouTube player didn't load</b>
                <p class="k-muted">{{ playerError }} Check that youtube.com isn't blocked, then reload the page.</p>
              </div>
            </div>
            <div v-else-if="handoffCard" class="unavail bare" role="dialog" aria-label="Next stream">
              <div class="un-card handoff">
                <div class="k-eyebrow">End of {{ handoffCard.from.mark }} · {{ handoffCard.from.sub }}</div>
                <b><span class="k-mono smark-next">{{ handoffCard.to.mark }}</span> {{ handoffCard.to.title }}</b>
                <p class="k-muted">Next stream, from {{ handoffCard.to.sub }}.</p>
                <div class="un-actions handoff-actions">
                  <CountdownRing :left="countdown" :total="AUTO_CONTINUE" label="Continuing" />
                  <div class="handoff-btns">
                    <KButton :to="handoffCard.from.finish" :title="`${handoffCard.from.title}, from where this playthrough leaves it`">
                      Finish {{ handoffCard.from.mark }} on its VOD ↗
                    </KButton>
                    <!-- One button: stops the timer, then (after a short grace, against a double click) continues. -->
                    <KButton v-if="countdown !== null" class="go stop" @click="stopCountdown">Stop timer</KButton>
                    <KButton v-else variant="primary" class="go" :disabled="grace" @click="closeHandoff(true)">Continue →</KButton>
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="ending" class="unavail bare" role="dialog" :aria-label="ending.t != null ? 'Pick up where you left off' : 'Something else to watch?'">
              <div class="un-card handoff">
                <div class="k-eyebrow">End of the VOD</div>
                <b>{{ ending.t != null ? 'Pick up where you left off' : 'Something else to watch?' }}</b>
                <NextVodPreview :vod="ending.vod" :t="ending.t" />
                <div class="un-actions handoff-actions">
                  <!-- Stopped from the start, for now. -->
                  <CountdownRing :left="null" :total="AUTO_CONTINUE" label="Continuing" />
                  <div class="handoff-btns">
                    <KButton :disabled="rolling" title="Suggest a different VOD" @click="another">Another suggestion</KButton>
                    <KButton variant="primary" class="go" :to="watchPath(ending.vod, ending.t ?? undefined)">Watch →</KButton>
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="curBad" class="unavail">
              <div class="k-panel un-card" role="status">
                <div class="k-eyebrow">{{ label(partIndex) }} of {{ spans.length }}</div>
                <b>This part isn't playable on YouTube <span class="k-muted">({{ statusText[status[partIndex]!] }})</span></b>
                <p class="k-muted">
                  {{ toClock(spans[partIndex]!.start) }} – {{ toClock(spans[partIndex]!.end) }} of the VOD. The timeline keeps its place.
                </p>
                <div class="un-actions">
                  <KButton v-if="prevOk >= 0" @click="seek(spans[prevOk]!.end - 30)">← {{ label(prevOk) }}</KButton>
                  <KButton v-if="nextOk >= 0" variant="primary" @click="playPart(nextOk)">Skip to {{ label(nextOk) }} →</KButton>
                </div>
              </div>
            </div>
          </div>
          <KButton v-if="!chat.open" class="chat-reopen" icon label="Show chat" @click="chat.open = true">⇤</KButton>
        </div>

        <button
          v-if="theater"
          type="button"
          class="peek"
          :class="{ open: controlsOpen }"
          :aria-label="controlsOpen ? 'Hide controls' : 'Show controls'"
          :title="controlsOpen ? 'Hide controls (h)' : 'Show controls (h)'"
          :aria-expanded="controlsOpen"
          @click="controlsOpen = !controlsOpen"
        >
          <span aria-hidden="true">{{ controlsOpen ? '▾' : '▴' }}</span>
        </button>
        <div v-show="showControls" class="controls">
          <WatchTimeline
            :timeline="timeline"
            :range="range"
            :time="now"
            :status="status"
            :part-index="partIndex"
            :part-label="partLabel"
            :breaks="streamBreaks"
            :jumps="streamJumps"
            :palette="palette"
            :playing="playing"
            :rate="rate"
            @seek="seek"
          />
          <div class="row">
            <span class="time k-mono"><TickText :text="clockText" /> <span class="k-muted">/ {{ toClock(range.end) }}</span></span>

            <div class="now">
              <KPopover prefer="up" width="min(340px, calc(100vw - 24px))" :cap="380">
                <template #trigger="{ toggle, open }">
                  <button type="button" class="poster-btn" :class="{ open }" title="Chapters" aria-label="Chapters" @click="toggle">
                    <KPosters :games="posterGames" :size="26" />
                  </button>
                </template>
                <template #default="{ close }">
                  <div class="k-eyebrow menu-head">Chapters · {{ chapters.length }}</div>
                  <KMenuItem
                    v-for="(c, i) in chapters"
                    :key="i"
                    :current="i === chapterIdx"
                    :disabled="c.restricted"
                    :sub="chapterStream(c) ? `${chapterStream(c)} · ${toClock(c.start)}` : toClock(c.start)"
                    @click="seek(Math.max(c.start, range.start)); close()"
                  >
                    <template #lead>
                      <KPosters :games="[{ name: c.name, image: boxArt(c.image) ?? undefined, color: palette.get(c.name) }]" mode="row" :size="24" />
                    </template>
                    {{ c.name }}
                    <template v-if="cutNote(c)" #trail><KChip :title="cutNote(c)!.title">{{ cutNote(c)!.label }}</KChip></template>
                  </KMenuItem>
                </template>
              </KPopover>
              <div class="now-text">
                <div class="title" :title="vod.title">{{ vod.title }}</div>
                <div class="sub k-mono k-muted">
                  <template v-if="chapter">ch {{ chapterIdx + 1 }}/{{ chapters.length }} · {{ chapter.name }} · </template><TickText :text="offsetText" /> into {{ partLabel ? label(partIndex) : label(partIndex).toLowerCase() }}
                </div>
              </div>
            </div>

            <slot name="parts" :part-index="partIndex">
              <KPopover prefer="up" align="right" width="min(320px, calc(100vw - 24px))" :cap="360">
                <template #trigger="{ toggle, open }">
                  <KButton class="k-mono partbtn" :pressed="open" label="YouTube part" @click="toggle">
                    <span class="hide-sm">Part&nbsp;</span>{{ partIndex + 1 }}<span class="k-muted">/{{ spans.length }}</span> ▾
                  </KButton>
                </template>
                <template #default="{ close }">
                  <div class="k-eyebrow menu-head">YouTube parts · {{ spans.length }}</div>
                  <KMenuItem
                    v-for="(s, i) in spans"
                    :key="i"
                    :current="i === partIndex"
                    :sub="`${toClock(s.start)}–${toClock(s.end)}`"
                    @click="playPart(i); close()"
                  >
                    <span class="k-mono">{{ label(i) }}</span>
                    <template #trail>
                      <KChip v-if="unplayable(status[i])" tone="bad">{{ statusText[status[i]!] }}</KChip>
                      <KChip v-else-if="status[i] === 'processing'" tone="warn">processing</KChip>
                    </template>
                  </KMenuItem>
                </template>
              </KPopover>
            </slot>

            <KButton icon label="Copy link at this time" @click="copyLink">⧉</KButton>
            <KPopover v-if="relatedCount" prefer="up" align="right" width="min(320px, calc(100vw - 24px))" :cap="380">
              <template #trigger="{ toggle, open }">
                <KButton icon :label="madeOf.length ? 'Streams in this playthrough' : 'Playthroughs with this VOD'" :pressed="open" @click="toggle">☰</KButton>
              </template>
              <template #default="{ close }">
                <template v-if="madeOf.length">
                  <div class="k-eyebrow menu-head">Streams · {{ madeOf.length }}</div>
                  <div v-for="(m, i) in madeOf" :key="m.key" class="stream-row">
                    <KMenuItem :current="i === currentStream" :sub="m.sub" :title="`${m.title} · ${m.range}`" @click="seek(m.at); close()">
                      <template #lead><span class="smark k-mono">{{ m.mark }}</span></template>
                      {{ m.title }}
                    </KMenuItem>
                    <KButton icon size="sm" variant="ghost" :to="m.original" label="Open the original VOD" @click="close()">↗</KButton>
                  </div>
                </template>
                <template v-if="appearsIn.length">
                  <div class="k-eyebrow menu-head">Also in</div>
                  <KMenuItem
                    v-for="a in appearsIn"
                    :key="a.id"
                    :to="watchPath({ id: a.id, uploads: [] })"
                    :sub="a.tags.includes('compilation') ? 'playthrough' : undefined"
                    @click="close()"
                  >
                    {{ a.title || a.id }}
                  </KMenuItem>
                </template>
              </template>
            </KPopover>
            <KButton v-if="downloadUrl" icon label="Download VOD" :href="downloadUrl" external>⤓</KButton>
            <KButton icon :label="theater ? 'Leave theater mode' : 'Theater mode'" :pressed="theater" @click="theater = !theater">
              {{ theater ? '⤡' : '⤢' }}
            </KButton>
            <KButton
              icon
              :label="fullscreenLabel"
              :pressed="fullscreen.active.value"
              :disabled="!fullscreen.supported"
              @click="toggleFullscreen"
            >
              ⛶
            </KButton>
            <KPopover prefer="up" align="right" width="min(260px, calc(100vw - 24px))" role="dialog">
              <template #trigger="{ toggle, open }">
                <KButton icon label="Keyboard shortcuts" :pressed="open" @click="toggle">?</KButton>
              </template>
              <div class="k-eyebrow menu-head">Shortcuts</div>
              <div v-for="s in shortcuts" :key="s.label" class="kv">
                <KKbd>{{ s.display }}</KKbd><span class="k-muted">{{ s.label }}</span>
              </div>
            </KPopover>
          </div>
        </div>
      </section>

      <ChatPanel
        v-if="chat.open"
        :messages="replay.messages.value"
        :settings="chat"
        :error="chatError"
        :playing="playing"
        :sources="replay.sources.value"
        :served="replay.served.value"
        @hide="chat.open = false"
      />
    </div>
  </SiteShell>
</template>

<style scoped>
/* Chat width is the viewer's, in pixels (chat settings), so a bigger screen gives the video the room; never under
   240px or so wide the video gets narrower than 320px. */
.watch { display: grid; grid-template-columns: minmax(0, 1fr) clamp(240px, var(--chat-w, 340px), max(240px, calc(100% - 320px))); flex: 1; min-height: 0; }
.watch.nochat { grid-template-columns: minmax(0, 1fr); }

.stage { position: relative; display: flex; flex-direction: column; min-height: 0; min-width: 0; }
.video { position: relative; flex: 1; min-height: 0; container-type: size; display: grid; place-items: center; background: #000; }
.video-box { position: relative; width: min(100cqw, 100cqh * 16 / 9); aspect-ratio: 16 / 9; }
.yt, .yt :deep(iframe) { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.chat-reopen { position: absolute; right: 8px; top: 8px; }

.unavail { position: absolute; inset: 0; display: grid; place-items: center; padding: 12px; background: rgb(0 0 0 / 0.75); }
/* The player's own cards (next stream, end of the VOD) sit straight on the black where the video was, no panel. */
.unavail.bare { background: #000; }
.un-card { max-width: 400px; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; font-size: 14px; }
.un-card p { font-size: 13px; line-height: 1.5; margin: 0; }
.un-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
.smark-next { color: var(--k-accent); margin-right: 4px; }
.handoff-actions { align-items: center; justify-content: center; gap: 16px; flex-wrap: nowrap; }
.handoff-btns { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.go { min-width: 12ch; justify-content: center; }
.go.stop { background: var(--k-warn); border-color: var(--k-warn); color: var(--k-bg); font-weight: 600; backdrop-filter: none; }
.go.stop:hover { filter: brightness(1.08); color: var(--k-bg); }

.controls { border-top: 1px solid var(--k-line); background: rgb(0 0 0 / 0.7); }
.peek {
  display: grid; place-items: center; width: 100%; height: 14px; padding: 0; border: none; flex: none;
  background: #000; color: var(--k-muted); font-size: 10px; line-height: 1; cursor: pointer; opacity: 0.35;
  transition: opacity 0.15s, color 0.15s;
}
.peek:hover, .peek:focus-visible { opacity: 1; color: var(--k-ink); }
.peek:focus-visible { outline: 2px solid var(--k-accent); outline-offset: -2px; }
.row { display: flex; align-items: center; gap: 8px; padding: 6px 12px 8px; min-width: 0; }
.time { font-size: 12px; white-space: nowrap; }
.now { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; margin-left: 4px; }
.poster-btn { background: none; border: none; padding: 0 4px; cursor: pointer; display: flex; min-height: 32px; align-items: center; color: inherit; border-radius: var(--k-radius-sm); }
.poster-btn:focus-visible { outline: 2px solid var(--k-accent); }
.now-text { min-width: 0; line-height: 1.3; }
.title { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sub { font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.partbtn { min-width: 92px; }
.menu-head { padding: 6px 8px; }
.stream-row { display: flex; align-items: center; gap: 2px; }
.stream-row > :first-child { flex: 1; min-width: 0; }
.smark { font-size: 11px; color: var(--k-muted); min-width: 2.5ch; }
.k-menu-item.is-current .smark { color: var(--k-accent); }
.kv { display: flex; justify-content: space-between; gap: 10px; padding: 4px 8px; font-size: 12px; }

.watch > :deep(.chat) { border-left: 1px solid var(--k-line); }

@container k-site (max-width: 700px) {
  .watch, .watch.nochat { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto auto minmax(320px, 1fr); overflow-y: auto; overflow-x: hidden; }
  .stage { display: contents; }
  .video { flex: none; container-type: inline-size; }
  .video-box { width: 100%; }
  .video:has(.unavail) .video-box { aspect-ratio: auto; min-height: 56.25cqw; display: grid; }
  .unavail { position: relative; }
  .video:has(.unavail) .yt { visibility: hidden; }
  /* Same controls as desktop, reflowed: title on its own line, everything else wraps below it */
  .row { flex-wrap: wrap; gap: 6px; }
  .time { margin-right: auto; }
  .now { order: -1; flex-basis: 100%; margin-left: 0; }
  .partbtn { min-width: 0; }
  .hide-sm { display: none; }
  .watch > :deep(.chat) { border-left: none; border-top: 1px solid var(--k-line); }
}
</style>
