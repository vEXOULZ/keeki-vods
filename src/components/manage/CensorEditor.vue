<script setup lang="ts">
// What the YouTube uploads hide: stretches to blur, black out or mute, for what Twitch allows and YouTube doesn't
// (in-game nudity, say). The worker applies them to every upload after they're saved; the uploads already on YouTube
// keep what they had until the VOD is re-archived (the actions above).
import { KButton, KCallout, KCheckbox, KInput, KSelect, type Option } from '@/ui'
import { useToast } from '@vex/ui/utils'
import { computed } from 'vue'
import { toClock } from '@vex/vods-core'
import {
  type AdminVod,
  CENSOR_NOTE_MAX,
  type CensorDraft,
  type CensorVideo,
  admin,
  censorDrafts,
  censorEdits,
  censorErrors,
  censoredSeconds,
  newCensor,
  useDraftEditor,
} from '@vex/vods-core/kit'
import TimeInput from '@/components/manage/TimeInput.vue'

const props = defineProps<{ vod: AdminVod; duration: number }>()
const emit = defineEmits<{ saved: [vod: AdminVod] }>()
const toast = useToast()

const VIDEO: Option<CensorVideo>[] = [
  { value: 'none', label: 'Picture as is' },
  { value: 'blur', label: 'Blur' },
  { value: 'black', label: 'Black out' },
]

const { rows, error, saving, dirty, errors, reset, save, remove } = useDraftEditor<CensorDraft>({
  source: () => [props.vod.id, props.vod.censor],
  drafts: () => censorDrafts(props.vod.censor),
  edits: censorEdits,
  validate: (rows) => censorErrors(rows, props.duration),
  async save(rows) {
    emit('saved', await admin.saveCensor(props.vod.id, censorEdits(rows)))
    toast.show('Censor ranges saved. Re-archive the VOD to apply them to its uploads.', { duration: 6000 })
  },
})

const hidden = computed(() => censoredSeconds(props.vod.censor ?? []))
const uploaded = computed(() => (props.vod.youtube ?? []).length > 0)
</script>

<template>
  <div class="censor">
    <p class="k-muted note">
      Blur, black out or mute stretches of the uploads, for what Twitch allows and YouTube doesn't. Saved ranges apply
      to every upload from then on; <template v-if="uploaded">the parts already on YouTube keep what they had until
      you re-archive the VOD.</template><template v-else>nothing is on YouTube yet.</template>
      The VOD on this site is never changed.
    </p>
    <p v-if="!rows.length" class="k-muted empty">Nothing hidden.</p>
    <p v-else-if="hidden && !dirty" class="k-muted empty">{{ toClock(hidden) }} hidden.</p>
    <ol class="rows">
      <li v-for="(r, i) in rows" :key="r.key" class="row" :class="{ 'has-error': errors.has(r.key) }">
        <TimeInput v-model="r.start" placeholder="start" :label="`Range ${i + 1} start`" :invalid="errors.has(r.key)" />
        <span class="k-muted">to</span>
        <TimeInput v-model="r.end" placeholder="end" :label="`Range ${i + 1} end`" :invalid="errors.has(r.key)" />
        <KSelect v-model="r.video" :options="VIDEO" width="140px" :aria-label="`Range ${i + 1} picture`" />
        <KCheckbox v-model="r.mute">Mute</KCheckbox>
        <KInput
          v-model="r.note"
          class="what"
          :maxlength="CENSOR_NOTE_MAX"
          placeholder="Why (optional)"
          :aria-label="`Range ${i + 1} note`"
        />
        <KButton variant="ghost" icon :label="`Remove range ${i + 1}`" @click="remove(r)">×</KButton>
        <p v-if="errors.has(r.key)" class="err">{{ errors.get(r.key) }}</p>
      </li>
    </ol>
    <KCallout v-if="error" tone="error" title="Couldn't save the censor ranges">{{ error }}</KCallout>
    <div class="foot">
      <KButton @click="rows.push(newCensor(rows, duration))">+ Add range</KButton>
      <span class="spacer" />
      <KButton :disabled="!dirty || saving" @click="reset">Undo changes</KButton>
      <KButton variant="primary" :loading="saving" :disabled="!dirty || errors.size > 0" @click="save">Save ranges</KButton>
    </div>
  </div>
</template>

<style scoped>
.censor { display: flex; flex-direction: column; gap: 10px; }
.note, .empty { margin: 0; }
.rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.row {
  display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; padding: 6px 8px;
  border-radius: var(--k-radius); background: rgb(255 255 255 / 0.03);
}
.row.has-error { box-shadow: inset 0 0 0 1px var(--k-bad); }
.what { flex: 1 1 180px; }
.err { flex-basis: 100%; margin: 0; color: var(--k-bad); font-size: 12px; }
.foot { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.spacer { flex: 1; }
</style>
