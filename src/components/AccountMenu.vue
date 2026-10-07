<script setup lang="ts">
// The header's account control: the vexoul.net sign-in (src/lib/account.ts). Signed out, "Sign in" (greyed out when
// sign-in is off); signed in, the Twitch name opens a menu with Manage (archive admins) and signing out. A dashboard
// session signed in with the admin password (no account) shows as "admin". Signing out ends both, and forgets this
// browser's quiet admin check for the account.
import { forget, logout, session } from '@vexoulz/vods-core/kit'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccount } from '@/lib/account'
import { initials } from '@/lib/color'
import { KButton, KMenuItem, KPopover } from '@/ui'

const account = useAccount()
const route = useRoute()
const router = useRouter()

const user = computed(() => {
  const u = account.user.value
  if (u) return { name: u.displayName, avatar: u.avatar, color: u.color }
  return session.authenticated ? { name: session.user?.displayName ?? 'admin', avatar: null, color: null } : null
})

async function signOut(everywhere: boolean) {
  try {
    if (session.authenticated) await logout()
  } catch {
    // the session is dropped here either way
  }
  const id = account.user.value?.id
  if (id) {
    forget(id)
    await account.signOut({ everywhere })
  }
  if (route.path.startsWith('/manage')) router.push('/')
}
</script>

<template>
  <KPopover v-if="user" align="right" width="220px">
    <template #trigger="{ toggle, open }">
      <button type="button" class="who" :class="{ open }" :aria-expanded="open" aria-haspopup="menu" @click="toggle">
        <img v-if="user.avatar" class="pic" :src="user.avatar" alt="" />
        <span v-else class="pic k-mono" aria-hidden="true">{{ initials(user.name) }}</span>
        <span class="name" :style="user.color ? { color: user.color } : undefined">{{ user.name }}</span>
        <span aria-hidden="true">▾</span>
      </button>
    </template>
    <template #default="{ close }">
      <div class="k-eyebrow head">{{ session.authenticated ? 'Archive admin' : 'Signed in on vexoul.net' }}</div>
      <KMenuItem v-if="session.authenticated" to="/manage" @click="close()">Manage</KMenuItem>
      <KMenuItem @click="close(), signOut(false)">Sign out</KMenuItem>
      <KMenuItem v-if="account.user.value" @click="close(), signOut(true)">Sign out everywhere</KMenuItem>
    </template>
  </KPopover>
  <KButton
    v-else
    size="sm"
    :disabled="!account.enabled || !account.ready.value"
    :title="account.enabled ? 'Sign in with Twitch, through vexoul.net: your watch progress follows you to any device' : 'Sign-in is off on this copy of the site'"
    @click="account.signIn()"
  >Sign in</KButton>
</template>

<style scoped>
.who {
  display: inline-flex; align-items: center; gap: 7px; max-width: 220px; height: var(--k-control-sm); padding: 0 9px 0 3px;
  border: 1px solid var(--k-line); border-radius: var(--k-radius); background: var(--k-panel); color: var(--k-ink);
  font-size: 13px; cursor: pointer;
}
.who:hover, .who.open { border-color: var(--k-accent); }
.pic {
  flex: none; width: 22px; height: 22px; display: grid; place-items: center; object-fit: cover;
  background: var(--k-frame); color: var(--k-muted); font-size: 10px;
}
.name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
.head { padding: 6px 8px; }
</style>
