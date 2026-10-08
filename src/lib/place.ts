// Copied from vexoulz-ui (src/utils, src/composables): keeki-vods doesn't depend on it, but shares how it
// colours games and places popovers.
export interface Rect {
  top: number
  bottom: number
}

export interface PlaceInput {
  /** The trigger's box. */
  anchor: Rect
  /** The area the panel must stay inside (the page's <main>, below the sticky header). */
  bounds: Rect
  /** Viewport height; bounds are clipped to what's on screen. */
  viewport: number
  prefer: 'up' | 'down'
  /** Never taller than this, even with room. */
  cap: number
  /** Natural height of the panel's content, if already measured. */
  content?: number
  /** Gap kept between the panel and the bounds' edge. */
  margin?: number
  /** Smallest height the panel is ever squeezed to. */
  min?: number
}

export interface Placement {
  dir: 'up' | 'down'
  maxHeight: number
}

/**
 * Where a popover opens. It stays on the preferred side when its whole content fits there (or that side has
 * at least as much room as the other); otherwise it flips. Its height is capped to the room on the chosen side,
 * so long lists scroll instead of running off-screen or under the header.
 */
export function place(i: PlaceInput): Placement {
  const margin = i.margin ?? 10
  const min = i.min ?? 120
  const up = i.anchor.top - Math.max(i.bounds.top, 0) - margin
  const down = Math.min(i.bounds.bottom, i.viewport) - i.anchor.bottom - margin
  const wanted = i.prefer === 'up' ? up : down
  const other = i.prefer === 'up' ? down : up
  const need = Math.min(i.content ?? i.cap, i.cap)
  const flip = i.prefer === 'up' ? 'down' : 'up'
  const dir = wanted >= need || wanted >= other ? i.prefer : flip
  const maxHeight = Math.max(min, Math.min(i.cap, dir === 'up' ? up : down))
  return { dir, maxHeight }
}

/**
 * Sideways shift (px) that keeps a panel spanning `left`..`right` inside `0`..`viewport` with `margin` to spare.
 * A panel wider than the room is pinned to the left edge.
 */
export function clampX(left: number, right: number, viewport: number, margin = 8): number {
  if (left < margin) return margin - left
  if (right > viewport - margin) return Math.max(margin - left, viewport - margin - right)
  return 0
}
