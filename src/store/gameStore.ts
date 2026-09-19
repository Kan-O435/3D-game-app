import { create } from 'zustand'
import {
  spin as drawGrid,
  findLineWins,
  totalPayout,
  quotaForStage,
  CELL_COUNT,
  SYMBOL_COUNT,
  STARTING_MONEY,
  TURNS_PER_STAGE,
  WARNING_TURNS,
  type Grid,
  type LineWin,
} from '../game'
import { playSpinStart, playWarning } from '../audio/audioEngine'

export type GameStatus = 'playing' | 'gameOver'

interface GameState {
  grid: Grid
  isSpinning: boolean
  lastWins: LineWin[]
  lastPayout: number
  status: GameStatus
  money: number
  stage: number
  quota: number
  turnsLeft: number
  // Bumped each time a stage is cleared, so the HUD can react (flash a
  // "STAGE CLEAR" banner, etc.) without needing to diff `stage` itself.
  stageClearCount: number
  spin: () => void
  // Called by the reel animation once every column has visually stopped.
  // This is where the payout lands in `money` and the stage outcome is decided.
  finishSpin: () => void
  restart: () => void
}

// Not a real spin result — just something more interesting than all-zeros
// to look at before the player has pushed anything.
const initialGrid: Grid = Array.from({ length: CELL_COUNT }, (_, i) => i % SYMBOL_COUNT)

const freshRun = () => ({
  grid: initialGrid,
  isSpinning: false,
  lastWins: [] as LineWin[],
  lastPayout: 0,
  status: 'playing' as GameStatus,
  money: STARTING_MONEY,
  stage: 1,
  quota: quotaForStage(1),
  turnsLeft: TURNS_PER_STAGE,
  stageClearCount: 0,
})

export const useGameStore = create<GameState>((set, get) => ({
  ...freshRun(),
  spin: () => {
    const { isSpinning, status, turnsLeft } = get()
    if (isSpinning || status !== 'playing' || turnsLeft <= 0) return
    playSpinStart()
    const grid = drawGrid()
    const lastWins = findLineWins(grid)
    // The result is decided now, but stays hidden (see ReelGrid's roll
    // animation) until the reels visually stop and call finishSpin().
    // The turn is spent up front; the payout is only banked in finishSpin().
    set({
      grid,
      isSpinning: true,
      lastWins,
      lastPayout: totalPayout(lastWins),
      turnsLeft: turnsLeft - 1,
    })
  },
  finishSpin: () => {
    const s = get()
    const money = s.money + s.lastPayout

    if (money >= s.quota) {
      // Money carries over; only the turn allowance resets and the bar rises.
      const stage = s.stage + 1
      set({
        isSpinning: false,
        money,
        stage,
        quota: quotaForStage(stage),
        turnsLeft: TURNS_PER_STAGE,
        stageClearCount: s.stageClearCount + 1,
      })
      return
    }

    if (s.turnsLeft <= 0) {
      set({ isSpinning: false, money, status: 'gameOver' })
      return
    }

    if (s.turnsLeft <= WARNING_TURNS) playWarning()
    set({ isSpinning: false, money })
  },
  restart: () => set(freshRun()),
}))
