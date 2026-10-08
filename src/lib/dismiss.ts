// Copied from vexoulz-ui (src/utils, src/composables): keeki-vods doesn't depend on it, but shares how it
// colours games and places popovers.
import { onScopeDispose, watch, type Ref } from 'vue'

type El = Ref<HTMLElement | null | undefined>

/**
 * Calls `handler` on a pointerdown outside `el` (or outside all of them: a trigger and its teleported panel), or on
 * Escape, while `active()` is true. The document listeners are only attached while it's active, so a page full of
 * closed popovers costs nothing per click.
 */
export function useDismiss(el: El | El[], active: () => boolean, handler: () => void) {
  const els = Array.isArray(el) ? el : [el]
  const outside = (e: PointerEvent) => {
    const present = els.map((r) => r.value).filter((x): x is HTMLElement => !!x)
    if (present.length && !present.some((x) => x.contains(e.target as Node))) handler()
  }
  const esc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') handler()
  }
  const listen = (on: boolean) => {
    if (on) {
      document.addEventListener('pointerdown', outside)
      document.addEventListener('keydown', esc)
    } else {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', esc)
    }
  }
  watch(active, listen, { immediate: true })
  onScopeDispose(() => listen(false))
}
