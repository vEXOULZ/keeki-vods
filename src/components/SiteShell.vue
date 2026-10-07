<script setup lang="ts">
// Frame for every page: the Picture House header (name, ケーキでちゅ, nav), the page in <main>, and the footer, which
// links to vexoul.net only as the site's maker. `fill`: the watch page, as wide as the window and exactly its height
// (the player and chat size themselves to it), with no footer; `header` false hides the header (theater mode).
import { RouterLink } from 'vue-router'
import { KToastHost } from '@/ui'

withDefaults(defineProps<{ fill?: boolean; header?: boolean }>(), { fill: false, header: true })

const NAV = [
  { to: '/', label: 'Home', exact: true },
  { to: '/vods', label: 'VODs', exact: false },
  { to: '/playthroughs', label: 'Playthroughs', exact: false },
]
</script>

<template>
  <div class="site" :class="{ 'is-fill': fill }">
    <a class="skip k-btn is-primary" href="#main">Skip to content</a>
    <header v-if="header" class="head">
      <div class="head-in">
        <RouterLink to="/" class="brand">
          <span class="name">Keeki Picture House</span>
          <span class="jp" lang="ja">ケーキでちゅ</span>
        </RouterLink>
        <nav aria-label="Main" class="nav">
          <RouterLink
            v-for="n in NAV"
            :key="n.to"
            v-slot="{ href, navigate, isActive, isExactActive }"
            :to="n.to"
            custom
          >
            <a
              :href="href"
              :class="{ on: n.exact ? isExactActive : isActive }"
              :aria-current="(n.exact ? isExactActive : isActive) ? 'page' : undefined"
              @click="navigate"
            >{{ n.label }}</a>
          </RouterLink>
        </nav>
      </div>
    </header>

    <main id="main" class="main" tabindex="-1">
      <slot></slot>
    </main>

    <footer v-if="!fill" class="foot">
      <div class="foot-in">
        <span>A fan archive of keeki_dechu's streams.</span>
        <span>Made by <a href="https://vexoul.net">vexoul.net</a></span>
      </div>
    </footer>
    <KToastHost />
  </div>
</template>

<style scoped>
.site { min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; }
.skip { position: absolute; left: 16px; top: -100px; z-index: 2000; }
.skip:focus { top: 12px; }

.head { border-bottom: 1px solid var(--k-line); }
.head-in {
  max-width: 1200px; margin: 0 auto; padding: 16px 24px; display: flex; flex-wrap: wrap; align-items: center;
  justify-content: space-between; gap: 8px 16px;
}
.is-fill .head-in { max-width: none; }
.brand { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 12px; color: var(--k-ink); text-decoration: none; }
.name { font-family: var(--k-display); font-weight: 900; font-size: 26px; letter-spacing: 0.04em; text-transform: uppercase; line-height: 1.1; }
.jp { font-size: 14px; color: var(--k-muted); }
.nav {
  display: flex; flex-wrap: wrap; gap: 4px; margin-right: -14px; font-family: var(--k-display); font-weight: 700;
  font-size: 18px; letter-spacing: 0.06em; text-transform: uppercase;
}
.nav a { display: block; padding: 10px 14px; color: var(--k-ink); text-decoration: none; }
.nav a:hover { color: var(--k-accent); }
.nav a.on { color: var(--k-accent); }

.main {
  container: k-site / inline-size; flex: 1 0 auto; width: 100%; max-width: 1200px; margin: 0 auto;
  padding: 28px 24px 64px; outline: none;
}
.is-fill .main { max-width: none; padding: 16px 24px; display: flex; flex-direction: column; min-height: 0; }

.foot { border-top: 1px solid var(--k-line); }
.foot-in {
  max-width: 1200px; margin: 0 auto; padding: 26px 24px; display: flex; flex-wrap: wrap; justify-content: space-between;
  gap: 12px; font-size: 14px; color: var(--k-muted);
}
@media (max-width: 560px) {
  .head-in, .main, .foot-in { padding-left: 16px; padding-right: 16px; }
  .nav { margin-left: -14px; }
  .is-fill .main { padding: 8px 0; }
}
</style>
