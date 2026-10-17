<script setup lang="ts">
// Hand-edit a VOD's chapters: game (Twitch category search), start / end times, restricted (cut for DMCA). A strip on
// top shows the result against the VOD's length. "Lock" keeps the automatic chapters step from overwriting the edit.
// The logic is vods-core's useChaptersDraft (kit); this draws it, with keeki's game colours.
import { KButton, KCallout, KCheckbox, KChip, KSwitch } from '@/ui'
import { gamePalette, useToast } from '@vex/ui/utils'
import { toClock } from '@vex/vods-core'
import { computed } from 'vue'
import { type AdminVod, useChaptersDraft } from '@vex/vods-core/kit'
import GameSearch from '@/components/manage/GameSearch.vue'
import TimeInput from '@/components/manage/TimeInput.vue'

const props = defineProps<{ vod: AdminVod; duration: number }>()
const emit = defineEmits<{ saved: [vod: AdminVod] }>()
const toast = useToast()

const { rows, error, saving, dirty, errors, reset, save, remove, locked, gaps, sorted, label, total, pct, game, setGame, add, split, sortRows } =
  useChaptersDraft(props, { saved: (vod) => emit('saved', vod), notify: (message, options) => toast.show(message, options) })
const palette = computed(() => gamePalette(rows.value.map(label)))
</script>

<template>
  <div class="chapters">
    <div class="strip" role="img" :aria-label="`${rows.length} chapters over ${toClock(total)}`">
      <span
        v-for="r in rows"
        :key="r.key"
        class="seg"
        :class="{ 'is-restricted': r.restricted, 'is-bad': errors.has(r.key) }"
        :style="{ left: pct(r.start), width: `calc(${pct(r.end)} - ${pct(r.start)})`, backgroundColor: palette.get(label(r)) }"
        :title="`${label(r)} · ${toClock(r.start)}–${toClock(r.end)}`"
      />
    </div>
    <div class="strip-scale k-mono k-muted"><span>0:00</span><span>{{ toClock(total) }}</span></div>

    <p v-if="!rows.length" class="k-muted empty">No chapters. Add one, or re-fetch them from Twitch in the actions above.</p>
    <ol class="rows">
      <li v-for="(r, i) in rows" :key="r.key" class="row" :class="{ 'has-error': errors.has(r.key) }">
        <span class="n k-mono k-muted">{{ i + 1 }}</span>
        <GameSearch class="g" :model-value="game(r)" :label="`chapter ${i + 1}`" @update:model-value="setGame(r, $event)" />
        <div class="times">
          <TimeInput v-model="r.start" :label="`Chapter ${i + 1} start`" :invalid="errors.has(r.key)" />
          <span class="k-muted" aria-hidden="true">→</span>
          <TimeInput v-model="r.end" :label="`Chapter ${i + 1} end`" :invalid="errors.has(r.key)" />
          <span class="len k-mono k-muted" :title="'Length'">{{ Number.isFinite(r.end - r.start) && r.end > r.start ? toClock(r.end - r.start) : '—' }}</span>
        </div>
        <KChip v-if="r.kind === 'gap'" class="restricted" title="The stream was down here, between two merged Twitch VODs. Undo the merge to remove it.">stream down</KChip>
        <KCheckbox v-else v-model="r.restricted" class="restricted">Cut (DMCA)</KCheckbox>
        <div class="row-actions">
          <KButton variant="ghost" icon :label="`Split chapter ${i + 1} in two`" @click="split(r)">⋮</KButton>
          <KButton variant="ghost" icon :label="`Remove chapter ${i + 1}`" @click="remove(r)">×</KButton>
        </div>
        <p v-if="errors.has(r.key)" class="err">{{ errors.get(r.key) }}</p>
      </li>
    </ol>

    <p v-if="gaps.length && rows.length" class="k-muted small">
      Not covered by any chapter:
      <span v-for="(g, i) in gaps" :key="i" class="k-mono">{{ i ? ', ' : ' ' }}{{ toClock(g.start) }}–{{ toClock(g.end) }}</span>
    </p>

    <KCallout v-if="error" tone="error" title="Couldn't save the chapters">{{ error }}</KCallout>

    <div class="foot">
      <KButton @click="add">+ Add chapter</KButton>
      <KButton v-if="!sorted" variant="ghost" @click="sortRows">Sort by start</KButton>
      <span class="spacer" />
      <label class="lock"><KSwitch id="chapters-locked" v-model="locked" /><span>Lock (automatic updates skip this VOD)</span></label>
      <KButton :disabled="!dirty || saving" @click="reset">Undo changes</KButton>
      <KButton variant="primary" :loading="saving" :disabled="!dirty || errors.size > 0" @click="save">Save chapters</KButton>
    </div>
  </div>
</template>

<style scoped>
.chapters { display: flex; flex-direction: column; gap: 10px; }
.strip { position: relative; height: 14px; border-radius: 3px; background: var(--k-line); overflow: hidden; }
.seg { position: absolute; top: 0; bottom: 0; border-right: 1px solid var(--k-bg); box-sizing: border-box; }
.seg.is-restricted { background-image: repeating-linear-gradient(45deg, transparent 0 4px, rgba(0, 0, 0, 0.55) 4px 8px); }
.seg.is-bad { outline: 2px solid var(--k-bad); outline-offset: -2px; }
.strip-scale { display: flex; justify-content: space-between; font-size: 11px; margin-top: -6px; }
.empty { margin: 4px 0; }
.rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.row {
  display: grid; grid-template-columns: 22px minmax(160px, 1fr) auto auto auto; align-items: center; gap: 6px 10px;
  padding: 6px 8px; border-radius: var(--k-radius); background: rgb(255 255 255 / 0.03);
}
.row.has-error { box-shadow: inset 0 0 0 1px var(--k-bad); }
.n { font-size: 12px; text-align: right; }
.g { min-width: 0; }
.times { display: flex; align-items: center; gap: 6px; }
.len { font-size: 11px; min-width: 52px; }
.restricted { font-size: 12px; white-space: nowrap; }
.row-actions { display: flex; }
.err { grid-column: 2 / -1; margin: 0; color: var(--k-bad); font-size: 12px; }
.small { font-size: 12px; margin: 0; }
.foot { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.spacer { flex: 1; }
.lock { display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; }
@container k-site (max-width: 760px) {
  .row { grid-template-columns: 22px minmax(0, 1fr) auto; }
  .g { grid-column: 2 / 3; }
  .row-actions { grid-column: 3; grid-row: 1; }
  .times { grid-column: 2 / -1; flex-wrap: wrap; }
  .restricted { grid-column: 2 / -1; }
  .spacer { display: none; }
}
</style>
