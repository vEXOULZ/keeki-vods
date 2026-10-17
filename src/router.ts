// The site's pages, at the same URLs as the other vods sites (vods-core's vodsRoutes). The Manage pages (all but its
// login) need a dashboard session; installVodsSession in main.ts guards them.
import { vodsRoutes } from '@vex/vods-core/kit'
import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: vodsRoutes({
    home: () => import('./pages/HomePage.vue'),
    list: () => import('./pages/VodsPage.vue'),
    watch: () => import('./pages/WatchPage.vue'),
    games: () => import('./pages/GamesPage.vue'),
    notFound: () => import('./pages/NotFoundPage.vue'),
    manage: {
      login: () => import('./pages/manage/ManageLoginPage.vue'),
      overview: () => import('./pages/manage/ManageOverviewPage.vue'),
      jobs: () => import('./pages/manage/ManageJobsPage.vue'),
      job: () => import('./pages/manage/ManageJobPage.vue'),
      vods: () => import('./pages/manage/ManageVodsPage.vue'),
      vod: () => import('./pages/manage/ManageVodPage.vue'),
      synthetic: () => import('./pages/manage/ManageSyntheticPage.vue'),
      storage: () => import('./pages/manage/ManageStoragePage.vue'),
      youtube: () => import('./pages/manage/ManageYoutubePage.vue'),
      settings: () => import('./pages/manage/ManageSettingsPage.vue'),
      tags: () => import('./pages/manage/ManageTagsPage.vue'),
      audit: () => import('./pages/manage/ManageAuditPage.vue'),
    },
  }),
  scrollBehavior: (to, from, saved) => saved ?? (to.path !== from.path ? { top: 0 } : undefined),
})
