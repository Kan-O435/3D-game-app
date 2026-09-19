import { CanvasTexture } from 'three'
import { SYMBOL_COUNT, SYMBOLS } from '../game/symbols'
import { PIXEL_FONT, makeCanvas, toTexture } from './canvasTextures'
import { drawFitted, iconUrl, loadImage } from './artAssets'

export { SYMBOL_COUNT }

// Placeholder art: a dark tile with a simple coloured glyph per symbol (fan-of-an-
// idol motifs: glow-stick, ticket, mic, note, crown, cheki camera, the idol...),
// drawn at 32x32 and sampled nearest-neighbour so it reads as chunky pixel art.
// Real art: any image dropped into src/assets/icons/NN.png (NN = symbol id) replaces
// its glyph — see artAssets.ts and src/assets/README.md.
// Must have at least SYMBOL_COUNT entries — keep in sync with game/symbols.ts.
const TILE = 32
const C = TILE / 2

type Glyph = (ctx: CanvasRenderingContext2D, color: string) => void

const stroke = (ctx: CanvasRenderingContext2D, color: string, width = 2) => {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

const polygon = (ctx: CanvasRenderingContext2D, points: [number, number][]) => {
  ctx.beginPath()
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
  ctx.closePath()
}

const text = (ctx: CanvasRenderingContext2D, label: string, color: string, size: number) => {
  ctx.fillStyle = color
  ctx.font = `bold ${size}px ${PIXEL_FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, C, C + 1)
}

const GLYPHS: { color: string; draw: Glyph }[] = [
  { color: '#ff7a59', draw: (ctx, c) => { // glow-stick burst
    stroke(ctx, c)
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4
      ctx.beginPath()
      ctx.moveTo(C + Math.cos(a) * 3, C + Math.sin(a) * 3)
      ctx.lineTo(C + Math.cos(a) * 11, C + Math.sin(a) * 11)
      ctx.stroke()
    }
  } },
  { color: '#f2f2f2', draw: (ctx, c) => { // ticket
    ctx.fillStyle = c
    ctx.fillRect(4, 10, 24, 13)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath(); ctx.arc(4, 16.5, 3, 0, Math.PI * 2); ctx.arc(28, 16.5, 3, 0, Math.PI * 2); ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = '#0e1013'
    for (let y = 12; y < 22; y += 3) ctx.fillRect(21, y, 1.5, 1.6)
  } },
  { color: '#3ddc97', draw: (ctx, c) => { // microphone
    ctx.fillStyle = c
    ctx.beginPath(); ctx.arc(C, 11, 6, 0, Math.PI * 2); ctx.fill()
    polygon(ctx, [[C - 2.5, 16], [C + 2.5, 16], [C + 1.5, 27], [C - 1.5, 27]])
    ctx.fill()
    ctx.fillStyle = '#0e1013'
    ctx.fillRect(C - 5, 10, 10, 1.4)
  } },
  { color: '#7ec8ff', draw: (ctx, c) => { // sparkle
    ctx.fillStyle = c
    polygon(ctx, [[C, C - 13], [C + 3, C - 3], [C + 13, C], [C + 3, C + 3], [C, C + 13], [C - 3, C + 3], [C - 13, C], [C - 3, C - 3]])
    ctx.fill()
  } },
  { color: '#4fd1c5', draw: (ctx, c) => { // fan-club badge
    ctx.fillStyle = c
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3
      ctx.beginPath(); ctx.arc(C + Math.cos(a) * 8, C + Math.sin(a) * 8, 3.2, 0, Math.PI * 2); ctx.fill()
    }
    ctx.beginPath(); ctx.arc(C, C, 3, 0, Math.PI * 2); ctx.fill()
  } },
  { color: '#d0d5db', draw: (ctx, c) => { // music note
    ctx.fillStyle = c
    ctx.beginPath(); ctx.ellipse(12, 23, 5, 3.6, -0.4, 0, Math.PI * 2); ctx.fill()
    ctx.fillRect(15.5, 7, 2.2, 16)
    polygon(ctx, [[17.5, 7], [25, 11.5], [25, 15.5], [17.5, 12]])
    ctx.fill()
  } },
  { color: '#ffd166', draw: (ctx, c) => { // crown
    ctx.fillStyle = c
    polygon(ctx, [[6, 23], [5, 10], [11, 16], [16, 7], [21, 16], [27, 10], [26, 23]])
    ctx.fill()
    ctx.fillRect(6, 23, 20, 3)
  } },
  { color: '#c77dff', draw: (ctx, c) => { // ribbon bow
    ctx.fillStyle = c
    polygon(ctx, [[C, C], [4, 8], [4, 24]]); ctx.fill()
    polygon(ctx, [[C, C], [28, 8], [28, 24]]); ctx.fill()
    ctx.beginPath(); ctx.arc(C, C, 3.4, 0, Math.PI * 2); ctx.fill()
  } },
  { color: '#ffe08a', draw: (ctx, c) => { // instant camera (cheki)
    ctx.fillStyle = c
    ctx.fillRect(5, 10, 22, 15)
    ctx.fillRect(9, 7, 6, 3)
    ctx.fillStyle = '#0e1013'
    ctx.beginPath(); ctx.arc(C + 1, 17.5, 5.2, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = c
    ctx.beginPath(); ctx.arc(C + 1, 17.5, 2.6, 0, Math.PI * 2); ctx.fill()
  } },
  { color: '#ff5d8f', draw: (ctx, c) => { // heart
    ctx.fillStyle = c
    ctx.beginPath(); ctx.arc(C - 5, C - 3, 6, 0, Math.PI * 2); ctx.arc(C + 5, C - 3, 6, 0, Math.PI * 2); ctx.fill()
    polygon(ctx, [[C - 11, C], [C + 11, C], [C, C + 12]])
    ctx.fill()
  } },
  { color: '#ffffff', draw: (ctx, c) => { // the idol (silhouette) — a rare card
    ctx.fillStyle = c
    ctx.beginPath(); ctx.arc(C, 10, 5, 0, Math.PI * 2); ctx.fill()
    polygon(ctx, [[C, 15], [9, 27], [23, 27]])
    ctx.fill()
    ctx.fillStyle = '#ff5ea8'
    ctx.fillRect(C - 3, 5, 6, 2)
  } },
  { color: '#4d8dff', draw: (ctx, c) => { // stage light — a rare card
    ctx.fillStyle = c
    ctx.beginPath(); ctx.arc(C, 6, 4, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = 0.6
    polygon(ctx, [[C - 3, 9], [C + 3, 9], [26, 28], [6, 28]])
    ctx.fill()
    ctx.globalAlpha = 1
  } },
  { color: '#ff5a4a', draw: (ctx, c) => { // flame (炎上) — the curse
    ctx.fillStyle = c
    polygon(ctx, [[16, 3], [22, 12], [25, 19], [21, 28], [11, 28], [7, 19], [11, 12], [13.5, 16]])
    ctx.fill()
    ctx.fillStyle = '#ffd166'
    polygon(ctx, [[16, 15], [20, 21], [18, 27], [14, 27], [12, 21]])
    ctx.fill()
  } },
  { color: '#ffcf40', draw: (ctx, c) => text(ctx, '★', c, 24) }, // scatter (fan service)
  { color: '#f5c542', draw: (ctx, c) => text(ctx, 'W', c, 24) }, // wild (the idol themself)
]

// Same colour the glyph uses — lets DOM UI (payout table) show a matching swatch
// without touching three.js.
export function symbolColor(symbolIndex: number): string {
  return GLYPHS[symbolIndex % GLYPHS.length].color
}

// The tile is drawn at 2x the glyph grid so supplied images have some detail.
const SIZE = TILE * 2
// A supplied picture fills the tile (cropped square, magnified a little and biased
// toward the top, where a portrait's face is) with a hair of margin so the
// coloured border still shows.
const IMAGE_MARGIN = 3
const IMAGE_FOCUS = { x: 0.5, y: 0.22, zoom: 1.35 }

export function createPlaceholderIconTexture(symbolIndex: number): CanvasTexture {
  const { canvas, ctx } = makeCanvas(SIZE, SIZE)
  const glyph = GLYPHS[symbolIndex % GLYPHS.length]
  const kind = SYMBOLS.find((sym) => sym.id === symbolIndex)?.kind ?? 'normal'

  const drawTileBase = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, SIZE, SIZE)
    ctx.fillStyle = kind === 'curse' ? '#2a0d0c' : '#0e1013'
    ctx.fillRect(0, 0, SIZE, SIZE)
  }
  // Tile border: a thin tint of the glyph colour; specials get a bright frame
  // so wild / scatter / curse stand out at a glance. (The curse is a flame — 炎上.)
  const drawBorder = () => {
    ctx.setTransform(SIZE / TILE, 0, 0, SIZE / TILE, 0, 0)
    ctx.globalAlpha = kind === 'normal' ? 0.55 : 1
    ctx.strokeStyle = kind === 'normal' ? glyph.color : '#ffffff'
    ctx.lineWidth = kind === 'normal' ? 1.5 : 2.5
    ctx.strokeRect(1, 1, TILE - 2, TILE - 2)
    ctx.globalAlpha = 1
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }

  // Placeholder first (so there's something to show immediately)…
  drawTileBase()
  ctx.setTransform(SIZE / TILE, 0, 0, SIZE / TILE, 0, 0)
  glyph.draw(ctx, glyph.color)
  drawBorder()

  // Swap in the supplied image once it has loaded, if there is one. A photo wants
  // smooth filtering (the glyphs stay crisp pixel art).
  const url = iconUrl(symbolIndex)
  const texture = toTexture(canvas, { smooth: Boolean(url) })
  if (url) {
    loadImage(url)
      .then((image) => {
        drawTileBase()
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        drawFitted(ctx, image, { x: IMAGE_MARGIN, y: IMAGE_MARGIN, w: SIZE - IMAGE_MARGIN * 2, h: SIZE - IMAGE_MARGIN * 2 }, 'cover', IMAGE_FOCUS)
        drawBorder()
        texture.needsUpdate = true
      })
      .catch(() => undefined) // keep the placeholder if the file can't be read
  }

  return texture
}
