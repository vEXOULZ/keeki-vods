// The site's pages, at the same URLs as the other vods sites (vods-core's createVodsApp). The Manage pages (all but
// its login) need a dashboard session; see the guard in main.ts.
import { createRouter, createWebHistory } from 'vue-router'

const WatchPage = () => import('./pages/WatchPage.vue')
const VodsPage = () => import('./pages/VodsPage.vue')

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./pages/HomePage.vue') },
    // The lists. /vods?tab=playthroughs is the old link to the playthroughs.
    {
      path: '/vods',
      component: VodsPage,
      props: { tab: 'vods' },
      beforeEnter: (to) => {
        if (to.query.tab === undefined) return true
        const { tab, ...query } = to.query
        return { path: tab === 'playthroughs' ? '/playthroughs' : '/vods', query, hash: to.hash }
      },
    },
    { path: '/playthroughs', component: VodsPage, props: { tab: 'playthroughs' } },
    // /vods/:id plays the VOD uploads, /live/:id the live-recorded ones, /youtube/:id whichever set exists.
    { path: '/vods/:id', component: WatchPage, props: (r) => ({ id: r.params.id, type: 'vod' }) },
    { path: '/live/:id', component: WatchPage, props: (r) => ({ id: r.params.id, type: 'live' }) },
    { path: '/youtube/:id', component: WatchPage, props: (r) => ({ id: r.params.id, type: null }) },
    { path: '/games/:id', component: () => import('./pages/GamesPage.vue'), props: true },
    // Manage: the archive's admin pages.
    { path: '/manage/login', component: () => import('./pages/manage/ManageLoginPage.vue'), meta: { public: true } },
    { path: '/manage', component: () => import('./pages/manage/ManageOverviewPage.vue') },
    { path: '/manage/jobs', component: () => import('./pages/manage/ManageJobsPage.vue') },
    { path: '/manage/jobs/:id(\\d+)', component: () => import('./pages/manage/ManageJobPage.vue'), props: true },
    { path: '/manage/vods', component: () => import('./pages/manage/ManageVodsPage.vue') },
    { path: '/manage/vods/:id', component: () => import('./pages/manage/ManageVodPage.vue'), props: true },
    { path: '/manage/synthetic/new', component: () => import('./pages/manage/ManageSyntheticPage.vue') },
    { path: '/manage/synthetic/:id', component: () => import('./pages/manage/ManageSyntheticPage.vue'), props: true },
    { path: '/manage/storage', component: () => import('./pages/manage/ManageStoragePage.vue') },
    { path: '/manage/settings', component: () => import('./pages/manage/ManageSettingsPage.vue') },
    { path: '/manage/tags', component: () => import('./pages/manage/ManageTagsPage.vue') },
    { path: '/manage/audit', component: () => import('./pages/manage/ManageAuditPage.vue') },
    // The old admin URLs, for bookmarks and the worker's sign-in errors (it sends those to /admin/login).
    { path: '/admin/:rest(.*)*', redirect: (to) => ({ path: `/manage${to.path.slice('/admin'.length)}`, query: to.query, hash: to.hash }) },
    { path: '/:pathMatch(.*)*', component: () => import('./pages/NotFoundPage.vue') },
  ],
  scrollBehavior: (to, from, saved) => saved ?? (to.path !== from.path ? { top: 0 } : undefined),
})
