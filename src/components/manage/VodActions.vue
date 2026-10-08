<script setup lang="ts">
// Jobs and fixes for one VOD, through the worker's existing routes. Each starts a job (shown in the VOD's job list);
// delete removes the VOD from the archive after typing its id.
import { KButton, KCheckbox, KDialog, KField, KInput, KSelect, useToast, type Option } from '@/ui'
import { computed, ref } from 'vue'
import { admin, errorMessage, isSpliced, type ActionResult, type AdminVod } from '@vexoulz/vods-core/kit'

const props = defineProps<{ vod: AdminVod }>()
const emit = defineEmits<{ job: [jobId: number]; changed: []; deleted: [] }>()
const toast = useToast()

const TYPES: Option<'vod' | 'live'>[] = [
  { value: 'vod', label: 'VOD', sub: 'The Twitch VOD' },
  { value: 'live', label: 'Live', sub: 'The live recording' },
]
const hasLive = computed(() => (props.vod.youtube ?? []).some((u) => u.type === 'live') || !!props.vod.stream_id)

const busy = ref<string | null>(null)
async function run(name: string, action: () => Promise<ActionResult>, after?: () => void) {
  busy.value = name
  try {
    const res = await action()
    toast.show(res.msg, { duration: 3500 })
    if (res.jobId != null) emit('job', res.jobId)
    after?.()
  } catch (e) {
    toast.show(errorMessage(e), { kind: 'error', duration: 6000 })
  } finally {
    busy.value = null
  }
}

const forceChapters = ref(false)

// Download again
const dlOpen = ref(false)
const dlType = ref<'vod' | 'live'>('vod')
const dlStart = ref('')
const dlEnd = ref('')
const partNum = (v: string) => (v.trim() ? Number(v) : undefined)
const dlBad = computed(() => [dlStart.value, dlEnd.value].some((v) => v.trim() && !(Number.isInteger(Number(v)) && Number(v) >= 1)))
function download() {
  dlOpen.value = false
  run('download', () => admin.redownload(props.vod.id, { type: dlType.value, startPart: partNum(dlStart.value), endPart: partNum(dlEnd.value) }))
}

// Re-upload one part
const ruOpen = ref(false)
const ruType = ref<'vod' | 'live'>('vod')
const ruPart = ref('1')
const ruBad = computed(() => !(Number.isInteger(Number(ruPart.value)) && Number(ruPart.value) >= 1))
function reupload() {
  ruOpen.value = false
  run('reupload', () => admin.reuploadPart(props.vod.id, Number(ruPart.value), ruType.value))
}

const descType = ref<'vod' | 'live'>('vod')

// A merged or split VOD no longer matches Twitch's VOD of that id: the archive refuses anything that re-fetches it.
const spliced = computed(() => isSpliced(props.vod))
const TWITCH_OFF = 'Merged or split: Twitch’s VOD of this id no longer matches it'

// Delete
const delOpen = ref(false)
const delConfirm = ref('')
function remove() {
  delOpen.value = false
  run('delete', () => admin.deleteVod(props.vod.id), () => emit('deleted'))
}
// The buttons' jobs. Here rather than inline in the template: vue-tsc reads an import inside a handler's arrow
// function as a possible ref.
const refetchChapters = () => run('chapters', () => admin.refetchChapters(props.vod.id, forceChapters.value))
const saveChat = () => run('chat', () => admin.saveChat(props.vod.id))
const botChat = () => run('botChat', () => admin.botChat(props.vod.id), () => emit('changed'))
const refreshDuration = () => run('duration', () => admin.refreshDuration(props.vod.id), () => emit('changed'))
const updateDescriptions = () => run('describe', () => admin.updateDescriptions(props.vod.id, descType.value))
</script>

<template>
  <div class="actions">
    <p v-if="spliced" class="k-muted spliced">
      This VOD was merged or split, so it no longer matches Twitch's VOD of the same id. Re-fetching from Twitch,
      downloading, re-uploading and deleting are off until that's undone (see Merge and split).
    </p>
    <div class="group">
      <div class="k-eyebrow">Metadata</div>
      <div class="btns">
        <KButton :disabled="spliced" :title="spliced ? TWITCH_OFF : undefined" :loading="busy === 'chapters'" @click="refetchChapters">Re-fetch chapters from Twitch</KButton>
        <KCheckbox v-if="vod.chaptersLocked && !spliced" v-model="forceChapters" class="small">replace hand edits (locked)</KCheckbox>
        <KButton :disabled="spliced" :title="spliced ? TWITCH_OFF : undefined" :loading="busy === 'chat'" @click="saveChat">Save chat again</KButton>
        <KButton :disabled="spliced" :title="spliced ? TWITCH_OFF : 'Read this VOD’s chat from doomtp-bot’s log (the live recording)'" :loading="busy === 'botChat'" @click="botChat">Read bot chat</KButton>
        <KButton :disabled="spliced" :title="spliced ? TWITCH_OFF : undefined" :loading="busy === 'duration'" @click="refreshDuration">Refresh duration</KButton>
      </div>
    </div>
    <div class="group">
      <div class="k-eyebrow">YouTube</div>
      <div class="btns">
        <KSelect v-if="hasLive" v-model="descType" :options="TYPES" width="96px" />
        <KButton :loading="busy === 'describe'" @click="updateDescriptions">Update descriptions</KButton>
        <KButton :disabled="spliced" :title="spliced ? TWITCH_OFF : undefined" :loading="busy === 'reupload'" @click="ruOpen = true">Re-upload a part…</KButton>
        <KButton :disabled="spliced" :title="spliced ? TWITCH_OFF : undefined" :loading="busy === 'download'" @click="dlOpen = true">Download and upload again…</KButton>
      </div>
    </div>
    <div class="group">
      <div class="k-eyebrow">Danger</div>
      <div class="btns">
        <KButton variant="danger" :disabled="spliced" :title="spliced ? TWITCH_OFF : undefined" :loading="busy === 'delete'" @click="delConfirm = ''; delOpen = true">Delete from the archive…</KButton>
      </div>
    </div>

    <KDialog v-model:open="dlOpen" title="Download and upload again">
      Downloads the VOD again (while Twitch still has it), splits it and uploads the parts. Leave the range empty for every part.
      <div class="form">
        <KField label="Source">
          <template #default="{ id }"><KSelect :id="id" v-model="dlType" :options="TYPES" width="100%" /></template>
        </KField>
        <div class="range">
          <KField label="From part"><template #default="{ id }"><KInput :id="id" v-model="dlStart" mono placeholder="1" /></template></KField>
          <KField label="To part"><template #default="{ id }"><KInput :id="id" v-model="dlEnd" mono placeholder="last" /></template></KField>
        </div>
      </div>
      <template #actions="{ close }">
        <KButton @click="close">Cancel</KButton>
        <KButton variant="primary" :disabled="dlBad" @click="download">Start</KButton>
      </template>
    </KDialog>

    <KDialog v-model:open="ruOpen" title="Re-upload a part">
      Splits that part again from the saved video (or downloads it) and uploads it as a new YouTube video.
      <div class="form range">
        <KField label="Source">
          <template #default="{ id }"><KSelect :id="id" v-model="ruType" :options="TYPES" width="100%" /></template>
        </KField>
        <KField label="Part" :error="ruBad ? 'A whole number ≥ 1.' : undefined">
          <template #default="{ id }"><KInput :id="id" v-model="ruPart" mono :invalid="ruBad" /></template>
        </KField>
      </div>
      <template #actions="{ close }">
        <KButton @click="close">Cancel</KButton>
        <KButton variant="primary" :disabled="ruBad" @click="reupload">Start</KButton>
      </template>
    </KDialog>

    <KDialog v-model:open="delOpen" title="Delete this VOD from the archive?">
      Removes the VOD with its chat, emotes and game uploads from the archive and the site. The YouTube videos stay.
      This can't be undone. Type the VOD id to confirm.
      <div class="form">
        <KInput v-model="delConfirm" mono :placeholder="vod.id" />
      </div>
      <template #actions="{ close }">
        <KButton @click="close">Keep it</KButton>
        <KButton variant="danger-solid" :disabled="delConfirm.trim() !== vod.id" @click="remove">Delete</KButton>
      </template>
    </KDialog>
  </div>
</template>

<style scoped>
.actions { display: flex; flex-direction: column; gap: 14px; }
.group { display: flex; flex-direction: column; gap: 6px; }
.btns { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.small { font-size: 12px; }
.spliced { margin: 0; font-size: 13px; max-width: 72ch; }
.form { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; color: var(--k-ink, inherit); }
.range { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
</style>
