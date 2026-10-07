<script setup lang="ts">
// A dropdown. The panel is teleported to <body> and placed from the trigger's box, so no scrolling container cuts
// it off. It opens towards whichever side has room, caps its height to that room (so long lists scroll), slides
// sideways to stay on screen, follows its trigger while the page scrolls, and focuses its [autofocus] element.
import { computed, nextTick, onScopeDispose, ref, watch } from 'vue'
import { useDismiss } from '@/lib/dismiss'
import { clampX, place } from '@/lib/place'

const props = withDefaults(
  defineProps<{
    prefer?: 'up' | 'down'
    align?: 'left' | 'right'
    /** The panel's width; a percentage is of the trigger's width. */
    width?: string
    /** Never taller than this (px), even with room. */
    cap?: number
    role?: 'menu' | 'dialog' | 'listbox'
  }>(),
  { prefer: 'down', align: 'left', width: '260px', cap: 420, role: 'menu' },
)
const emit = defineEmits<{ open: []; close: [] }>()

const GAP = 6
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const dir = ref(props.prefer)
const maxH = ref(props.cap)
const anchorWidth = ref(0)
const pos = ref<{ left: number; top?: number; bottom?: number } | null>(null)

const panelWidth = computed(() =>
  props.width.endsWith('%') ? `${(anchorWidth.value * parseFloat(props.width)) / 100}px` : props.width,
)

function reposition() {
  if (!root.value) return
  const anchor = root.value.getBoundingClientRect()
  anchorWidth.value = anchor.width
  const r = place({
    anchor,
    bounds: { top: 0, bottom: window.innerHeight },
    viewport: window.innerHeight,
    prefer: props.prefer,
    cap: props.cap,
    content: panel.value?.scrollHeight,
  })
  dir.value = r.dir
  maxH.value = r.maxHeight
  const w = panel.value?.offsetWidth ?? 0
  let left = props.align === 'right' ? anchor.right - w : anchor.left
  left += clampX(left, left + w, document.documentElement.clientWidth)
  pos.value = r.dir === 'down' ? { left, top: anchor.bottom + GAP } : { left, bottom: window.innerHeight - anchor.top + GAP }
}

async function show() {
  if (open.value) return
  pos.value = null
  open.value = true
  emit('open')
  await nextTick()
  reposition()
  // Once more: the first pass sized the panel to the room it had, which can move it.
  await nextTick()
  reposition()
  panel.value?.querySelector<HTMLElement>('[autofocus]')?.focus()
}
function close() {
  if (!open.value) return
  open.value = false
  emit('close')
}
const toggle = () => (open.value ? close() : show())

const follow = () => reposition()
function listen(on: boolean) {
  const method = on ? 'addEventListener' : 'removeEventListener'
  window[method]('scroll', follow, { capture: true, passive: true } as AddEventListenerOptions)
  window[method]('resize', follow)
}
watch(open, listen)
onScopeDispose(() => listen(false))

useDismiss([root, panel], () => open.value, close)
defineExpose({ open: show, close, toggle, reposition })
</script>

<template>
  <div ref="root" class="k-popover">
    <slot name="trigger" :open="open" :toggle="toggle" :close="close"></slot>
    <Teleport to="body">
      <div
        v-if="open"
        ref="panel"
        class="k-pop"
        :class="`is-${dir}`"
        :style="{
          width: panelWidth,
          maxHeight: `${maxH}px`,
          left: pos ? `${pos.left}px` : '0px',
          top: pos?.top !== undefined ? `${pos.top}px` : undefined,
          bottom: pos?.bottom !== undefined ? `${pos.bottom}px` : undefined,
          visibility: pos ? undefined : 'hidden',
        }"
        :role="role"
      >
        <slot :close="close"></slot>
      </div>
    </Teleport>
  </div>
</template>
