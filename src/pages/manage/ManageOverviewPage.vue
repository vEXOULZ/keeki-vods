<script setup lang="ts">
import { KButton, KCallout, KChip, KSkeleton, KStatusDot, useToast } from '@/ui'
import { timeAgo } from '@/lib/time'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { JobsTable, usePoll } from '@vexoulz/platform-web/vue'
import ManageShell from '@/components/manage/ManageShell.vue'
import { platform, admin, errorMessage, site } from '@vexoulz/vods-core/kit'

const { data: health, error, loading, refresh } = usePoll((signal) => admin.health(signal), 15_000)
const toast = useToast()
// v2 runs, as the jobs page lists them: per state, and the latest failures.
const { data: jobCounts } = usePoll((signal) => platform.jobCounts({}, signal), 15_000)
const { data: failures } = usePoll((signal) => platform.jobs({ state: ['failed'], limit: 10 }, signal), 15_000)

/** Counts by state, each linked to the jobs page filtered to it. */
const COUNT_STATES = [
  { state: 'queued', tone: 'default' },
  { state: 'running', tone: 'accent' },
  { state: 'paused', tone: 'warn' },
  { state: 'succeeded', tone: 'ok' },
  { state: 'failed', tone: 'bad' },
  { state: 'cancelled', tone: 'default' },
] as const

onMounted(() => (document.title = `Overview · Manage · ${site.name}`))

type Dot = 'live' | 'ok' | 'warn' | 'off'
const tiles = computed(() => {
  const h = health.value
  if (!h) return []
  const yt = h.youtube
  return [
    {
      name: 'Worker',
      status: (h.worker.ok ? 'ok' : 'warn') as Dot,
      text: h.worker.ok ? `${h.worker.runningJobs} running` : 'Not healthy',
      sub: h.worker.startedAt ? `up since ${timeAgo(h.worker.startedAt)}` : '',
    },
    { name: 'Archive API', status: (h.api?.ok ? 'ok' : 'warn') as Dot, text: h.api?.ok ? 'Reachable' : 'Unreachable', sub: '' },
    {
      name: 'YouTube',
      status: (!yt ? 'off' : yt.authorized && yt.valid ? 'ok' : 'warn') as Dot,
      text: !yt ? 'Unknown' : !yt.authorized ? 'Not connected' : yt.valid ? 'Connected' : yt.channel === null ? 'No channel' : 'Token invalid',
      // The channel uploads go to, so a wrong account is caught before a job uploads there.
      link: yt?.channel ? { text: yt.channel.title, href: yt.channel.url } : undefined,
      sub: yt?.error ?? (yt?.checkedAt ? `checked ${timeAgo(yt.checkedAt)}` : ''),
      action: !yt ? undefined : yt.authorized && yt.valid ? 'switch' : 'connect',
    },
    {
      name: 'Stream',
      status: (h.live?.live ? 'live' : 'off') as Dot,
      text: h.live?.live ? 'Live' : 'Offline',
      sub: h.live?.live && h.live.startedAt ? `started ${timeAgo(h.live.startedAt)}` : '',
    },
  ]
})

const router = useRouter()
const backfilling = ref(false)
/** Bot chat for every VOD that has none yet. */
async function backfillBotChat() {
  backfilling.value = true
  try {
    const res = await admin.botChatBackfill()
    toast.show(res.msg, { duration: 3500 })
    if (res.jobId != null) void router.push(`/manage/jobs/${res.jobId}`)
  } catch (e) {
    toast.show(`Couldn't start the bot chat backfill: ${errorMessage(e)}`, { kind: 'error', duration: 5000 })
  } finally {
    backfilling.value = false
  }
}

async function connectYoutube() {
  try {
    const { url } = await admin.youtubeAuthUrl()
    window.open(url, '_blank', 'noopener')
  } catch (e) {
    toast.show(`Couldn't start the YouTube connection: ${errorMessage(e)}`, { kind: 'error', duration: 5000 })
  }
}
</script>

<template>
  <ManageShell title="Overview">
    <template #actions>
      <KButton :loading="loading" @click="refresh">Refresh</KButton>
      <KButton :loading="backfilling" title="Read doomtp-bot’s chat for every VOD that doesn’t have it yet" @click="backfillBotChat">Backfill bot chat</KButton>
      <KButton variant="primary" to="/manage/jobs?new=1">Start a job</KButton>
    </template>

    <KCallout v-if="error" tone="error" title="Couldn't load the archive's status">
      {{ error }}
      <template #actions><KButton size="sm" @click="refresh">Try again</KButton></template>
    </KCallout>

    <div v-if="!health && !error" class="tiles" aria-busy="true">
      <KSkeleton v-for="i in 4" :key="i" h="84px" />
    </div>

    <template v-if="health">
      <div class="tiles">
        <div v-for="t in tiles" :key="t.name" class="tile k-panel">
          <div class="k-eyebrow">{{ t.name }}</div>
          <div class="tile-main"><KStatusDot :status="t.status" />{{ t.text }}</div>
          <a v-if="t.link" class="tile-link small" :href="t.link.href" target="_blank" rel="noopener">{{ t.link.text }}</a>
          <div v-if="t.sub" class="k-muted small">{{ t.sub }}</div>
          <KButton v-if="t.action === 'connect'" @click="connectYoutube">Connect YouTube</KButton>
          <KButton v-else-if="t.action === 'switch'" size="sm" title="Connect a different Google account or channel" @click="connectYoutube">Switch account</KButton>
        </div>
      </div>

      <section>
        <h2 class="k-eyebrow">Jobs</h2>
        <div class="counts">
          <RouterLink v-for="s in COUNT_STATES" :key="s.state" :to="`/manage/jobs?state=${s.state}`" class="count">
            <KChip :tone="jobCounts?.counts[s.state] ? s.tone : 'default'" :k="s.state">{{ jobCounts?.counts[s.state] ?? '…' }}</KChip>
          </RouterLink>
        </div>
      </section>

      <section>
        <h2 class="k-eyebrow">Recent failures</h2>
        <JobsTable :jobs="failures?.items ?? []" empty="No failed jobs. 🎉" label="Recent failures" />
      </section>
    </template>
  </ManageShell>
</template>

<style scoped>
.tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 28px; }
.tile { display: flex; flex-direction: column; gap: 6px; padding: 14px 16px; align-items: flex-start; }
.tile-main { display: flex; align-items: center; gap: 8px; font-size: 16px; }
.tile-link { color: var(--k-accent); text-decoration: underline; text-underline-offset: 2px; }
.tile-link:hover { color: var(--k-ink); }
.small { font-size: 12px; }
section { margin-bottom: 28px; }
h2 { margin: 0 0 10px; }
.counts { display: flex; flex-wrap: wrap; gap: 8px; }
.count { text-decoration: none; }
</style>
