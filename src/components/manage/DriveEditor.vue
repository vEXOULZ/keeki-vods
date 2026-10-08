<script setup lang="ts">
// A VOD's Google Drive files (the watch page's download button). Paste a Drive link or the file id.
import { KInput, KButton, KCallout, KSelect, useToast, type Option } from '@/ui'
import { type AdminVod, driveDrafts, driveEdits, driveErrors, driveId, newDrive, type DriveDraft, admin, useDraftEditor } from '@vexoulz/vods-core/kit'

const props = defineProps<{ vod: AdminVod }>()
const emit = defineEmits<{ saved: [vod: AdminVod] }>()
const toast = useToast()

const TYPES: Option<'vod' | 'live'>[] = [
  { value: 'vod', label: 'VOD' },
  { value: 'live', label: 'Live' },
]

const { rows, error, saving, dirty, errors, reset, save, remove } = useDraftEditor<DriveDraft>({
  source: () => [props.vod.id, props.vod.drive],
  drafts: () => driveDrafts(props.vod.drive),
  edits: driveEdits,
  validate: driveErrors,
  async save(rows) {
    emit('saved', await admin.saveDrive(props.vod.id, driveEdits(rows)))
    toast.show('Drive files saved', { duration: 3000 })
  },
})
// Built here, not in the template: vue-tsc mangles a "//" in a component's attribute (it comments out the rest).
const driveUrl = (id: string) => `https://drive.google.com/file/d/${encodeURIComponent(id)}/view`
</script>

<template>
  <div class="drive">
    <p v-if="!rows.length" class="k-muted empty">No Drive files.</p>
    <ol class="rows">
      <li v-for="(r, i) in rows" :key="r.key" class="row" :class="{ 'has-error': errors.has(r.key) }">
        <KInput
          class="id"
          mono
          :model-value="r.id"
          :aria-label="`File ${i + 1} id`"
          placeholder="Drive file id or link"
          @change="r.id = driveId(($event.target as HTMLInputElement).value)"
        />
        <KSelect v-model="r.type" :options="TYPES" width="88px" />
        <KButton v-if="r.id" variant="ghost" :href="driveUrl(r.id)" external>Open ↗</KButton>
        <KButton variant="ghost" icon :label="`Remove file ${i + 1}`" @click="remove(r)">×</KButton>
        <p v-if="errors.has(r.key)" class="err">{{ errors.get(r.key) }}</p>
      </li>
    </ol>
    <KCallout v-if="error" tone="error" title="Couldn't save the Drive files">{{ error }}</KCallout>
    <div class="foot">
      <KButton @click="rows.push(newDrive())">+ Add file</KButton>
      <span class="spacer" />
      <KButton :disabled="!dirty || saving" @click="reset">Undo changes</KButton>
      <KButton variant="primary" :loading="saving" :disabled="!dirty || errors.size > 0" @click="save">Save files</KButton>
    </div>
  </div>
</template>

<style scoped>
.drive { display: flex; flex-direction: column; gap: 10px; }
.empty { margin: 0; }
.rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.row {
  display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; padding: 6px 8px;
  border-radius: var(--k-radius); background: rgb(255 255 255 / 0.03);
}
.row.has-error { box-shadow: inset 0 0 0 1px var(--k-bad); }
.id { flex: 1 1 200px; }
.err { flex-basis: 100%; margin: 0; color: var(--k-bad); font-size: 12px; }
.foot { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.spacer { flex: 1; }
</style>
