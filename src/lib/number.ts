// Copied from vexoulz-ui (src/utils, src/composables): keeki-vods doesn't depend on it, but shares how it
// colours games and places popovers.
/** Clamp a value into [min, max]. */
export function clamp(value: number, min = -Infinity, max = Infinity): number {
  return Math.min(max, Math.max(min, value))
}

/** Count of decimals in a step, so 0.1 + 0.2 shows as 0.3 and not 0.30000000000000004. */
export function decimalsOf(step: number): number {
  const s = String(step)
  if (s.includes('e-')) return Number(s.split('e-')[1])
  return s.includes('.') ? s.split('.')[1]!.length : 0
}

export interface StepOptions {
  step?: number
  min?: number
  max?: number
  /** Multiplier applied when the big-step modifier (shift) is held. Default 10. */
  bigStep?: number
  big?: boolean
}

/** One stepper press: value ± step (×10 with shift), clamped and rounded to the step's decimals. */
export function stepValue(value: number, direction: 1 | -1, opts: StepOptions = {}): number {
  const { step = 1, min, max, bigStep = 10, big = false } = opts
  const d = decimalsOf(step)
  const next = (Number.isFinite(value) ? value : 0) + direction * step * (big ? bigStep : 1)
  return clamp(Number(next.toFixed(d)), min, max)
}
