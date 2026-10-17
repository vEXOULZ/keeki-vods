<script setup lang="ts">
// /manage/vods?q=&hidden=&synthetic=&upload=: find a VOD to edit (GET /api/v2/vods, so hidden, merged and synthetic ones too;
// a title or an id), add ones the monitor missed (?add=<id> opens that with the id in, and "Find on Twitch" lists every
// one Twitch still has), and make a synthetic one (a playthrough, say). Status: uploaded or details only, and each
// queued, running or paused job; `upload=stuck` keeps the ones not on YouTube with no job (the overview links there). Tick VODs
// to queue them to archive, refetch their chapters, chat or emotes, hide or show them, or add or take off a tag.
import { KButton, KCallout, KCheckbox, KChip, KDialog, KField, KInput, KSegmented, KSelect, KSkeleton, KTable, type Option, type TableColumn } from '@/ui'
import { useToast } from '@vex/ui/utils'
import { toClock } from '@vex/vods-core'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AUTO_TAGS,
  VOD_BATCH,
  type VodBatchAction,
  type VodListRow,
  admin,
  jobStatus,
  site,
  tagConfig,
  uploadStatus,
  useVodBatch,
  vodBatchTargets,
  watchDebounced,
} from '@vex/vods-core/kit'
import { errorText } from '@vex/platform-web'
import ManageShell from '@/components/manage/ManageShell.vue'
import TwitchImportDialog from '@/components/manage/TwitchImportDialog.vue'

const PER_PAGE = 30
const route = useRoute()
const router = useRouter()
const toast = useToast()

type Shown = 'all' | 'shown' | 'hidden'
const SHOWN: Option<Shown>[] = [
  { value: 'all', label: 'All' },
  { value: 'shown', label: 'Public' },
  { value: 'hidden', label: 'Hidden' },
]

type Kind = 'all' | 'twitch' | 'synthetic'
const KIND: Option<Kind>[] = [
  { value: 'all', label: 'All' },
  { value: 'twitch', label: 'Twitch' },
  { value: 'synthetic', label: 'Synthetic' },
]

type Upload = 'all' | 'uploaded' | 'details' | 'stuck'
const UPLOAD: Option<Upload>[] = [
  { value: 'all', label: 'All' },
  { value: 'uploaded', label: 'Archived', title: 'With parts on YouTube' },
  { value: 'details', label: 'Details only', title: 'Nothing on YouTube' },
  { value: 'stuck', label: 'Stuck', title: 'Nothing on YouTube, and no job queued, running or paused' },
]
const UPLOAD_PARAM: Record<Exclude<Upload, 'all'>, string> = { uploaded: 'yes', details: 'no', stuck: 'stuck' }

const query = computed(() => (typeof route.query.q === 'string' ? route.query.q : ''))
const shown = computed<Shown>(() => (route.query.hidden === 'true' ? 'hidden' : route.query.hidden === 'false' ? 'shown' : 'all'))
const kind = computed<Kind>(() => (route.query.synthetic === 'true' ? 'synthetic' : route.query.synthetic === 'false' ? 'twitch' : 'all'))
const upload = computed<Upload>(() => {
  const u = route.query.upload
  return u === 'yes' ? 'uploaded' : u === 'no' ? 'details' : u === 'stuck' ? 'stuck' : 'all'
})
const draft = ref(query.value)
/** The filters in the URL; the ones not given stay as they are. */
function setQuery(p: { q?: string; s?: Shown; k?: Kind; u?: Upload }) {
  const [q, s, k, u] = [p.q ?? query.value, p.s ?? shown.value, p.k ?? kind.value, p.u ?? upload.value]
  void router.replace({
    query: {
      ...(q ? { q } : {}),
      ...(s !== 'all' ? { hidden: String(s === 'hidden') } : {}),
      ...(k !== 'all' ? { synthetic: String(k === 'synthetic') } : {}),
      ...(u !== 'all' ? { upload: UPLOAD_PARAM[u] } : {}),
    },
  })
}
watchDebounced(draft, (v) => setQuery({ q: v.trim() }), 300)
const setShown = (s: Shown | undefined) => setQuery({ s: s ?? 'all' })
const setKind = (k: Kind | undefined) => setQuery({ k: k ?? 'all' })
const setUpload = (u: Upload | undefined) => setQuery({ u: u ?? 'all' })

const idLike = computed(() => /^\d{6,}$/.test(query.value) ? query.value : null)

const vods = ref<VodListRow[]>([])
const next = ref<string | null>(null)
const loading = ref(false)
const error = ref<unknown>(null)
let ctrl: AbortController | null = null
/** The first page again (`more` = the page after the last one). */
async function load(more = false) {
  ctrl?.abort()
  const mine = (ctrl = new AbortController())
  loading.value = true
  error.value = null
  try {
    const hidden = shown.value === 'all' ? undefined : shown.value === 'hidden'
    // Nothing synthetic is uploaded, so an upload filter leaves synthetic VODs out.
    const synthetic = kind.value === 'all' ? (upload.value === 'all' ? undefined : false) : kind.value === 'synthetic'
    const uploaded = upload.value === 'all' ? undefined : upload.value === 'uploaded'
    const busy = upload.value === 'stuck' ? false : undefined
    const cursor = more ? next.value ?? undefined : undefined
    const page = await admin.vodList({ q: query.value || undefined, hidden, synthetic, uploaded, busy, limit: PER_PAGE, cursor }, mine.signal)
    vods.value = more ? [...vods.value, ...page.items] : page.items
    next.value = page.next_cursor
  } catch (e) {
    if (!mine.signal.aborted) error.value = e
  } finally {
    if (ctrl === mine) loading.value = false
  }
}
watch([query, shown, kind, upload], () => {
  selected.value = []
  void load()
})
const refresh = () => load()
const more = () => load(true)

// Ticked VODs and what can be done to them all at once
const selected = ref<string[]>([])
const picked = computed(() => new Set(selected.value))
const chosen = computed(() => vods.value.filter((v) => picked.value.has(v.id)))
const allTicked = computed(() => vods.value.length > 0 && vods.value.every((v) => picked.value.has(v.id)))
const tick = (id: string, on: boolean) => {
  selected.value = on ? [...selected.value.filter((x) => x !== id), id] : selected.value.filter((x) => x !== id)
}
const tickAll = (on: boolean) => (selected.value = on ? vods.value.map((v) => v.id) : [])
const untickAll = () => (selected.value = [])
/** The site's own tags; the automatic ones (new, updated, compilation) aren't set by hand. */
const tagOptions = computed<Option[]>(() =>
  Object.keys(tagConfig.value)
    .filter((t) => !AUTO_TAGS.includes(t))
    .map((t) => ({ value: t, label: t })),
)
const batchTag = ref<string>()
const count = (action: VodBatchAction) => vodBatchTargets(chosen.value, action, batchTag.value ?? '').length
const batch = useVodBatch((r) => {
  toast.show(r.message, r.error ? { kind: 'error', duration: 8000 } : { duration: r.failed.length ? 8000 : 4000 })
  const done = new Set(r.ok)
  selected.value = selected.value.filter((id) => !done.has(id))
  void load()
})
const runBatch = (action: VodBatchAction) => batch.run(action, chosen.value, batchTag.value ?? '')

const columns: TableColumn[] = [
  { key: 'pick', label: '', width: '36px' },
  { key: 'id', label: 'Id', mono: true },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Streamed', muted: true },
  { key: 'length', label: 'Length', mono: true, align: 'right' },
]
const rows = computed(() =>
  vods.value.map((v) => ({
    id: v.id,
    title: v.title ?? 'Untitled',
    date: v.created_at.slice(0, 10),
    length: v.duration_seconds == null ? '' : toClock(v.duration_seconds),
    hidden: v.hidden,
    merged: v.merged_into?.id ?? null,
    synthetic: v.synthetic ? (v.synthetic.supersedes ? 'merge or split' : 'synthetic') : null,
    tags: v.tags,
    // A synthetic VOD plays parts of others: nothing of its own is uploaded.
    upload: v.synthetic ? null : uploadStatus(v.uploaded),
    jobs: v.active_jobs.map((j) => ({ id: j.id, to: `/manage/jobs/${j.id}`, ...jobStatus(j) })),
    // A synthetic VOD is edited as its segments.
    to: v.synthetic ? `/manage/synthetic/${encodeURIComponent(v.id)}` : `/manage/vods/${v.id}`,
  })),
)

// Add a VOD the monitor missed
const addOpen = ref(false)
const addId = ref('')
const adding = ref<string | null>(null)
const findOpen = ref(false)
const addBad = computed(() => !/^\d+$/.test(addId.value.trim()))
async function add(mode: 'archive' | 'create') {
  const id = addId.value.trim()
  adding.value = mode
  try {
    const res = mode === 'archive' ? await admin.archiveFromTwitch(id) : await admin.createFromTwitch(id)
    toast.show(res.msg, { duration: 3500 })
    addOpen.value = false
    router.push(`/manage/vods/${id}`)
  } catch (e) {
    toast.show(errorText(e), { kind: 'error', duration: 6000 })
  } finally {
    adding.value = null
  }
}

onMounted(() => {
  void load()
  document.title = `VODs · Manage · ${site.name}`
  // From the Start a job dialog, for a VOD the archive doesn't have yet.
  if (typeof route.query.add !== 'string') return
  addId.value = route.query.add
  addOpen.value = true
  const { add: _add, ...rest } = route.query
  void router.replace({ query: rest })
})
</script>

<template>
  <ManageShell title="VODs">
    <template #actions>
      <KButton to="/manage/synthetic/new">New synthetic VOD</KButton>
      <KButton @click="findOpen = true">Find on Twitch</KButton>
      <KButton variant="primary" @click="addId = ''; addOpen = true">Add from Twitch</KButton>
    </template>

    <div class="search">
      <KInput v-model="draft" type="search" placeholder="Search titles, or paste a VOD id…" clearable>
        <template #icon>⌕</template>
      </KInput>
      <KSegmented :model-value="shown" :options="SHOWN" label="Visibility" @update:model-value="setShown" />
      <KSegmented :model-value="kind" :options="KIND" label="Kind" @update:model-value="setKind" />
      <KSegmented :model-value="upload" :options="UPLOAD" label="Upload" @update:model-value="setUpload" />
      <KButton v-if="idLike" :to="`/manage/vods/${idLike}`" variant="primary">Open VOD {{ idLike }}</KButton>
    </div>

    <KCallout v-if="error" tone="error" title="Couldn't load the VODs">
      {{ errorText(error) }}
      <template #actions><KButton size="sm" @click="refresh">Try again</KButton></template>
    </KCallout>
    <div v-else-if="loading && !vods.length" class="sk" aria-busy="true"><KSkeleton v-for="i in 6" :key="i" h="36px" /></div>
    <template v-else>
      <div class="batch k-panel" role="group" aria-label="Ticked VODs">
        <KCheckbox :model-value="allTicked" :disabled="!vods.length" @update:model-value="tickAll">
          <strong>{{ chosen.length }}</strong>&nbsp;ticked
        </KCheckbox>
        <template v-if="chosen.length">
          <KButton
            v-for="b in VOD_BATCH"
            :key="b.action"
            size="sm"
            :title="b.title"
            :disabled="!!batch.busy.value || !count(b.action)"
            :loading="batch.busy.value === b.action"
            @click="runBatch(b.action)"
          >{{ b.label }} {{ count(b.action) }}</KButton>
          <span class="tagging">
            <KSelect v-model="batchTag" :options="tagOptions" placeholder="Tag…" size="sm" width="160px" />
            <KButton size="sm" title="Add the tag to the ones without it" :disabled="!!batch.busy.value || !count('tag')" :loading="batch.busy.value === 'tag'" @click="runBatch('tag')">Add {{ count('tag') }}</KButton>
            <KButton size="sm" title="Take the tag off the ones with it" :disabled="!!batch.busy.value || !count('untag')" :loading="batch.busy.value === 'untag'" @click="runBatch('untag')">Remove {{ count('untag') }}</KButton>
          </span>
          <span class="grow" />
          <KButton size="sm" @click="untickAll">Untick all</KButton>
        </template>
        <span v-else class="k-muted small">Tick VODs to archive, refetch, hide, show or tag several at once.</span>
      </div>
      <KTable :columns="columns" :rows="rows" row-key="id" manual label="VODs" empty="No VODs match.">
        <template #cell-pick="{ row }">
          <KCheckbox :model-value="picked.has(row.id)" @update:model-value="tick(row.id, $event)"><span class="k-sr">Tick {{ row.id }}</span></KCheckbox>
        </template>
        <template #cell-id="{ row }"><RouterLink :to="row.to">{{ row.id }}</RouterLink></template>
        <template #cell-title="{ row }">
          <RouterLink :to="row.to" class="title">{{ row.title }}</RouterLink>
          <KChip v-if="row.synthetic" tone="accent" :title="row.synthetic === 'synthetic' ? 'Made of windows of other VODs' : 'Stands in for the VODs it was made of'">{{ row.synthetic }}</KChip>
          <KChip v-for="t in row.tags" :key="t">{{ t }}</KChip>
          <KChip v-if="row.hidden" tone="warn" title="Gone from the public site">hidden</KChip>
          <KChip v-if="row.merged" :title="`Merged into ${row.merged}`">merged</KChip>
        </template>
        <template #cell-status="{ row }">
          <span class="status">
            <KChip v-if="row.upload" :tone="row.upload.tone" :title="row.upload.title">{{ row.upload.text }}</KChip>
            <RouterLink v-for="j in row.jobs" :key="j.id" :to="j.to" class="job"><KChip :tone="j.tone" :title="j.title">{{ j.text }}</KChip></RouterLink>
          </span>
        </template>
      </KTable>
      <div class="more">
        <KButton v-if="next" :loading="loading" @click="more">More</KButton>
        <span class="k-muted k-mono small">{{ vods.length }} shown</span>
      </div>
    </template>

    <KDialog v-model:open="addOpen" title="Add a VOD from Twitch" width="460px">
      For a stream the monitor missed, while Twitch still has the VOD.
      <form class="form" @submit.prevent="!addBad && add('archive')">
        <KField label="Twitch VOD id" help="The number in twitch.tv/videos/…">
          <template #default="{ id }"><KInput :id="id" v-model="addId" mono placeholder="2375792832" /></template>
        </KField>
      </form>
      <template #actions="{ close }">
        <KButton @click="close">Cancel</KButton>
        <KButton :disabled="addBad" :loading="adding === 'create'" @click="add('create')">Details only</KButton>
        <KButton variant="primary" :disabled="addBad" :loading="adding === 'archive'" @click="add('archive')">Archive it</KButton>
      </template>
    </KDialog>

    <TwitchImportDialog v-model:open="findOpen" @added="refresh" />
  </ManageShell>
</template>

<style scoped>
a { color: inherit; }
.search { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.search { align-items: center; }
.search > :first-child { flex: 1 1 260px; max-width: 480px; }
.sk { display: flex; flex-direction: column; gap: 6px; }
.title { margin-right: 6px; }
.status { display: flex; flex-wrap: wrap; gap: 4px; }
.job { text-decoration: none; }
.more { display: flex; flex-direction: column; align-items: center; gap: 6px; margin-top: 16px; }
.small { font-size: 11px; }
.batch { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 8px 12px; margin-bottom: 12px; }
.tagging { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.grow { flex: 1; }
.form { margin-top: 12px; color: var(--k-ink, inherit); }
</style>
