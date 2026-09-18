import { create } from 'zustand'
import {
  spin as drawGrid,
  findLineWins,
  totalPayout,
  CELL_COUNT,
  SYMBOL_COUNT,
  type Grid,
  type LineWin,
} from '../game'

interface GameState {
  grid: Grid
  isSpinning: boolean
  lastWins: LineWin[]
  lastPayout: number
  spin: () => void
  // Called by the reel animation once every column has visually stopped.
  finishSpin: () => void
}

// Not a real spin result — just something more interesting than all-zeros
// to look at before the player has pushed anything.
const initialGrid: Grid = Array.from({ length: CELL_COUNT }, (_, i) => i % SYMBOL_COUNT)

export const useGameStore = create<GameState>((set, get) => ({
  grid: initialGrid,
  isSpinning: false,
  lastWins: [],
  lastPayout: 0,
  spin: () => {
    if (get().isSpinning) return
    const grid = drawGrid()
    const lastWins = findLineWins(grid)
    // The result is decided now, but stays hidden (see ReelGrid's roll
    // animation) until the reels visually stop and call finishSpin().
    set({ grid, isSpinning: true, lastWins, lastPayout: totalPayout(lastWins) })
  },
  finishSpin: () => set({ isSpinning: false }),
}))
