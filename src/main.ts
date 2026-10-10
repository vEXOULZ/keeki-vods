import '@vexoulz/platform-web/style.css'
import './theme.css'
import './platform.css'

import { installVodsSession, setupVodsSite } from '@vexoulz/vods-core/kit'
import { createVods } from '@vexoulz/vods-core/vue'
import { createPlatformUi } from '@vexoulz/platform-web/vue'
import { createAccount } from '@vexoulz/ui/account'
import { useToast } from '@vexoulz/ui/utils'
import { createApp } from 'vue'
import { RouterLink } from 'vue-router'

import App from './App.vue'
import { router } from './router'
import { site, vodsConfig } from './vods.config'

setupVodsSite({ config: vodsConfig, site, adminBase: import.meta.env.VITE_ADMIN_API || '/backend-admin' })

// The vexoul.net account (vexoulz-auth). installVodsSession wires it and the Manage dashboard session into the router
// (the Manage guard, an expired session, the tab title, the quiet admin check) and keeps watch progress with it.
const account = createAccount()
const { progress } = installVodsSession(router, account)

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
    }),
  )
  .mount('#app')
