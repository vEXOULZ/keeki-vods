import '@vex/platform-web/style.css'
import './theme.css'
import './platform.css'

import { installVodsSession, setupVodsSite } from '@vex/vods-core/kit'
import { createVods } from '@vex/vods-core/vue'
import { twitchUserLookup } from '@vex/platform-web/chat'
import { createPlatformUi } from '@vex/platform-web/vue'
import { createAccount } from '@vex/ui/account'
import { useToast } from '@vex/ui/utils'
import { createApp } from 'vue'
import { RouterLink } from 'vue-router'

import App from './App.vue'
import { router } from './router'
import { site, USER_LOOKUP, vodsConfig } from './vods.config'

setupVodsSite({ config: vodsConfig, site, adminBase: import.meta.env.VITE_ADMIN_API || '/backend-admin' })

// The vexoul.net account (vex-auth). installVodsSession wires it and the Manage dashboard session into the router
// (the Manage guard, an expired session, the tab title, the quiet admin check) and keeps watch progress with it.
// The quiet check asks vex-auth for a code for this archive's worker, whose client there is `keeki-admin`
// (its ARCHIVE_ADMIN_AUTH_CLIENT_ID); a code for vods' `vods-admin` is refused, and Manage never shows.
const account = createAccount()
const { progress } = installVodsSession(router, account, { adminClientId: 'keeki-admin' })

createApp(App)
  .use(router)
  .use(account)
  .use(createVods(vodsConfig, { progress }))
  // The shared chat-line component (and, with Manage, the jobs and audit ones): links and toasts.
  .use(
    createPlatformUi({
      link: RouterLink,
      jobHref: (id) => `/manage/jobs/${id}`,
      subjectHref: () => null,
      notify: (msg, kind) => useToast().show(msg, { kind, duration: kind === 'error' ? 5000 : 3000 }),
      appName: 'worker',
      userLookup: USER_LOOKUP ? twitchUserLookup(USER_LOOKUP) : undefined,
    }),
  )
  .mount('#app')
