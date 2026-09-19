import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, MeshBasicMaterial } from 'three'
import { createPlaceholderIconTexture, SYMBOL_COUNT } from './icons'
import { COLUMNS, ROWS } from '../game/layout'
import { useGameStore } from '../store/gameStore'
import { playReelStop, playWin } from '../audio/audioEngine'

const CELL_SIZE = 0.22
const CELL_GAP = 0.04
const STEP = CELL_SIZE + CELL_GAP
const GRID_WIDTH = COLUMNS * CELL_SIZE + (COLUMNS - 1) * CELL_GAP
const GRID_HEIGHT = ROWS * CELL_SIZE + (ROWS - 1) * CELL_GAP

// Columns stop left to right, like a real slot machine, instead of all at
// once. Values are feel, not tuned.
const BASE_SPIN_DURATION = 0.5
const COLUMN_STAGGER = 0.15
const ROLL_FRAME_INTERVAL = 0.06

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

  const meshRefs = useRef<(Mesh | null)[]>([])
  const wasSpinningRef = useRef(false)
  const spinStartRef = useRef(0)
  const columnStoppedRef = useRef<boolean[]>(Array(COLUMNS).fill(true))
  const prevStoppedRef = useRef<boolean[]>(Array(COLUMNS).fill(true))

  // Cells that belong to a completed winning line — only meaningful once
  // the spin has actually stopped, so this is empty while isSpinning.
  const winningCells = useMemo(() => {
    const cells = new Set<number>()
    if (!isSpinning) {
      for (const win of lastWins) {
        for (let col = 0; col < win.matchLength; col++) {
          cells.add(win.row * COLUMNS + col)
        }
      }
    }
    return cells
  }, [isSpinning, lastWins])

  useFrame(({ clock }) => {
    if (isSpinning && !wasSpinningRef.current) {
      spinStartRef.current = clock.elapsedTime
      columnStoppedRef.current = Array(COLUMNS).fill(false)
      prevStoppedRef.current = Array(COLUMNS).fill(false)
    }
    wasSpinningRef.current = isSpinning

    if (!isSpinning) {
      for (let i = 0; i < grid.length; i++) {
        const mesh = meshRefs.current[i]
        if (!mesh) continue
        const material = mesh.material as MeshBasicMaterial
        material.map = textures[grid[i]]
        material.needsUpdate = true
        mesh.scale.setScalar(
          winningCells.has(i) ? 1 + Math.sin(clock.elapsedTime * 6) * 0.08 : 1,
        )
      }
      return
    }

    const elapsed = clock.elapsedTime - spinStartRef.current

    for (let col = 0; col < COLUMNS; col++) {
      const stopped = elapsed >= BASE_SPIN_DURATION + col * COLUMN_STAGGER
      if (stopped && !prevStoppedRef.current[col]) {
        playReelStop()
      }
      prevStoppedRef.current[col] = stopped
      columnStoppedRef.current[col] = stopped

      for (let row = 0; row < ROWS; row++) {
        const i = row * COLUMNS + col
        const mesh = meshRefs.current[i]
        if (!mesh) continue
        const material = mesh.material as MeshBasicMaterial

        if (stopped) {
          material.map = textures[grid[i]]
        } else {
          // Not the real result — just cycling textures fast for a "rolling" look.
          const rollIndex = Math.floor(elapsed / ROLL_FRAME_INTERVAL + col * 3 + row) % SYMBOL_COUNT
          material.map = textures[rollIndex]
        }
        material.needsUpdate = true
        mesh.scale.setScalar(1)
      }
    }

    if (columnStoppedRef.current.every(Boolean)) {
      if (lastWins.length > 0) playWin()
      finishSpin()
    }
  })

  return (
    <group position={position}>
      {Array.from({ length: COLUMNS * ROWS }).map((_, i) => {
        const col = i % COLUMNS
        const row = Math.floor(i / COLUMNS)
        const x = col * STEP - GRID_WIDTH / 2 + CELL_SIZE / 2
        const y = GRID_HEIGHT / 2 - row * STEP - CELL_SIZE / 2
        return (
          <mesh
            key={i}
            ref={(el) => {
              meshRefs.current[i] = el
            }}
            position={[x, y, 0]}
          >
            <planeGeometry args={[CELL_SIZE, CELL_SIZE]} />
            <meshBasicMaterial map={textures[grid[i]]} />
          </mesh>
        )
      })}
    </group>
  )
}
