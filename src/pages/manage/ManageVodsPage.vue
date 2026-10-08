<script setup lang="ts">
// /manage/vods?q=&hidden=&synthetic=: find a VOD to edit (GET /api/v2/vods, so hidden, merged and synthetic ones too;
// a title or an id), add ones the monitor missed (?add=<id> opens that with the id in), and make a synthetic one (a
// playthrough, say).
import { KButton, KCallout, KChip, KDialog, KField, KInput, KSegmented, KSkeleton, KTable, useToast, type Option, type TableColumn } from '@/ui'
import { toClock } from '@vexoulz/vods-core'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { type VodListRow, admin, errorMessage, watchDebounced, site } from '@vexoulz/vods-core/kit'
import ManageShell from '@/components/manage/ManageShell.vue'

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

const query = computed(() => (typeof route.query.q === 'string' ? route.query.q : ''))
const shown = computed<Shown>(() => (route.query.hidden === 'true' ? 'hidden' : route.query.hidden === 'false' ? 'shown' : 'all'))
const kind = computed<Kind>(() => (route.query.synthetic === 'true' ? 'synthetic' : route.query.synthetic === 'false' ? 'twitch' : 'all'))
const draft = ref(query.value)
const setQuery = (q: string, s: Shown, k: Kind) =>
  router.replace({
    query: {
      ...(q ? { q } : {}),
      ...(s !== 'all' ? { hidden: String(s === 'hidden') } : {}),
      ...(k !== 'all' ? { synthetic: String(k === 'synthetic') } : {}),
    },
  })
watchDebounced(draft, (v) => setQuery(v.trim(), shown.value, kind.value), 300)
const setShown = (s: Shown | undefined) => setQuery(query.value, s ?? 'all', kind.value)
const setKind = (k: Kind | undefined) => setQuery(query.value, shown.value, k ?? 'all')

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
    const synthetic = kind.value === 'all' ? undefined : kind.value === 'synthetic'
    const cursor = more ? next.value ?? undefined : undefined
    const page = await admin.vodList({ q: query.value || undefined, hidden, synthetic, limit: PER_PAGE, cursor }, mine.signal)
    vods.value = more ? [...vods.value, ...page.items] : page.items
    next.value = page.next_cursor
  } catch (e) {
    if (!mine.signal.aborted) error.value = e
  } finally {
    if (ctrl === mine) loading.value = false
  }
}
watch([query, shown, kind], () => load(), { immediate: true })
const refresh = () => load()
const more = () => load(true)

const columns: TableColumn[] = [
  { key: 'id', label: 'Id', mono: true },
  { key: 'title', label: 'Title' },
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
    // A synthetic VOD is edited as its segments.
    to: v.synthetic ? `/manage/synthetic/${encodeURIComponent(v.id)}` : `/manage/vods/${v.id}`,
  })),
)

// Add a VOD the monitor missed
const addOpen = ref(false)
const addId = ref('')
const adding = ref<string | null>(null)
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
    toast.show(errorMessage(e), { kind: 'error', duration: 6000 })
  } finally {
    adding.value = null
  }
}

onMounted(() => {
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
      <KButton variant="primary" @click="addId = ''; addOpen = true">Add from Twitch</KButton>
    </template>

    <div class="search">
      <KInput v-model="draft" type="search" placeholder="Search titles, or paste a VOD id…" clearable>
        <template #icon>⌕</template>
      </KInput>
      <KSegmented :model-value="shown" :options="SHOWN" label="Visibility" @update:model-value="setShown" />
      <KSegmented :model-value="kind" :options="KIND" label="Kind" @update:model-value="setKind" />
      <KButton v-if="idLike" :to="`/manage/vods/${idLike}`" variant="primary">Open VOD {{ idLike }}</KButton>
    </div>

    <KCallout v-if="error" tone="error" title="Couldn't load the VODs">
      {{ errorMessage(error) }}
      <template #actions><KButton size="sm" @click="refresh">Try again</KButton></template>
    </KCallout>
    <div v-else-if="loading && !vods.length" class="sk" aria-busy="true"><KSkeleton v-for="i in 6" :key="i" h="36px" /></div>
    <template v-else>
      <KTable :columns="columns" :rows="rows" row-key="id" manual label="VODs" empty="No VODs match.">
        <template #cell-id="{ row }"><RouterLink :to="row.to">{{ row.id }}</RouterLink></template>
        <template #cell-title="{ row }">
          <RouterLink :to="row.to" class="title">{{ row.title }}</RouterLink>
          <KChip v-if="row.synthetic" tone="accent" :title="row.synthetic === 'synthetic' ? 'Made of windows of other VODs' : 'Stands in for the VODs it was made of'">{{ row.synthetic }}</KChip>
          <KChip v-for="t in row.tags" :key="t">{{ t }}</KChip>
          <KChip v-if="row.hidden" tone="warn" title="Gone from the public site">hidden</KChip>
          <KChip v-if="row.merged" :title="`Merged into ${row.merged}`">merged</KChip>
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
  </ManageShell>
</template>

<style scoped>
a { color: inherit; }
.search { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.search { align-items: center; }
.search > :first-child { flex: 1 1 260px; max-width: 480px; }
.sk { display: flex; flex-direction: column; gap: 6px; }
.title { margin-right: 6px; }
.more { display: flex; flex-direction: column; align-items: center; gap: 6px; margin-top: 16px; }
.small { font-size: 11px; }
.form { margin-top: 12px; color: var(--k-ink, inherit); }
</style>
