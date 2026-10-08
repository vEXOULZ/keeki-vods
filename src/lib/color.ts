// Copied from vexoulz-ui (src/utils, src/composables): keeki-vods doesn't depend on it, but shares how it
// colours games and places popovers.
import { reactive } from 'vue'

function hash31(name: string): number {
  let x = 0
  for (const c of name) x = (x * 31 + c.charCodeAt(0)) >>> 0
  return x
}

// Hues learned from box art (see artColor.ts). Reactive, so anything rendering gameColor() updates when a hue arrives.
const artHues = reactive(new Map<string, number>())

/** Use `hue` (from the game's box art) for this game from now on; null goes back to the name-based hue. */
export function setGameHue(name: string, hue: number | null): void {
  if (hue === null) artHues.delete(name)
  else artHues.set(name, ((Math.round(hue) % 360) + 360) % 360)
}

export const hasGameHue = (name: string): boolean => artHues.has(name)

/**
 * Colour per game: one muted pastel family (same saturation and lightness for every game, readable on black).
 * The hue comes from the game's box art once known, else from a hash of its name, so it's stable either way.
 */
export function gameColor(name: string): string {
  return `hsl(${gameHue(name)} 38% 62%)`
}

/** The hue gameColor() uses: from the box art once learned, else from the name. */
export function gameHue(name: string): number {
  return artHues.get(name) ?? hash31(name) % 360
}

const hueGap = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b))
/** Lightness steps tried in turn when a game's hue is too close to one already in the palette. */
const SHADES = [62, 46, 76] as const

/**
 * Colours for the games of one VOD, in the order given (chapter order). Each keeps its hue, but a game whose hue
 * is within `minGap`° of an earlier game in the same shade moves to a darker (then lighter) shade, so two similar
 * games side by side stay tellable apart. Use the same palette for a VOD's posters, chapter bar and timeline.
 */
export function gamePalette(names: Iterable<string>, minGap = 28): Map<string, string> {
  const used: { hue: number; shade: number }[] = []
  const out = new Map<string, string>()
  for (const name of names) {
    if (out.has(name)) continue
    const hue = gameHue(name)
    const shade = SHADES.find((l) => !used.some((u) => u.shade === l && hueGap(u.hue, hue) < minGap)) ?? SHADES[0]
    used.push({ hue, shade })
    out.set(name, `hsl(${hue} 38% ${shade}%)`)
  }
  return out
}

/**
 * The dominant hue of an image's pixels (RGBA bytes), weighting each pixel by how colourful it is. Greys, near-black
 * and near-white pixels don't count; returns null when too little of the image is colourful to call a hue.
 */
export function dominantHue(rgba: ArrayLike<number>, minShare = 0.04): number | null {
  const BUCKETS = 36
  const weight = new Array<number>(BUCKETS).fill(0)
  const sx = new Array<number>(BUCKETS).fill(0)
  const sy = new Array<number>(BUCKETS).fill(0)
  let pixels = 0
  let total = 0
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    if (rgba[i + 3]! < 128) continue
    pixels++
    const r = rgba[i]! / 255
    const g = rgba[i + 1]! / 255
    const b = rgba[i + 2]! / 255
    const max = Math.max(r, g, b)
    const chroma = max - Math.min(r, g, b)
    if (chroma < 0.15 || max < 0.15) continue
    let h = max === r ? ((g - b) / chroma) % 6 : max === g ? (b - r) / chroma + 2 : (r - g) / chroma + 4
    h = (h * 60 + 360) % 360
    const k = Math.floor(h / (360 / BUCKETS)) % BUCKETS
    const rad = (h * Math.PI) / 180
    weight[k]! += chroma
    sx[k]! += Math.cos(rad) * chroma
    sy[k]! += Math.sin(rad) * chroma
    total += chroma
  }
  if (!pixels || total / pixels < minShare) return null
  let best = 0
  let bestW = -1
  for (let k = 0; k < BUCKETS; k++) {
    const w = weight[(k + BUCKETS - 1) % BUCKETS]! + weight[k]! + weight[(k + 1) % BUCKETS]!
    if (w > bestW) {
      bestW = w
      best = k
    }
  }
  let x = 0
  let y = 0
  for (const k of [(best + BUCKETS - 1) % BUCKETS, best, (best + 1) % BUCKETS]) {
    x += sx[k]!
    y += sy[k]!
  }
  return Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360)
}

/** Letters shown on a poster placeholder: "Hollow Knight" → "HK". */
export function initials(name: string, max = 3): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, max)
    .toUpperCase()
}

/** Twitch's fallback palette for chatters who never chose a colour. */
export const TWITCH_DEFAULT_COLORS = [
  '#FF0000', '#0000FF', '#008000', '#B22222', '#FF7F50', '#9ACD32', '#FF4500', '#2E8B57',
  '#DAA520', '#D2691E', '#5F9EA0', '#1E90FF', '#FF69B4', '#8A2BE2', '#00FF7F',
]

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function luminance([r, g, b]: readonly number[]): number {
  const f = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!)
}

/** Contrast ratio of a colour against black. */
export function contrastOnBlack(hex: string): number {
  return (luminance(hexToRgb(hex)) + 0.05) / 0.05
}

const readable = new Map<string, string>()

/** Blend towards white until the colour has at least 4.5:1 contrast on black (roughly what Twitch's dark mode does). */
export function readableOnBlack(hex: string): string {
  // Chat renders the same few colours on every line: cached per colour.
  const known = readable.get(hex)
  if (known) return known
  let rgb: number[] = hexToRgb(hex)
  for (let i = 0; i < 20 && (luminance(rgb) + 0.05) / 0.05 < 4.5; i++) {
    rgb = rgb.map((c) => Math.round(c + (255 - c) * 0.12))
  }
  const out = `rgb(${rgb.join(' ')})`
  readable.set(hex, out)
  return out
}

/**
 * A chatter's name colour: their own Twitch colour if they set one, else Twitch's default for that name.
 * `readable` lifts dark colours so they stay legible on black; `raw` returns them unchanged.
 */
export function twitchColor(name: string, color?: string | null, mode: 'readable' | 'raw' = 'readable'): string {
  const hex = color || TWITCH_DEFAULT_COLORS[hash31(name) % TWITCH_DEFAULT_COLORS.length]!
  return mode === 'raw' ? hex : readableOnBlack(hex)
}
