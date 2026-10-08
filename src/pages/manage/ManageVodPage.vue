<script setup lang="ts">
// /manage/vods/:id: fix one VOD by hand (visibility, details, chapters, games, YouTube and Drive lists, emotes) and
// run its jobs.
import { KButton, KCallout, KChip, KDialog, KSkeleton, KSwitch, useToast } from '@/ui'
import { timeAgo } from '@/lib/time'
import { toClock } from '@vexoulz/vods-core'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { isSpliced, type AdminVod, vodSeconds, admin, platform, vodSubject, errorMessage, site } from '@vexoulz/vods-core/kit'
import ManageShell from '@/components/manage/ManageShell.vue'
import ChaptersEditor from '@/components/manage/ChaptersEditor.vue'
import DetailsEditor from '@/components/manage/DetailsEditor.vue'
import DriveEditor from '@/components/manage/DriveEditor.vue'
import EmotesPanel from '@/components/manage/EmotesPanel.vue'
import GamesEditor from '@/components/manage/GamesEditor.vue'
import SplicePanel from '@/components/manage/SplicePanel.vue'
import { stamp } from '@vexoulz/platform-web'
import { JobsTable, usePoll } from '@vexoulz/platform-web/vue'
import VodActions from '@/components/manage/VodActions.vue'
import YoutubeEditor from '@/components/manage/YoutubeEditor.vue'

const props = defineProps<{ id: string }>()
const router = useRouter()
const toast = useToast()

const vod = ref<AdminVod | null>(null)
const loadError = ref<string | null>(null)
const notFound = ref(false)

async function load() {
  loadError.value = null
  notFound.value = false
  try {
    vod.value = await admin.vod(props.id)
  } catch (e) {
    const status = (e as { status?: number }).status
    if (status === 404) notFound.value = true
    else loadError.value = errorMessage(e)
  }
}
watch(() => props.id, load, { immediate: true })

// The VOD's jobs refresh on their own; the VOD itself only reloads after an edit, so open forms keep their drafts.
const { data: jobPage, refresh: refreshJobs } = usePoll((signal) => platform.jobs({ subject: vodSubject(props.id), limit: 20 }, signal), 5_000)
const jobs = computed(() => jobPage.value?.items ?? [])
const activeJobs = computed(() => jobs.value.filter((j) => j.state === 'running' || j.state === 'queued' || j.state === 'paused').length)

/** The spans doomtp-bot wasn't listening, as text. */
const botGaps = computed(() =>
  (vod.value?.botChat?.coverage?.gaps ?? []).map(
    (g) => `${stamp(new Date(g.from).toISOString())} → ${stamp(new Date(g.to).toISOString())}${g.reason ? ` (${g.reason})` : ''}`,
  ),
)
const duration = computed(() => (vod.value ? vodSeconds(vod.value) : 0))

// Visibility: hiding asks first, since the VOD's links stop working; showing it again doesn't.
const hideOpen = ref(false)
const hiding = ref(false)
function toggleHidden(show: boolean) {
  if (!show) hideOpen.value = true
  else void setHidden(false)
}
async function setHidden(hidden: boolean) {
  if (!vod.value) return
  hiding.value = true
  try {
    vod.value = await admin.updateVod(vod.value.id, { hidden })
    hideOpen.value = false
    toast.show(hidden ? 'Hidden from the site' : 'Public again', { duration: 3000 })
  } catch (e) {
    toast.show(errorMessage(e), { kind: 'error', duration: 5000 })
  } finally {
    hiding.value = false
  }
}

function saved(v: AdminVod) {
  vod.value = v
}
function jobStarted() {
  refreshJobs()
}
function deleted() {
  router.replace('/manage/vods')
}

watch(vod, (v) => (document.title = `${v?.title ?? props.id} · Manage · ${site.name}`))
onMounted(() => (document.title = `VOD ${props.id} · Manage · ${site.name}`))
</script>

<template>
  <ManageShell :title="`VOD ${id}`">
    <template #actions>
      <KButton :to="`/vods/${id}`">Watch page</KButton>
      <KButton :to="`/manage/jobs?subject=${encodeURIComponent(vodSubject(id))}`">All its jobs</KButton>
    </template>
    <p class="back"><RouterLink to="/manage/vods">← VODs</RouterLink></p>

    <KCallout v-if="notFound" tone="warn" title="No such VOD">The archive has no VOD {{ id }}.</KCallout>
    <KCallout v-else-if="loadError" tone="error" title="Couldn't load this VOD">
      {{ loadError }}
      <template #actions><KButton size="sm" @click="load">Try again</KButton></template>
    </KCallout>
    <div v-else-if="!vod" class="sk" aria-busy="true"><KSkeleton h="90px" /><KSkeleton h="200px" /></div>

    <template v-else>
      <KCallout v-if="vod.hidden" tone="warn" title="Hidden">
        This VOD is gone from the public site: the list, its watch page, the games pages and its chat. It's still here.
      </KCallout>

      <KCallout v-if="vod.synthetic" tone="info" title="A synthetic VOD">
        It's made of windows of other VODs{{ vod.synthetic.supersedes ? ', and stands in for them' : '' }}. Its segments,
        title and tags are edited on its own page; here it can be hidden and its jobs run.
        <template #actions><KButton size="sm" :to="`/manage/synthetic/${encodeURIComponent(id)}`">Edit its segments</KButton></template>
      </KCallout>

      <section class="panel k-panel">
        <h2 class="title">{{ vod.title ?? 'Untitled' }}</h2>
        <div class="visibility">
          <KSwitch id="vod-public" :model-value="!vod.hidden" :disabled="hiding" @update:model-value="toggleHidden" />
          <label for="vod-public">
            <strong>{{ vod.hidden ? 'Hidden' : 'Public' }}</strong>
            <span class="k-muted"> · {{ vod.hidden ? 'only Manage shows it' : 'on the site for everyone' }}</span>
          </label>
        </div>
        <dl class="facts">
          <div><dt>Id</dt><dd class="k-mono">{{ vod.id }}</dd></div>
          <div><dt>Streamed</dt><dd :title="stamp(vod.createdAt)">{{ new Date(vod.createdAt).toLocaleString() }}</dd></div>
          <div><dt>Duration</dt><dd class="k-mono">{{ toClock(duration) }}</dd></div>
          <div v-if="vod.merged_into"><dt>Merged into</dt><dd class="k-mono"><RouterLink :to="`/manage/vods/${vod.merged_into.id}`">{{ vod.merged_into.id }}</RouterLink> at {{ toClock(vod.merged_into.offset) }}</dd></div>
          <div v-if="vod.stream_id"><dt>Stream</dt><dd class="k-mono">{{ vod.stream_id }}</dd></div>
          <div><dt>Parts</dt><dd>{{ vod.youtube?.length ?? 0 }} YouTube · {{ vod.drive?.length ?? 0 }} Drive</dd></div>
          <div><dt>Chapters</dt><dd>{{ vod.chapters?.length ?? 0 }} <KChip v-if="vod.chaptersLocked" tone="warn">locked</KChip></dd></div>
          <div>
            <dt>Bot chat</dt>
            <dd v-if="vod.botChat" :title="`read ${stamp(vod.botChat.fetched_at)}`">
              {{ vod.botChat.rows ?? '?' }} messages · read {{ timeAgo(vod.botChat.fetched_at) }}
              <KChip :tone="vod.botChat.keyed ? 'ok' : 'default'" :title="vod.botChat.keyed ? 'Read with a key: removals and their reasons are in' : 'Public read: no removals'">{{ vod.botChat.keyed ? 'keyed' : 'public' }}</KChip>
              <KChip v-if="botGaps.length" tone="warn" :title="botGaps.join('\n')">{{ botGaps.length }} {{ botGaps.length === 1 ? 'gap' : 'gaps' }}</KChip>
            </dd>
            <dd v-else class="k-muted">not read</dd>
          </div>
        </dl>
      </section>

      <!-- A synthetic VOD's details and segments are edited on its own page (the worker refuses them here). -->
      <section v-if="!vod.synthetic" class="panel k-panel">
        <h2 class="k-eyebrow">Details</h2>
        <DetailsEditor :vod="vod" @saved="saved" />
      </section>

      <section class="panel k-panel">
        <h2 class="k-eyebrow">Actions</h2>
        <VodActions :vod="vod" @job="jobStarted" @changed="load" @deleted="deleted" />
      </section>

      <section v-if="!vod.synthetic" class="panel k-panel">
        <h2 class="k-eyebrow">Merge and split</h2>
        <SplicePanel :vod="vod" @changed="load" @job="jobStarted" />
      </section>

      <section class="panel k-panel">
        <h2 class="k-eyebrow">Jobs <span v-if="activeJobs" class="k-muted">· {{ activeJobs }} active</span></h2>
        <JobsTable :jobs="jobs" empty="No jobs for this VOD." label="This VOD's jobs" />
      </section>

      <!-- A VOD merged into another, or a synthetic one, has no chapters, uploads or emotes of its own to edit. -->
      <template v-if="!vod.merged_into && !vod.synthetic">
        <section class="panel k-panel">
          <h2 class="k-eyebrow">Chapters</h2>
          <ChaptersEditor :vod="vod" :duration="duration" @saved="saved" />
        </section>

        <section class="panel k-panel">
          <h2 class="k-eyebrow">Games</h2>
          <GamesEditor :vod="vod" :duration="duration" @saved="saved" />
        </section>

        <section class="panel k-panel">
          <h2 class="k-eyebrow">YouTube parts</h2>
          <YoutubeEditor :vod="vod" @saved="saved" />
        </section>

        <section class="panel k-panel">
          <h2 class="k-eyebrow">Drive files</h2>
          <DriveEditor :vod="vod" @saved="saved" />
        </section>

        <section class="panel k-panel">
          <h2 class="k-eyebrow">Emotes</h2>
          <EmotesPanel :vod-id="vod.id" :spliced="isSpliced(vod)" @job="jobStarted" />
        </section>
      </template>

      <KDialog v-model:open="hideOpen" title="Hide this VOD?" width="460px">
        It leaves the public site at once: the VOD list, the games pages and the chat. Links to its watch page stop
        working (they show "not found") until it's made public again. Nothing is deleted.
        <template #actions="{ close }">
          <KButton @click="close">Cancel</KButton>
          <KButton variant="danger" :loading="hiding" @click="setHidden(true)">Hide it</KButton>
        </template>
      </KDialog>
    </template>
  </ManageShell>
</template>

<style scoped>
a { color: inherit; }
.back { margin: -8px 0 16px; font-size: 13px; }
.sk { display: flex; flex-direction: column; gap: 12px; }
.panel { padding: 14px 16px; margin-bottom: 16px; }
h2 { margin: 0 0 12px; }
.title { margin: 0 0 8px; font-size: 18px; font-weight: 600; overflow-wrap: anywhere; }
.visibility { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; font-size: 13px; }
.visibility label { cursor: pointer; }
.facts { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px 16px; margin: 0; }
dt { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.6; margin-bottom: 2px; }
dd { margin: 0; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
</style>
