import { makeCanvas, seeded } from './canvasTextures'

// Text and paper for the wall props (order sheet, rules, the exchange board...).
// Drawn small and sampled nearest-neighbour like everything else; English only
// so it stays legible in any browser (see docs/NOTES.md "Looking at the game").
const FONT = 'ui-monospace, "Courier New", monospace'

type Ctx = CanvasRenderingContext2D

function text(ctx: Ctx, label: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'left') {
  ctx.font = `bold ${size}px ${FONT}`
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  ctx.fillText(label, x, y)
}

/** Paper with a little grain and a darker edge. */
function paper(width: number, height: number, base: string, seed: number) {
  const { canvas, ctx } = makeCanvas(width, height)
  const random = seeded(seed)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, width, height)
  for (let i = 0; i < width * height * 0.02; i++) {
    ctx.fillStyle = random() < 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)'
    ctx.fillRect(Math.floor(random() * width), Math.floor(random() * height), 1, 1)
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1)
  return { canvas, ctx }
}

/** The stage order pinned to the left wall (numbers live in the DOM sheet). */
export function workOrderCanvas() {
  const { canvas, ctx } = paper(110, 148, '#ddd4bb', 41)
  text(ctx, 'WORK ORDER', 55, 15, 13, '#231d16', 'center')
  ctx.fillStyle = '#231d16'
  ctx.fillRect(8, 26, 94, 1)
  text(ctx, 'RE: QUOTA MUST BE MET', 55, 37, 8, '#4a3f30', 'center')
  const rows = ['DUE', 'PERFORMANCE', 'TURNS', 'SPIN FEE']
  rows.forEach((label, i) => {
    const y = 52 + i * 17
    text(ctx, label, 10, y, 9, '#231d16')
    ctx.fillStyle = '#a3231b'
    ctx.fillRect(66, y + 5, 34, 2) // the blank the number goes on
  })
  text(ctx, 'COMPLY.', 10, 133, 10, '#a3231b')
  // a red approval stamp
  ctx.strokeStyle = 'rgba(163,35,27,0.85)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(86, 130, 13, 0, Math.PI * 2)
  ctx.stroke()
  text(ctx, 'OK', 86, 130, 11, 'rgba(163,35,27,0.9)', 'center')
  return canvas
}

/** The rules sheet next to it. */
export function rulesCanvas() {
  const { canvas, ctx } = paper(84, 128, '#c9c1a8', 43)
  text(ctx, 'STANDARDS', 42, 12, 10, '#231d16', 'center')
  ctx.fillStyle = '#231d16'
  ctx.fillRect(6, 20, 72, 1)
  ;['1 SPIN = 1 TURN', 'MATCH FROM LEFT', 'W  = ANY SYMBOL', '*  = 3+ ANYWHERE', '666 = LIMIT', 'PAY OR ELSE.'].forEach((line, i) => {
    text(ctx, line, 7, 32 + i * 14, 7, i === 5 ? '#a3231b' : '#3a3024')
  })
  return canvas
}

/** A small pinned scrap with scribbled lines — pure set dressing. */
export function noteCanvas(seed: number) {
  const { canvas, ctx } = paper(40, 48, '#d8cfb2', seed)
  const random = seeded(seed + 9)
  ctx.fillStyle = 'rgba(40,32,24,0.7)'
  for (let i = 0; i < 6; i++) ctx.fillRect(4, 7 + i * 6.5, 10 + Math.floor(random() * 24), 1.5)
  return canvas
}

/** The corkboard of item slips at the exchange counter: 4 x 2, each with a name bar and a price stamp. */
export function slipsBoardCanvas() {
  const width = 200
  const height = 108
  const { canvas, ctx } = makeCanvas(width, height)
  const random = seeded(47)
  ctx.fillStyle = '#3a2d23'
  ctx.fillRect(0, 0, width, height)
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = random() < 0.5 ? '#2c221a' : '#493a2d'
    ctx.fillRect(Math.floor(random() * width), Math.floor(random() * height), 1, 1)
  }
  const slipW = 42
  const slipH = 44
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      const x = 8 + col * 48
      const y = 6 + row * 51
      ctx.fillStyle = '#ddd3b8'
      ctx.fillRect(x, y, slipW, slipH)
      ctx.fillStyle = '#b9143a'
      ctx.fillRect(x + 3, y + 3, 8, 6)
      text(ctx, String(row * 4 + col + 1), x + 7, y + 6.5, 6, '#f4e9d0', 'center')
      ctx.fillStyle = '#231d16'
      ctx.fillRect(x + 5, y + 16, 22 + Math.floor(random() * 12), 2)
      ctx.fillRect(x + 5, y + 22, 14 + Math.floor(random() * 16), 2)
      ctx.strokeStyle = 'rgba(163,35,27,0.9)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(x + 30, y + 34, 7, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  return canvas
}

/** The lit sign over the exchange counter. */
export function exchangeSignCanvas() {
  const { canvas, ctx } = makeCanvas(128, 24)
  ctx.fillStyle = '#08130d'
  ctx.fillRect(0, 0, 128, 24)
  ctx.strokeStyle = '#1f5a3a'
  ctx.strokeRect(1.5, 1.5, 125, 21)
  ctx.shadowColor = '#7dffb0'
  ctx.shadowBlur = 4
  text(ctx, 'EXCHANGE', 64, 13, 15, '#8dffbe', 'center')
  return canvas
}

/** The little green CRT on the counter. */
export function monitorCanvas() {
  const { canvas, ctx } = makeCanvas(72, 56)
  ctx.fillStyle = '#05140a'
  ctx.fillRect(0, 0, 72, 56)
  ctx.shadowColor = '#5dff8f'
  ctx.shadowBlur = 3
  text(ctx, 'EXCHANGE', 36, 10, 10, '#7dffa5', 'center')
  ctx.fillStyle = '#3aa85f'
  ctx.fillRect(6, 18, 60, 1)
  text(ctx, 'BALANCE', 8, 28, 9, '#7dffa5')
  text(ctx, 'BUY 1-8', 8, 40, 9, '#5fd985')
  text(ctx, '_', 60, 40, 9, '#7dffa5')
  return canvas
}

/** A label plate for a desk button. */
export function plateCanvas(label: string, background: string, color: string) {
  const { canvas, ctx } = makeCanvas(64, 20)
  ctx.fillStyle = background
  ctx.fillRect(0, 0, 64, 20)
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'
  ctx.strokeRect(0.5, 0.5, 63, 19)
  text(ctx, label, 32, 10.5, 9, color, 'center')
  return canvas
}
