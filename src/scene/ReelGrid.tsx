import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Plane, Vector3, type Mesh, type MeshBasicMaterial } from 'three'
import { createPlaceholderIconTexture, SYMBOL_COUNT } from './icons'
import { seeded } from './canvasTextures'
import { CELL_SIZE, GRID_HEIGHT, STEP, cellPosition, rowY } from './reelLayout'
import { WinEffects } from './WinEffects'
import { COLUMNS, ROWS } from '../game/layout'
import { useGameStore } from '../store/gameStore'
import { playRateLimit, playReelStop, playWin } from '../audio/audioEngine'

// While the reels spin each column shows a vertical strip of random symbols
// scrolling down with a faint ghost trailing above it (a cheap motion streak);
// the strips are clipped to the reel window. Columns stop left to right, one
// after another. The player can also stop the next reel right away (tap Space)
// or skip the whole animation (hold Space) — see store `requestReelStop/Skip`.
// The real result was decided when the spin started; the strips are decoration
// and the final symbols only appear as each column lands. Values are feel.
const BASE_SPIN_DURATION = 0.8 // seconds until the first reel stops on its own
const COLUMN_STAGGER = 0.3 // extra seconds per column after that
const SCROLL_SPEED = 11 // cells per second
const GHOST_OFFSET = STEP * 0.55 // how far the streak trails behind
const GHOST_OPACITY = 0.3
const SETTLE_SECONDS = 0.28 // the little drop-and-bounce when a reel lands
const STRIP_ROWS = ROWS + 2 // one cell above and below the window
const SEQUENCE_LENGTH = 41 // random symbols per column, cycled

// Ease with a small overshoot, for the landing bounce.
const easeOutBack = (t: number) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2
}

interface ReelGridProps {
  position: [number, number, number]
}

export function ReelGrid({ position }: ReelGridProps) {
  const grid = useGameStore((s) => s.grid)
  const isSpinning = useGameStore((s) => s.isSpinning)
  const lastWins = useGameStore((s) => s.lastWins)
  const finishSpin = useGameStore((s) => s.finishSpin)

  // One cached texture per symbol id — reused across cells and across spins,
  // never regenerated per frame.
  const textures = useMemo(
    () => Array.from({ length: SYMBOL_COUNT }, (_, i) => createPlaceholderIconTexture(i)),
    [],
  )

  // A fixed random symbol order for each column's rolling strip.
  const sequences = useMemo(
    () =>
      Array.from({ length: COLUMNS }, (_, col) => {
        const random = seeded(101 + col * 17)
        return Array.from({ length: SEQUENCE_LENGTH }, () => Math.floor(random() * SYMBOL_COUNT))
      }),
    [],
  )

  // The strips are clipped to the window (needs renderer.localClippingEnabled,
  // set in App.tsx). Planes are in world space, so they follow `position`.
  const clipPlanes = useMemo(
    () => [
      new Plane(new Vector3(0, -1, 0), position[1] + GRID_HEIGHT / 2),
      new Plane(new Vector3(0, 1, 0), -(position[1] - GRID_HEIGHT / 2)),
    ],
    [position],
  )

  const cellRefs = useRef<(Mesh | null)[]>([])
  const stripRefs = useRef<(Mesh | null)[]>([]) // [col * STRIP_ROWS + k]
  const ghostRefs = useRef<(Mesh | null)[]>([])
  const wasSpinning = useRef(false)
  const spinStart = useRef(0)
  const stopAt = useRef<number[]>(Array(COLUMNS).fill(0))
  const stopped = useRef<boolean[]>(Array(COLUMNS).fill(true))
  const settleAt = useRef<number[]>(Array(COLUMNS).fill(-10))
  const seenStops = useRef(0)
  const seenSkips = useRef(0)
  const finished = useRef(true)

  // A rate limit lights its cells red instead of pulsing them as a win.
  const rateLimited = useMemo(() => lastWins.some((w) => w.patternId === 'rate-limit'), [lastWins])

  // Cells that belong to a completed winning line — only meaningful once
  // the spin has actually stopped, so this is empty while isSpinning.
  const winningCells = useMemo(() => {
    const cells = new Set<number>()
    if (!isSpinning) {
      for (const win of lastWins) {
        for (const cell of win.cells) cells.add(cell)
      }
    }
    return cells
  }, [isSpinning, lastWins])

  useFrame(({ clock }) => {
    const now = clock.elapsedTime

    if (isSpinning && !wasSpinning.current) {
      const s = useGameStore.getState()
      spinStart.current = now
      stopAt.current = Array.from({ length: COLUMNS }, (_, col) => now + BASE_SPIN_DURATION + col * COLUMN_STAGGER)
      stopped.current = Array(COLUMNS).fill(false)
      settleAt.current = Array(COLUMNS).fill(-10)
      seenStops.current = s.reelStops
      seenSkips.current = s.reelSkips
      finished.current = false
    }
    wasSpinning.current = isSpinning

    // ---- at rest: the final symbols, winners pulsing --------------------
    if (!isSpinning) {
      for (let i = 0; i < grid.length; i++) {
        const mesh = cellRefs.current[i]
        if (!mesh) continue
        const material = mesh.material as MeshBasicMaterial
        mesh.visible = true
        material.map = textures[grid[i]]
        material.color.set(rateLimited && winningCells.has(i) ? '#ff4b3a' : '#ffffff')
        mesh.position.y = cellPosition(i)[1]
        mesh.scale.setScalar(winningCells.has(i) && !rateLimited ? 1 + Math.sin(now * 6) * 0.05 : 1)
      }
      hideAll(stripRefs.current)
      hideAll(ghostRefs.current)
      return
    }

    // ---- the player's taps: stop the next reel now / skip the animation ----
    const s = useGameStore.getState()
    if (s.reelSkips > seenSkips.current) {
      seenSkips.current = s.reelSkips
      for (let col = 0; col < COLUMNS; col++) if (!stopped.current[col]) stopAt.current[col] = now
    }
    while (s.reelStops > seenStops.current) {
      seenStops.current++
      const next = stopped.current.findIndex((done, col) => !done && stopAt.current[col] > now)
      if (next >= 0) stopAt.current[next] = now
    }

    // ---- each column: rolling strip, or landed ---------------------------
    const phase = (now - spinStart.current) * SCROLL_SPEED
    const shift = Math.floor(phase)
    const frac = (phase - shift) * STEP
    let landedThisFrame = false

    for (let col = 0; col < COLUMNS; col++) {
      const done = now >= stopAt.current[col]
      if (done && !stopped.current[col]) {
        stopped.current[col] = true
        settleAt.current[col] = now
        landedThisFrame = true
      }

      for (let row = 0; row < ROWS; row++) {
        const i = row * COLUMNS + col
        const mesh = cellRefs.current[i]
        if (!mesh) continue
        const material = mesh.material as MeshBasicMaterial
        mesh.visible = done
        if (!done) continue
        material.map = textures[grid[i]]
        material.color.set('#ffffff')
        // land with a small drop and overshoot
        const e = easeOutBack(Math.min(1, (now - settleAt.current[col]) / SETTLE_SECONDS))
        mesh.position.y = cellPosition(i)[1] + (1 - e) * 0.07
        mesh.scale.setScalar(1)
      }

      for (let k = 0; k < STRIP_ROWS; k++) {
        const strip = stripRefs.current[col * STRIP_ROWS + k]
        const ghost = ghostRefs.current[col * STRIP_ROWS + k]
        if (!strip || !ghost) continue
        strip.visible = !done
        ghost.visible = !done
        if (done) continue
        const row = k - 1 // -1 .. ROWS
        const y = rowY(row) - frac
        const symbol = sequences[col][(((shift - row) % SEQUENCE_LENGTH) + SEQUENCE_LENGTH) % SEQUENCE_LENGTH]
        ;(strip.material as MeshBasicMaterial).map = textures[symbol]
        ;(ghost.material as MeshBasicMaterial).map = textures[symbol]
        strip.position.y = y
        ghost.position.y = y + GHOST_OFFSET
      }
    }

    // one landing sound per frame, however many columns stopped together (skip)
    if (landedThisFrame) playReelStop()

    if (!finished.current && stopped.current.every(Boolean)) {
      finished.current = true
      if (rateLimited) playRateLimit()
      else if (lastWins.length > 0) playWin()
      finishSpin()
    }
  })

  return (
    <group position={position}>
      {/* the final symbols */}
      {Array.from({ length: COLUMNS * ROWS }).map((_, i) => {
        const [x, y] = cellPosition(i)
        return (
          <mesh
            key={i}
            ref={(el) => {
              cellRefs.current[i] = el
            }}
            position={[x, y, 0]}
          >
            <planeGeometry args={[CELL_SIZE, CELL_SIZE]} />
            <meshBasicMaterial map={textures[grid[i]]} />
          </mesh>
        )
      })}

      {/* the rolling strips (with their motion-streak ghosts), one per column */}
      {Array.from({ length: COLUMNS * STRIP_ROWS }).map((_, n) => {
        const [x] = cellPosition(Math.floor(n / STRIP_ROWS))
        return (
          <group key={n} position={[x, 0, 0.002]}>
            <mesh
              visible={false}
              ref={(el) => {
                ghostRefs.current[n] = el
              }}
            >
              <planeGeometry args={[CELL_SIZE, CELL_SIZE]} />
              <meshBasicMaterial transparent opacity={GHOST_OPACITY} depthWrite={false} clippingPlanes={clipPlanes} />
            </mesh>
            <mesh
              visible={false}
              position={[0, 0, 0.001]}
              ref={(el) => {
                stripRefs.current[n] = el
              }}
            >
              <planeGeometry args={[CELL_SIZE, CELL_SIZE]} />
              <meshBasicMaterial clippingPlanes={clipPlanes} />
            </mesh>
          </group>
        )
      })}

      <WinEffects />
    </group>
  )
}

function hideAll(meshes: (Mesh | null)[]) {
  meshes.forEach((mesh) => mesh && (mesh.visible = false))
}
