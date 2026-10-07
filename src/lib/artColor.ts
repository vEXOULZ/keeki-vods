// Copied from vexoulz-ui (src/utils, src/composables): keeki-vods doesn't depend on it, but shares how it
// colours games and places popovers.
// Learns a game's hue from its box art, so posters, chapter bars and timelines take the game's own colour.
// Needs an image host that allows CORS (Twitch's box art CDN does); anything else keeps the name-based hue.
import { dominantHue, hasGameHue, setGameHue } from './color'

const pending = new Map<string, Promise<number | null>>()

/** Dominant hue of the image at `url`, or null if it can't be read or has no clear colour. Cached per URL. */
export function sampleHue(url: string): Promise<number | null> {
  let p = pending.get(url)
  if (!p) {
    p = new Promise<number | null>((resolve) => {
      if (typeof Image === 'undefined') return resolve(null)
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.decoding = 'async'
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = 24
          canvas.height = 32
          const ctx = canvas.getContext('2d', { willReadFrequently: true })
          if (!ctx) return resolve(null)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          resolve(dominantHue(ctx.getImageData(0, 0, canvas.width, canvas.height).data))
        } catch {
          resolve(null) // tainted canvas (no CORS) or similar
        }
      }
      img.onerror = () => resolve(null)
      img.src = url
    })
    pending.set(url, p)
  }
  return p
}

// Hues learned since the last frame. Applied together, so a grid of posters re-renders once per frame rather than
// once per image.
const learned = new Map<string, number>()
let scheduled = false

function flush() {
  scheduled = false
  for (const [name, hue] of learned) if (!hasGameHue(name)) setGameHue(name, hue)
  learned.clear()
}

function learn(name: string, hue: number) {
  learned.set(name, hue)
  if (scheduled) return
  scheduled = true
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(flush)
  else setTimeout(flush, 0)
}

/** Colour these games from their box art (once each). Games without art, or with grey art, keep their name hue. */
export function learnGameColors(games: Iterable<{ name: string; image?: string | null }>): void {
  for (const g of games) {
    if (!g.image || hasGameHue(g.name)) continue
    void sampleHue(g.image).then((hue) => {
      if (hue !== null) learn(g.name, hue)
    })
  }
}
