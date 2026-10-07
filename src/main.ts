import '@vexoulz/platform-web/style.css'
import './theme.css'
import './platform.css'

import { LocalProgressStore } from '@vexoulz/vods-core'
import { setupVodsSite } from '@vexoulz/vods-core/kit'
import { createVods } from '@vexoulz/vods-core/vue'
import { createPlatformUi } from '@vexoulz/platform-web/vue'
import { createApp } from 'vue'
import { RouterLink } from 'vue-router'

import App from './App.vue'
import { router } from './router'
import { useToast } from './ui'
import { site, vodsConfig } from './vods.config'

setupVodsSite({ config: vodsConfig, site, adminBase: import.meta.env.VITE_ADMIN_API || '/backend-admin' })

createApp(App)
  .use(router)
  // No accounts here: watch progress stays in this browser.
  .use(createVods(vodsConfig, { progress: new LocalProgressStore() }))
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
