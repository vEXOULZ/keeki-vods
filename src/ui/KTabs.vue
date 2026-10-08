<script setup lang="ts" generic="T extends string">
// Underlined tabs. Arrow keys move between them. With more tabs than width the row scrolls sideways, and an arrow on
// each side that has more (over a fade) says so and scrolls it; the chosen tab is kept in view.
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Option } from './types'

defineProps<{ options: Option<T>[]; label?: string }>()
const model = defineModel<T>()
const list = ref<HTMLElement | null>(null)
const more = ref({ left: false, right: false })

function measure() {
  const el = list.value
  if (!el) return
  more.value = { left: el.scrollLeft > 1, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1 }
}

function page(dir: -1 | 1) {
  const el = list.value
  if (el) el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: 'smooth' })
}

/** Scrolls the chosen tab into view, clear of the fades (the page itself never scrolls). */
function reveal() {
  const el = list.value
  const tab = el?.querySelector<HTMLElement>('[aria-selected=true]')
  if (el && tab) {
    const pad = 56
    const left = tab.offsetLeft - el.offsetLeft
    const right = left + tab.offsetWidth
    if (left < el.scrollLeft + pad) el.scrollLeft = left - pad
    else if (right > el.scrollLeft + el.clientWidth - pad) el.scrollLeft = right - el.clientWidth + pad
  }
  measure()
}

let observer: ResizeObserver | undefined
onMounted(() => {
  observer = new ResizeObserver(measure)
  if (list.value) observer.observe(list.value)
  reveal()
})
onBeforeUnmount(() => observer?.disconnect())
watch(model, () => nextTick(reveal))

function key(e: KeyboardEvent) {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
  const tabs = [...(list.value?.querySelectorAll<HTMLButtonElement>('[role=tab]:not(:disabled)') ?? [])]
  const i = tabs.indexOf(document.activeElement as HTMLButtonElement)
  const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]
  next?.focus()
  next?.click()
  e.preventDefault()
}
</script>

<template>
  <div class="k-tabs-wrap" :class="{ 'has-left': more.left, 'has-right': more.right }">
    <div ref="list" class="k-tabs" role="tablist" :aria-label="label" @keydown="key" @scroll.passive="measure">
      <button
        v-for="o in options"
        :key="o.value"
        type="button"
        role="tab"
        :aria-selected="o.value === model"
        :tabindex="o.value === model ? 0 : -1"
        :disabled="o.disabled"
        :title="o.title"
        @click="model = o.value"
      >{{ o.label }}</button>
    </div>
    <button v-if="more.left" type="button" class="k-tabs-more is-left" tabindex="-1" aria-hidden="true" @click="page(-1)">‹</button>
    <button v-if="more.right" type="button" class="k-tabs-more is-right" tabindex="-1" aria-hidden="true" @click="page(1)">›</button>
  </div>
</template>
