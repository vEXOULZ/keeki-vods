<script setup lang="ts">
// A modal dialog, teleported to <body>. Escape or a click on the scrim closes it; focus moves into it on open (to its
// [autofocus] element if it has one), stays inside while it's open, and goes back to what opened it.
import { nextTick, onUnmounted, ref, useId, watch } from 'vue'

const props = withDefaults(defineProps<{ title: string; width?: string; dismissable?: boolean }>(), {
  width: '420px',
  dismissable: true,
})
const open = defineModel<boolean>('open', { default: false })
const box = ref<HTMLElement | null>(null)
const titleId = useId()
let returnTo: HTMLElement | null = null

const FOCUSABLE = 'button:not(:disabled), [href], input:not(:disabled), select, textarea, [tabindex]:not([tabindex="-1"])'

function close() {
  if (props.dismissable) open.value = false
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    close()
  } else if (e.key === 'Tab' && box.value) {
    const items = [...box.value.querySelectorAll<HTMLElement>(FOCUSABLE)]
    if (!items.length) return
    const first = items[0]!
    const last = items[items.length - 1]!
    if (e.shiftKey && document.activeElement === first) {
      last.focus()
      e.preventDefault()
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus()
      e.preventDefault()
    }
  }
}

watch(open, async (v) => {
  if (v) {
    returnTo = document.activeElement as HTMLElement | null
    await nextTick()
    const target =
      box.value?.querySelector<HTMLElement>('[autofocus]') ?? box.value?.querySelector<HTMLElement>(FOCUSABLE) ?? box.value
    target?.focus()
  } else {
    returnTo?.focus?.()
    returnTo = null
  }
})
onUnmounted(() => returnTo?.focus?.())
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="k-scrim" @pointerdown.self="close" @keydown="onKey">
      <div
        ref="box"
        class="k-dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        :style="{ width: `min(${width}, 100%)` }"
      >
        <div :id="titleId" class="k-dialog-title">{{ title }}</div>
        <div class="k-dialog-body"><slot></slot></div>
        <div v-if="$slots.actions" class="k-dialog-actions"><slot name="actions" :close="close"></slot></div>
      </div>
    </div>
  </Teleport>
</template>
