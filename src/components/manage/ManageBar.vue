<script setup lang="ts">
// The Manage bar, at the top of every Manage page (ManageShell): the archive's admin sections and who is signed in.
// On a narrow screen it wraps; nothing is dropped.
import { session } from '@vexoulz/vods-core/kit'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const LINKS = [
  { label: 'Overview', to: '/manage', exact: true },
  { label: 'Jobs', to: '/manage/jobs' },
  { label: 'VODs', to: '/manage/vods' },
  { label: 'Storage', to: '/manage/storage' },
  { label: 'Settings', to: '/manage/settings' },
  { label: 'Tags', to: '/manage/tags' },
  { label: 'Audit', to: '/manage/audit' },
]
const current = (to: string, exact = false) => (exact ? route.path === to : route.path === to || route.path.startsWith(`${to}/`))

/** The password has no user: "admin" then. */
const who = computed(() => (session.user ? `@${session.user.login}` : 'admin (password)'))
</script>

<template>
  <nav class="bar" aria-label="Manage">
    <span class="k-kicker label">Projection booth</span>
    <div class="links">
      <RouterLink
        v-for="l in LINKS"
        :key="l.to"
        :to="l.to"
        class="link"
        :class="{ on: current(l.to, l.exact) }"
        :aria-current="current(l.to, l.exact) ? 'page' : undefined"
      >{{ l.label }}</RouterLink>
    </div>
    <span class="who k-muted k-mono">{{ who }}</span>
  </nav>
</template>

<style scoped>
.bar {
  display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; margin: 0 0 20px; padding: 6px 12px;
  background: var(--k-frame); border: 1px solid var(--k-line); border-radius: var(--k-frame-radius);
}
.links { display: flex; flex-wrap: wrap; gap: 2px; }
.link {
  padding: 4px 9px; border-radius: var(--k-radius); color: var(--k-muted); text-decoration: none;
  font-family: var(--k-display); font-weight: 700; font-size: 14px; letter-spacing: 0.06em; text-transform: uppercase;
}
.link:hover { color: var(--k-ink); background: var(--k-surface-2); }
.link.on { color: var(--k-accent-ink); background: var(--k-accent); }
.who { margin-left: auto; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
</style>
