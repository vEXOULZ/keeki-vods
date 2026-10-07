// The site's pages, at the same URLs as the other vods sites (vods-core's createVodsApp). Manage is one page for now
// (ManagePage), behind the guard in main.ts.
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
    { path: '/manage/:rest(.*)*', component: () => import('./pages/ManagePage.vue') },
    // The old admin URLs, for bookmarks and the worker's sign-in errors (it sends those to /admin/login).
    { path: '/admin/:rest(.*)*', redirect: (to) => ({ path: `/manage${to.path.slice('/admin'.length)}`, query: to.query, hash: to.hash }) },
    { path: '/:pathMatch(.*)*', component: () => import('./pages/NotFoundPage.vue') },
  ],
  scrollBehavior: (to, from, saved) => saved ?? (to.path !== from.path ? { top: 0 } : undefined),
})
