<script setup lang="ts">
// /manage (every path under it): the archive's admin pages, behind the dashboard session (the guard in main.ts sends
// a visitor without one through the worker's Twitch sign-in). The pages themselves are still to be rebuilt in this
// site's look; until then this says who is signed in, or why the sign-in didn't take.
import { SIGNIN_ERRORS, session, twitchLoginUrl } from '@vexoulz/vods-core/kit'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SiteShell from '@/components/SiteShell.vue'
import { KButton, KCallout, KEmptyState } from '@/ui'

const route = useRoute()

const why = computed(() => {
  const code = route.query.auth_error
  if (typeof code === 'string') return SIGNIN_ERRORS[code] ?? 'The sign-in didn\'t go through.'
  return session.notice
})
</script>

<template>
  <SiteShell>
    <KEmptyState
      v-if="session.authenticated"
      title="Manage"
      :text="`Signed in as ${session.user?.displayName ?? 'admin'}. The admin pages are being rebuilt for this site; they'll be here soon.`"
    />
    <div v-else class="stack">
      <KCallout v-if="why" tone="error" title="Not signed in to Manage">{{ why }}</KCallout>
      <KEmptyState
        title="Manage"
        :text="
          session.twitchLogin
            ? 'For the archive\'s admins. Sign in with the Twitch account the archive knows.'
            : 'Sign-in to Manage is off on this copy of the site.'
        "
      >
        <template v-if="session.twitchLogin" #actions>
          <KButton variant="primary" :href="twitchLoginUrl(route.path)">Sign in with Twitch</KButton>
        </template>
      </KEmptyState>
    </div>
  </SiteShell>
</template>

<style scoped>
.stack { display: flex; flex-direction: column; gap: 16px; }
</style>
