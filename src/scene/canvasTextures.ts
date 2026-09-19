import { CanvasTexture, NearestFilter, RepeatWrapping, SRGBColorSpace } from 'three'

// Small procedural canvas textures. Everything in the scene is drawn at low
// resolution and sampled with nearest-neighbour filtering on purpose: the look
// we're after is chunky pixel art under a CRT filter, and it keeps us free of
// image assets (same spirit as the synthesized audio).

// The font for every bit of text drawn onto a canvas (falls back to monospace
// until DotGothic16 has loaded — main.tsx waits for it before starting the app).
export const PIXEL_FONT = '"DotGothic16", ui-monospace, "Courier New", monospace'

export function makeCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return { canvas, ctx: canvas.getContext('2d')! }
}

export function toTexture(canvas: HTMLCanvasElement, options: { repeat?: [number, number]; smooth?: boolean } = {}) {
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  if (!options.smooth) {
    texture.magFilter = NearestFilter
    texture.minFilter = NearestFilter
    texture.generateMipmaps = false
  }
  if (options.repeat) {
    texture.wrapS = texture.wrapT = RepeatWrapping
    texture.repeat.set(options.repeat[0], options.repeat[1])
  }
  return texture
}

// Deterministic PRNG (mulberry32) so a texture looks the same on every load.
export function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A flat colour peppered with `count` speckles of the given colours. */
export function noiseCanvas(size: number, base: string, speckles: string[], count: number, seed: number) {
  const { canvas, ctx } = makeCanvas(size, size)
  const random = seeded(seed)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = speckles[Math.floor(random() * speckles.length)]
    ctx.fillRect(Math.floor(random() * size), Math.floor(random() * size), 1 + Math.floor(random() * 2), 1 + Math.floor(random() * 2))
  }
  return canvas
}

/** Grimy floor tiles: dark speckled squares with faint grout lines. */
export function floorCanvas(seed = 7) {
  const size = 64
  const canvas = noiseCanvas(size, '#2b2622', ['#1d1916', '#3a332d', '#463d34', '#1a1512', '#2f3a3a'], 900, seed)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.fillRect(0, 0, size, 1)
  ctx.fillRect(0, 0, 1, size)
  ctx.fillRect(size / 2, 0, 1, size)
  ctx.fillRect(0, size / 2, size, 1)
  return canvas
}

/** Stained concrete wall with faint vertical streaks. */
export function wallCanvas(seed = 3) {
  const size = 64
  const canvas = noiseCanvas(size, '#2d3634', ['#232b29', '#37423f', '#1d2422', '#3d4a45'], 700, seed)
  const ctx = canvas.getContext('2d')!
  const random = seeded(seed + 1)
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.fillRect(Math.floor(random() * size), 0, 1, size)
  }
  return canvas
}

/** Barred window: bright blue panes, dark mullions and vertical bars. */
export function windowCanvas() {
  const { canvas, ctx } = makeCanvas(64, 48)
  ctx.fillStyle = '#0e1622'
  ctx.fillRect(0, 0, 64, 48)
  ctx.fillStyle = '#8fc7ff'
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) ctx.fillRect(3 + col * 15, 3 + row * 22, 12, 19)
  }
  ctx.fillStyle = '#1b2a3d' // vertical bars
  for (let i = 0; i < 9; i++) ctx.fillRect(3 + i * 7, 0, 1, 48)
  return canvas
}

/** Soft radial glow (for light pools and shafts): white centre fading to nothing. */
export function glowCanvas(size = 128) {
  const { canvas, ctx } = makeCanvas(size, size)
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.5, 'rgba(255,255,255,0.35)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return canvas
}
