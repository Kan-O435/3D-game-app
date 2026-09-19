import { CanvasTexture } from 'three'
import { SYMBOL_COUNT, SYMBOLS } from '../game/symbols'
import { makeCanvas, toTexture } from './canvasTextures'

export { SYMBOL_COUNT }

// Placeholder art: a dark tile with a simple coloured glyph per symbol, drawn at
// 32x32 and sampled nearest-neighbour so it reads as chunky pixel art. Swap this
// out once the real icon theme is decided (docs/NOTES.md "Open questions").
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
  ctx.font = `bold ${size}px ui-monospace, "Courier New", monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, C, C + 1)
}

const GLYPHS: { color: string; draw: Glyph }[] = [
  { color: '#ff7a59', draw: (ctx, c) => { // burst
    stroke(ctx, c)
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4
      ctx.beginPath()
      ctx.moveTo(C + Math.cos(a) * 3, C + Math.sin(a) * 3)
      ctx.lineTo(C + Math.cos(a) * 11, C + Math.sin(a) * 11)
      ctx.stroke()
    }
  } },
  { color: '#f2f2f2', draw: (ctx, c) => { // cube
    stroke(ctx, c)
    const pts: [number, number][] = Array.from({ length: 6 }, (_, i) => [C + Math.cos((i * Math.PI) / 3 - Math.PI / 2) * 11, C + Math.sin((i * Math.PI) / 3 - Math.PI / 2) * 11])
    polygon(ctx, pts)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(C, C); ctx.lineTo(pts[1][0], pts[1][1])
    ctx.moveTo(C, C); ctx.lineTo(pts[3][0], pts[3][1])
    ctx.moveTo(C, C); ctx.lineTo(pts[5][0], pts[5][1])
    ctx.stroke()
  } },
  { color: '#3ddc97', draw: (ctx, c) => { // knot
    stroke(ctx, c)
    ctx.beginPath(); ctx.arc(C, C, 10, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(C + 3, C - 2, 5, 0, Math.PI * 2); ctx.stroke()
  } },
  { color: '#7ec8ff', draw: (ctx, c) => { // four-point star
    ctx.fillStyle = c
    polygon(ctx, [[C, C - 13], [C + 3, C - 3], [C + 13, C], [C + 3, C + 3], [C, C + 13], [C - 3, C + 3], [C - 13, C], [C - 3, C - 3]])
    ctx.fill()
  } },
  { color: '#4fd1c5', draw: (ctx, c) => { // flower
    ctx.fillStyle = c
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3
      ctx.beginPath(); ctx.arc(C + Math.cos(a) * 8, C + Math.sin(a) * 8, 3.2, 0, Math.PI * 2); ctx.fill()
    }
    ctx.beginPath(); ctx.arc(C, C, 3, 0, Math.PI * 2); ctx.fill()
  } },
  { color: '#d0d5db', draw: (ctx, c) => { // open ring
    stroke(ctx, c, 3.5)
    ctx.beginPath(); ctx.arc(C, C, 9.5, Math.PI * 0.25, Math.PI * 1.75); ctx.stroke()
  } },
  { color: '#ffd166', draw: (ctx, c) => { // triangle
    ctx.fillStyle = c
    polygon(ctx, [[C, C - 11], [C + 11, C + 9], [C - 11, C + 9]])
    ctx.fill()
  } },
  { color: '#c77dff', draw: (ctx, c) => { // plus
    ctx.fillStyle = c
    ctx.fillRect(C - 3, C - 11, 6, 22)
    ctx.fillRect(C - 11, C - 3, 22, 6)
  } },
  { color: '#ffe08a', draw: (ctx, c) => { // crescent
    ctx.fillStyle = c
    ctx.beginPath(); ctx.arc(C, C, 11, 0, Math.PI * 2); ctx.fill()
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath(); ctx.arc(C + 5, C - 3, 9, 0, Math.PI * 2); ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  } },
  { color: '#ff5d8f', draw: (ctx, c) => { // heart
    ctx.fillStyle = c
    ctx.beginPath(); ctx.arc(C - 5, C - 3, 6, 0, Math.PI * 2); ctx.arc(C + 5, C - 3, 6, 0, Math.PI * 2); ctx.fill()
    polygon(ctx, [[C - 11, C], [C + 11, C], [C, C + 12]])
    ctx.fill()
  } },
  { color: '#ffffff', draw: (ctx, c) => { // K
    text(ctx, 'K', c, 24)
    ctx.fillStyle = '#4d8dff'
    ctx.fillRect(C + 8, C - 12, 3, 3)
  } },
  { color: '#4d8dff', draw: (ctx, c) => { // whale
    ctx.fillStyle = c
    ctx.beginPath(); ctx.ellipse(C - 1, C + 2, 11, 7, 0, 0, Math.PI * 2); ctx.fill()
    polygon(ctx, [[C + 8, C + 1], [C + 14, C - 6], [C + 14, C + 7]])
    ctx.fill()
    ctx.fillStyle = '#0e1013'
    ctx.fillRect(C - 8, C, 2, 2)
  } },
  { color: '#ff5a4a', draw: (ctx, c) => text(ctx, '6', c, 26) }, // curse
  { color: '#ffcf40', draw: (ctx, c) => text(ctx, '★', c, 24) }, // scatter
  { color: '#f5c542', draw: (ctx, c) => text(ctx, 'W', c, 24) }, // wild
]

// Same colour the glyph uses — lets DOM UI (payout table) show a matching swatch
// without touching three.js.
export function symbolColor(symbolIndex: number): string {
  return GLYPHS[symbolIndex % GLYPHS.length].color
}

export function createPlaceholderIconTexture(symbolIndex: number): CanvasTexture {
  const { canvas, ctx } = makeCanvas(TILE, TILE)
  const glyph = GLYPHS[symbolIndex % GLYPHS.length]
  const kind = SYMBOLS.find((sym) => sym.id === symbolIndex)?.kind ?? 'normal'

  ctx.fillStyle = kind === 'curse' ? '#2a0d0c' : '#0e1013'
  ctx.fillRect(0, 0, TILE, TILE)
  glyph.draw(ctx, glyph.color)

  // Tile border: a thin tint of the glyph colour; specials get a bright frame
  // so wild / scatter / curse stand out at a glance.
  ctx.globalAlpha = kind === 'normal' ? 0.55 : 1
  ctx.strokeStyle = kind === 'normal' ? glyph.color : '#ffffff'
  ctx.lineWidth = kind === 'normal' ? 1.5 : 2.5
  ctx.strokeRect(1, 1, TILE - 2, TILE - 2)
  ctx.globalAlpha = 1

  return toTexture(canvas)
}
