<script setup lang="ts">
// A one-line hint on hover or focus, above its trigger (below when there's no room). Never anything needed to use
// the page: touch screens rarely see it. Teleported to <body>; hides when anything scrolls.
import { onScopeDispose, ref, useId, watch } from 'vue'
import { clampX } from '@/lib/place'

defineProps<{ text: string }>()
const GAP = 8
const shown = ref(false)
const id = useId()
const root = ref<HTMLElement | null>(null)
const pos = ref<{ left: number; top: number } | null>(null)

function place(bubble: HTMLElement | null) {
  if (!bubble || !root.value || pos.value) return
  const t = root.value.getBoundingClientRect()
  const b = bubble.getBoundingClientRect()
  let left = (t.left + t.right) / 2 - b.width / 2
  left += clampX(left, left + b.width, document.documentElement.clientWidth)
  const below = t.top - GAP - b.height < GAP
  pos.value = { left, top: below ? t.bottom + GAP : t.top - GAP - b.height }
}
function show() {
  pos.value = null
  shown.value = true
}
const hide = () => (shown.value = false)
function listen(on: boolean) {
  const method = on ? 'addEventListener' : 'removeEventListener'
  window[method]('scroll', hide, { capture: true, passive: true } as AddEventListenerOptions)
}
watch(shown, listen)
onScopeDispose(() => listen(false))
</script>

<template>
  <span ref="root" class="k-tooltip" :aria-describedby="shown ? id : undefined" @pointerenter="show" @pointerleave="hide" @focusin="show" @focusout="hide">
    <slot></slot>
    <Teleport to="body">
      <span
        v-if="shown"
        :id="id"
        :ref="(el) => place(el as HTMLElement | null)"
        class="k-tooltip-bubble"
        :style="{ left: `${pos?.left ?? 0}px`, top: `${pos?.top ?? 0}px`, visibility: pos ? undefined : 'hidden' }"
        role="tooltip"
      >{{ text }}</span>
    </Teleport>
  </span>
</template>
