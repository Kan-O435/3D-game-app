import { CanvasTexture } from 'three'
import { SYMBOL_COUNT, SYMBOLS } from '../game/symbols'

export { SYMBOL_COUNT }

// Placeholder only: a colored, numbered swatch per symbol slot so the grid
// has visibly distinct textures to show. Swap this out once the real icon
// theme is decided (see docs/NOTES.md "Open questions" — still undecided).
// Must have at least SYMBOL_COUNT entries — keep in sync with game/symbols.ts.
const PLACEHOLDER_COLORS = [
  '#e63946', '#f1a208', '#f4d35e', '#8ac926', '#43aa8b',
  '#4d908e', '#277da1', '#577590', '#9d4edd', '#c77dff',
  '#f72585', '#ff9f1c', '#2ec4b6', '#e76f51', '#a8dadc',
]

export function createPlaceholderIconTexture(symbolIndex: number): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = PLACEHOLDER_COLORS[symbolIndex % PLACEHOLDER_COLORS.length]
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Specials get a border and a letter instead of a number so they read as
  // different at a glance (wild = W, scatter = star).
  const kind = SYMBOLS.find((sym) => sym.id === symbolIndex)?.kind ?? 'normal'
  if (kind !== 'normal') {
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 8
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8)
  }

  ctx.fillStyle = kind === 'normal' ? '#00000080' : '#000000cc'
  ctx.font = 'bold 56px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const label = kind === 'wild' ? 'W' : kind === 'scatter' ? '★' : String(symbolIndex + 1)
  ctx.fillText(label, canvas.width / 2, canvas.height / 2)

  const texture = new CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}
