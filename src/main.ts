import '@vexoulz/platform-web/style.css'
import './theme.css'
import './platform.css'

import { AccountProgressStore } from '@vexoulz/vods-core'
import {
  answerOf,
  ensure,
  quietLoginUrl,
  recall,
  remember,
  session,
  setExpiredHandler,
  setupVodsSite,
  shouldCheck,
  twitchLoginUrl,
} from '@vexoulz/vods-core/kit'
import { createVods } from '@vexoulz/vods-core/vue'
import { createPlatformUi } from '@vexoulz/platform-web/vue'
import { createApp, watch } from 'vue'
import { RouterLink } from 'vue-router'

import App from './App.vue'
import { account } from './lib/account'
import { router } from './router'
import { useToast } from './ui'
import { site, vodsConfig } from './vods.config'

setupVodsSite({ config: vodsConfig, site, adminBase: import.meta.env.VITE_ADMIN_API || '/backend-admin' })

const onManage = (path: string) => path === '/manage' || path.startsWith('/manage/')

// A dashboard session that ends mid-use: an admin still signed in to the account gets a new one quietly (one trip
// through the worker); for anyone else ManagePage turns into its sign-in.
setExpiredHandler(() => {
  const here = router.currentRoute.value
  const user = account.user.value
  if (user && recall(user.id) === 'yes' && shouldCheck(user.id)) window.location.assign(quietLoginUrl(here.fullPath))
})

// Manage needs a dashboard session. Without one, the visitor goes through the worker's Twitch sign-in (which signs in
// to the vexoul.net account on the way) and comes back to the page; with that off, or after it failed, ManagePage
// says why.
router.beforeEach(async (to) => {
  if (!onManage(to.path)) return true
  await ensure()
  if (session.authenticated || !session.twitchLogin || session.notice || to.query.auth_error) return true
  window.location.assign(twitchLoginUrl(to.path))
  return false
})

// Signed in to the account: read the quiet check's answer off the URL, and ask once if this browser doesn't know
// whether the account is one of the archive's admins (that answer shows Manage in the account menu). A known viewer
// never loads the dashboard session.
void router.isReady().then(() =>
  watch(
    () => [account.user.value, account.ready.value, router.currentRoute.value.query.admin] as const,
    async ([user, ready]) => {
      if (!ready) return
      const here = router.currentRoute.value
      const answer = answerOf(here.query)
      if (here.query.admin !== undefined) {
        const { admin: _a, ...query } = here.query
        void router.replace({ path: here.path, query, hash: here.hash })
      }
      if (!user) return
      if (answer) remember(user.id, answer)
      if (recall(user.id) === 'no') return
      await ensure()
      if (session.authenticated) {
        if (session.user?.id === user.id) remember(user.id, 'yes')
        return
      }
      if (!answer && session.twitchLogin && shouldCheck(user.id)) window.location.assign(quietLoginUrl(here.fullPath))
    },
    { immediate: true },
  ),
)

// Watch progress follows the vexoul.net account; signed out it stays in this browser, and signing in moves what this
// browser has into the account.
const progress = new AccountProgressStore({ signedIn: () => !!account.user.value, request: account.request })
watch(account.user, (user, before) => {
  if (user && !before) void progress.merge()
})

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
