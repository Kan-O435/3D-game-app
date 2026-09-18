import { useMemo } from 'react'
import { createPlaceholderIconTexture, SYMBOL_COUNT } from './icons'

// 5 reels x 3 rows = 15 visible cells (see CLAUDE.md "Game design constants").
const COLUMNS = 5
const ROWS = 3
const CELL_SIZE = 0.22
const CELL_GAP = 0.04
const STEP = CELL_SIZE + CELL_GAP
const GRID_WIDTH = COLUMNS * CELL_SIZE + (COLUMNS - 1) * CELL_GAP
const GRID_HEIGHT = ROWS * CELL_SIZE + (ROWS - 1) * CELL_GAP

interface ReelGridProps {
  position: [number, number, number]
}

export function ReelGrid({ position }: ReelGridProps) {
  // Fixed placeholder textures, one per symbol, just to prove the grid out.
  // Phase 4 (spin logic) decides which symbol lands in which cell per spin —
  // this component doesn't know about game state yet.
  const textures = useMemo(
    () => Array.from({ length: SYMBOL_COUNT }, (_, i) => createPlaceholderIconTexture(i)),
    [],
  )

  return (
    <group position={position}>
      {textures.map((texture, i) => {
        const col = i % COLUMNS
        const row = Math.floor(i / COLUMNS)
        const x = col * STEP - GRID_WIDTH / 2 + CELL_SIZE / 2
        const y = GRID_HEIGHT / 2 - row * STEP - CELL_SIZE / 2
        return (
          <mesh key={i} position={[x, y, 0]}>
            <planeGeometry args={[CELL_SIZE, CELL_SIZE]} />
            <meshBasicMaterial map={texture} />
          </mesh>
        )
      })}
    </group>
  )
}
