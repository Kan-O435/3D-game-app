import { useCallback, useEffect, useMemo, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/gameStore'
import { makeCanvas, toTexture } from './canvasTextures'

// The machine's lit-up signs and displays. Each is a plane with a low-res canvas
// texture that gets redrawn when the numbers it shows change (the canvases are
// tiny and sampled with nearest-neighbour, so it reads as pixel art).

export const MACHINE_TITLE = 'OSHI KATSU' // placeholder product name (docs/NOTES.md)

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void

type Screen2D = { ctx: CanvasRenderingContext2D; texture: ReturnType<typeof toTexture> }

function redraw(screen: Screen2D, draw: Draw, width: number, height: number) {
  draw(screen.ctx, width, height)
  screen.texture.needsUpdate = true
}

/** Advance a scrolling texture (kept out of the component so it isn't a hook mutation). */
function scrollTexture(texture: Screen2D['texture'], seconds: number, speed: number) {
  texture.offset.x = (seconds * speed) % 1
}

/** A canvas texture that redraws whenever `draw` changes (wrap it in useCallback). */
function useScreen(width: number, height: number, draw: Draw, scrolls = false) {
  const screen = useMemo(() => {
    const { canvas, ctx } = makeCanvas(width, height)
    // A scrolling screen needs wrap-around sampling so its offset can loop.
    return { ctx, texture: toTexture(canvas, scrolls ? { repeat: [1, 1] } : {}) }
  }, [width, height, scrolls])
  useEffect(() => redraw(screen, draw, width, height), [screen, draw, width, height])
  return screen.texture
}

function glowText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'center') {
  ctx.font = `bold ${size}px ui-monospace, "Courier New", monospace`
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.shadowColor = color
  ctx.shadowBlur = 4
  ctx.fillStyle = color
  ctx.fillText(text, x, y)
  ctx.shadowBlur = 0
}

function Screen({ width, height, position, texture, children }: { width: number; height: number; position: [number, number, number]; texture: ReturnType<typeof toTexture>; children?: ReactNode }) {
  return (
    <mesh position={position}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
      {children}
    </mesh>
  )
}

/** The lit sign on top of the machine. */
export function MarqueeSign({ position }: { position: [number, number, number] }) {
  const draw = useCallback<Draw>((ctx, w, h) => {
    ctx.fillStyle = '#07130f'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#1d4a3c'
    ctx.lineWidth = 2
    ctx.strokeRect(3, 3, w - 6, h - 6)
    glowText(ctx, MACHINE_TITLE, w / 2, h / 2 + 1, 15, '#7dffd9')
  }, [])
  return <Screen width={1.2} height={0.22} position={position} texture={useScreen(160, 30, draw)} />
}

/** "STAGE n" plate above the reels. */
export function StagePlate({ position }: { position: [number, number, number] }) {
  const stage = useGameStore((s) => s.stage)
  const draw = useCallback<Draw>(
    (ctx, w, h) => {
      ctx.fillStyle = '#1b1613'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#6b5a44'
      ctx.strokeRect(0.5, 0.5, w - 1, h - 1)
      glowText(ctx, `STAGE ${stage}`, w / 2, h / 2 + 1, 15, '#e8dcc0')
    },
    [stage],
  )
  return <Screen width={0.5} height={0.1} position={position} texture={useScreen(96, 20, draw)} />
}

/** The paper slip with the spin fee. */
export function FeePlate({ position }: { position: [number, number, number] }) {
  const spinCost = useGameStore((s) => s.spinCost)
  const draw = useCallback<Draw>(
    (ctx, w, h) => {
      ctx.fillStyle = '#d9c9a0'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      ctx.fillRect(0, h - 3, w, 3)
      glowText(ctx, `FEE ${spinCost}`, w / 2, h / 2 + 1, 15, '#3a2a16')
    },
    [spinCost],
  )
  return <Screen width={0.46} height={0.1} position={position} texture={useScreen(96, 20, draw)} />
}

/** The engraved plate under the reels. */
export function TerminalPlate({ position }: { position: [number, number, number] }) {
  const draw = useCallback<Draw>((ctx, w, h) => {
    ctx.fillStyle = '#4a3a22'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#9a7c3e'
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1)
    glowText(ctx, 'FAN CLUB', w / 2, h / 2 + 1, 13, '#e6c987')
  }, [])
  return <Screen width={0.6} height={0.1} position={position} texture={useScreen(96, 16, draw)} />
}

/**
 * The display in the PUSH panel. On the title screen it just says PUSH; while
 * playing it becomes three readouts: coins (with what's due), heat (performance),
 * and days left before the event.
 */
export function DisplayStrip({ position }: { position: [number, number, number] }) {
  const status = useGameStore((s) => s.status)
  const isSpinning = useGameStore((s) => s.isSpinning)
  const money = useGameStore((s) => s.money)
  const due = useGameStore((s) => s.due)
  const perf = useGameStore((s) => s.perf)
  const perfNeeded = useGameStore((s) => s.perfNeeded)
  const turnsLeft = useGameStore((s) => s.turnsLeft)
  const spinCost = useGameStore((s) => s.spinCost)

  const draw = useCallback<Draw>(
    (ctx, w, h) => {
      ctx.fillStyle = '#050403'
      ctx.fillRect(0, 0, w, h)

      if (status === 'title') {
        glowText(ctx, 'PUSH', w / 2, h / 2 + 1, 38, '#e9e2c8')
        return
      }
      if (status !== 'playing') {
        glowText(ctx, '----', w / 2, h / 2, 30, '#3b3226')
        return
      }

      // Three cells, each a small label over a big value. The coin cell's label is
      // what's due, so coins-vs-debt reads at a glance.
      const cell = w / 3
      const columns = [
        { label: `DUE ${due}`, value: String(money), color: money >= due ? '#6dff9a' : money < spinCost ? '#ff6a5a' : '#ffb84a' },
        { label: 'HEAT', value: `${perf}/${perfNeeded}`, color: perf >= perfNeeded ? '#6dff9a' : '#6cc4ff' },
        { label: 'DAYS', value: isSpinning ? '..' : String(turnsLeft), color: turnsLeft <= 2 ? '#ff6a5a' : '#ffb84a' },
      ]
      columns.forEach((c, i) => {
        const cx = cell * i + cell / 2
        glowText(ctx, c.label, cx, 11, 13, '#a8956f')
        glowText(ctx, c.value, cx, h - 20, 30, c.color)
        if (i > 0) {
          ctx.fillStyle = '#2a2016'
          ctx.fillRect(cell * i, 5, 1, h - 10)
        }
      })
    },
    [status, isSpinning, money, due, perf, perfNeeded, turnsLeft, spinCost],
  )
  return <Screen width={1.0} height={0.27} position={position} texture={useScreen(224, 60, draw)} />
}

/** The scrolling strip along the base of the machine. */
export function Ticker({ position }: { position: [number, number, number] }) {
  const stage = useGameStore((s) => s.stage)
  const due = useGameStore((s) => s.due)
  const turnsLeft = useGameStore((s) => s.turnsLeft)
  const draw = useCallback<Draw>(
    (ctx, w, h) => {
      ctx.fillStyle = '#0a0706'
      ctx.fillRect(0, 0, w, h)
      // The phrase is drawn twice so one canvas width is exactly one period —
      // scrolling the texture offset then loops without a seam.
      const phrase = `* LIVE ${stage} * DUE ${due} * ${turnsLeft} DAYS *`
      glowText(ctx, phrase, w / 4, h / 2 + 1, 12, '#ffb84a')
      glowText(ctx, phrase, (w * 3) / 4, h / 2 + 1, 12, '#ffb84a')
    },
    [stage, due, turnsLeft],
  )
  const texture = useScreen(512, 20, draw, true)
  useFrame(({ clock }) => {
    scrollTexture(texture, clock.elapsedTime, 0.04)
  })
  return <Screen width={1.6} height={0.1} position={position} texture={texture} />
}
