<script setup lang="ts">
import { KButton, KCallout, KDialog, KField, KInput, KStatusDot } from '@/ui'
import { useToast } from '@vexoulz/ui/utils'
import { timeAgo } from '@/lib/time'
import { errorText } from '@vexoulz/platform-web'
import { computed, onBeforeUnmount, ref } from 'vue'
import { admin, linkTwitch, viewerTile, type TwitchDeviceFlow, type TwitchViewerStatus } from '@vexoulz/vods-core/kit'

/**
 * The Overview tile for the Twitch account live recordings are asked for as: one that sees no ads on the channel
 * (Turbo, or a sub where the channel gives subs ad-free viewing) gets a stream without stitched ads. The broadcaster
 * links their own account with Twitch's device flow, or pastes a token when that one still gets ads.
 */
const props = defineProps<{ status: TwitchViewerStatus | null | undefined }>()
const emit = defineEmits<{ changed: [] }>()
const toast = useToast()

const tile = computed(() => viewerTile(props.status, timeAgo))

// ---- device flow ----
const linkOpen = ref(false)
const flow = ref<TwitchDeviceFlow | null>(null)
const linkError = ref<string | null>(null)
const starting = ref(false)
let abort: AbortController | null = null

async function startLink() {
  abort?.abort()
  const ctl = (abort = new AbortController())
  flow.value = null
  linkError.value = null
  linkOpen.value = true
  starting.value = true
  try {
    const res = await linkTwitch(admin, (f) => ((flow.value = f), (starting.value = false)), ctl.signal)
    if (res.state === 'cancelled') return
    if (res.state === 'failed') {
      linkError.value = res.error
      return
    }
    linkOpen.value = false
    toast.show(`Linked ${res.status?.login ?? 'the Twitch account'}`, { duration: 3500 })
    emit('changed')
  } catch (e) {
    if (!ctl.signal.aborted) linkError.value = errorText(e)
  } finally {
    if (abort === ctl) starting.value = false
  }
}

function onLinkOpen(open: boolean) {
  linkOpen.value = open
  if (!open) abort?.abort()
}
onBeforeUnmount(() => abort?.abort())

// ---- paste ----
const pasteOpen = ref(false)
const pasteDraft = ref('')
const pasteError = ref<string | null>(null)
const pasting = ref(false)

function openPaste() {
  pasteDraft.value = ''
  pasteError.value = null
  pasteOpen.value = true
}

async function paste() {
  pasting.value = true
  pasteError.value = null
  try {
    const st = await admin.twitchViewerPaste(pasteDraft.value.trim())
    pasteDraft.value = ''
    pasteOpen.value = false
    toast.show(`Linked ${st?.login ?? 'the Twitch account'}`, { duration: 3500 })
    emit('changed')
  } catch (e) {
    pasteError.value = errorText(e)
  } finally {
    pasting.value = false
  }
}

// ---- unlink ----
const unlinkOpen = ref(false)
const unlinking = ref(false)

async function unlink() {
  unlinking.value = true
  try {
    await admin.twitchViewerUnlink()
    unlinkOpen.value = false
    toast.show('Twitch account unlinked', { duration: 3500 })
    emit('changed')
  } catch (e) {
    toast.show(`Couldn't unlink the Twitch account: ${errorText(e)}`, { kind: 'error', duration: 5000 })
  } finally {
    unlinking.value = false
  }
}
</script>

<template>
  <div class="tile k-panel">
    <div class="k-eyebrow">Twitch (ad-free)</div>
    <div class="tile-main"><KStatusDot :status="tile.status" />{{ tile.text }}</div>
    <div v-if="tile.sub" class="k-muted small">{{ tile.sub }}</div>
    <template v-if="status">
      <div v-if="!tile.linked" class="buttons">
        <KButton title="Sign in on Twitch as an account that sees no ads on the channel" @click="startLink">Link Twitch account</KButton>
        <KButton size="sm" variant="ghost" @click="openPaste">Paste a token</KButton>
      </div>
      <div v-else class="buttons">
        <KButton size="sm" title="Link a different Twitch account" @click="startLink">Switch account</KButton>
        <KButton size="sm" variant="ghost" title="Link with a pasted token instead" @click="openPaste">Paste a token</KButton>
        <KButton size="sm" variant="ghost" @click="unlinkOpen = true">Unlink</KButton>
      </div>
    </template>

    <KDialog :open="linkOpen" title="Link a Twitch account" @update:open="onLinkOpen">
      <p>
        Sign in on Twitch as the account live recordings should be watched as: one that sees no ads on this channel
        (Turbo, or a sub where the channel gives subs ad-free viewing). Then enter this code there.
      </p>
      <KCallout v-if="linkError" tone="error" title="The link didn't go through">{{ linkError }}</KCallout>
      <template v-else-if="flow">
        <div class="code k-mono" aria-label="Code to enter at Twitch">{{ flow.userCode }}</div>
        <a class="tile-link" :href="flow.verificationUri" target="_blank" rel="noopener">Open Twitch to enter the code</a>
        <p class="k-muted small">Waiting for Twitch… this closes once the account is linked.</p>
      </template>
      <p v-else-if="starting" class="k-muted small">Asking Twitch for a code…</p>
      <template #actions="{ close }">
        <KButton @click="close">{{ linkError ? 'Close' : 'Cancel' }}</KButton>
        <KButton v-if="linkError" variant="primary" @click="startLink">Start again</KButton>
      </template>
    </KDialog>

    <KDialog v-model:open="pasteOpen" title="Paste a Twitch token">
      <p>
        If the linked account still gets ads in the recording, paste the <span class="k-mono">auth-token</span> cookie
        of twitch.tv, signed in as that account. The worker checks it with Twitch and keeps it; it isn't shown again.
        Signing out on twitch.tv ends it.
      </p>
      <form @submit.prevent="pasteDraft.trim() && paste()">
        <KField label="Token" :error="pasteError ?? undefined">
          <template #default="{ id }"><KInput :id="id" v-model="pasteDraft" type="password" mono :invalid="!!pasteError" /></template>
        </KField>
      </form>
      <template #actions="{ close }">
        <KButton @click="close">Cancel</KButton>
        <KButton variant="primary" :loading="pasting" :disabled="!pasteDraft.trim()" @click="paste">Link</KButton>
      </template>
    </KDialog>

    <KDialog v-model:open="unlinkOpen" :title="`Unlink ${status?.login ?? 'the Twitch account'}?`">
      Live recordings are asked for anonymously again, with Twitch's ads cut out as gaps. The token isn't revoked; sign
      out on Twitch to end it.
      <template #actions="{ close }">
        <KButton @click="close">Cancel</KButton>
        <KButton variant="danger-solid" :loading="unlinking" @click="unlink">Unlink</KButton>
      </template>
    </KDialog>
  </div>
</template>

<style scoped>
.tile { display: flex; flex-direction: column; gap: 6px; padding: 14px 16px; align-items: flex-start; }
.tile-main { display: flex; align-items: center; gap: 8px; font-size: 16px; }
.tile-link { color: var(--k-accent); text-decoration: underline; text-underline-offset: 2px; }
.tile-link:hover { color: var(--k-ink); }
.small { font-size: 12px; }
.buttons { display: flex; flex-wrap: wrap; gap: 6px; }
.code { font-size: 28px; letter-spacing: 0.15em; margin: 8px 0; }
p { margin: 0 0 10px; }
</style>
