<script setup lang="ts">
// A VOD's YouTube parts: video id (paste a URL or the id), vod/live set, part number, duration. Existing videos keep
// their thumbnail; leave duration empty to keep the archive's (or while YouTube is processing).
import { KInput, KButton, KCallout, KSelect, useToast, type Option } from '@/ui'
import { type AdminVod, newYoutube, youtubeDrafts, youtubeEdits, youtubeErrors, youtubeId, type YoutubeDraft, admin, useDraftEditor } from '@vexoulz/vods-core/kit'
import TimeInput from '@/components/manage/TimeInput.vue'

const props = defineProps<{ vod: AdminVod }>()
const emit = defineEmits<{ saved: [vod: AdminVod] }>()
const toast = useToast()

const TYPES: Option<'vod' | 'live'>[] = [
  { value: 'vod', label: 'VOD', sub: 'From the Twitch VOD' },
  { value: 'live', label: 'Live', sub: 'From the live recording' },
]

const { rows, error, saving, dirty, errors, reset, save, remove } = useDraftEditor<YoutubeDraft>({
  source: () => [props.vod.id, props.vod.youtube],
  drafts: () => youtubeDrafts(props.vod.youtube),
  edits: youtubeEdits,
  validate: youtubeErrors,
  async save(rows) {
    emit('saved', await admin.saveYoutube(props.vod.id, youtubeEdits(rows)))
    toast.show('YouTube parts saved', { duration: 3000 })
  },
})

function add() {
  rows.value.push(newYoutube(rows.value, rows.value.some((r) => r.type === 'live') && !rows.value.some((r) => r.type === 'vod') ? 'live' : 'vod'))
}
function setId(r: YoutubeDraft, value: string) {
  r.id = youtubeId(value)
}
</script>

<template>
  <div class="uploads">
    <p v-if="!rows.length" class="k-muted empty">No YouTube parts.</p>
    <ol class="rows">
      <li v-for="(r, i) in rows" :key="r.key" class="row" :class="{ 'has-error': errors.has(r.key) }">
        <a v-if="r.id && r.thumbnail" :href="`https://youtu.be/${r.id}`" target="_blank" rel="noopener" class="thumb">
          <img :src="r.thumbnail" alt="" loading="lazy" />
        </a>
        <span v-else class="thumb ph" aria-hidden="true" />
        <KInput
          class="id"
          mono
          :model-value="r.id"
          :aria-label="`Part ${i + 1} video id`"
          placeholder="Video id or YouTube URL"
          @change="setId(r, ($event.target as HTMLInputElement).value)"
        />
        <KSelect v-model="r.type" :options="TYPES" width="96px" />
        <label class="part">
          <span class="k-muted">Part</span>
          <KInput v-model.number="r.part" class="num" mono type="number" min="1" step="1" :aria-label="`Row ${i + 1} part number`" />
        </label>
        <TimeInput v-model="r.duration" optional placeholder="duration" :label="`Part ${i + 1} duration`" />
        <KButton variant="ghost" icon :label="`Remove row ${i + 1}`" @click="remove(r)">×</KButton>
        <p v-if="errors.has(r.key)" class="err">{{ errors.get(r.key) }}</p>
      </li>
    </ol>
    <KCallout v-if="error" tone="error" title="Couldn't save the YouTube parts">{{ error }}</KCallout>
    <div class="foot">
      <KButton @click="add">+ Add part</KButton>
      <span class="spacer" />
      <KButton :disabled="!dirty || saving" @click="reset">Undo changes</KButton>
      <KButton variant="primary" :loading="saving" :disabled="!dirty || errors.size > 0" @click="save">Save parts</KButton>
    </div>
  </div>
</template>

<style scoped>
.uploads { display: flex; flex-direction: column; gap: 10px; }
.empty { margin: 0; }
.rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.row {
  display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; padding: 6px 8px;
  border-radius: var(--k-radius); background: rgb(255 255 255 / 0.03);
}
.row.has-error { box-shadow: inset 0 0 0 1px var(--k-bad); }
.thumb { width: 64px; aspect-ratio: 16 / 9; border-radius: 3px; overflow: hidden; flex: none; }
.thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ph { background: var(--k-line); }
.id { flex: 1 1 180px; }
.part { display: flex; align-items: center; gap: 6px; font-size: 12px; }
.num { width: 60px; }
.err { flex-basis: 100%; margin: 0; color: var(--k-bad); font-size: 12px; }
.foot { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.spacer { flex: 1; }
</style>
