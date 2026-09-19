import { create } from 'zustand'
import {
  spin as drawGrid,
  findLineWins,
  computePayout,
  resolveModifiers,
  drawShopOffer,
  findCharm,
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

// 'shop' sits between stages: entered on a stage clear, left via leaveShop().
export type GameStatus = 'playing' | 'shop' | 'gameOver'

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
  // Owned charm ids (each can be owned once) and the current shop's stock.
  charms: string[]
  shopOffer: string[]
  spin: () => void
  // Called by the reel animation once every column has visually stopped.
  // This is where the payout lands in `money` and the stage outcome is decided.
  finishSpin: () => void
  buyCharm: (id: string) => void
  leaveShop: () => void
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
  charms: [] as string[],
  shopOffer: [] as string[],
})

export const useGameStore = create<GameState>((set, get) => ({
  ...freshRun(),
  spin: () => {
    const { isSpinning, status, turnsLeft, charms } = get()
    if (isSpinning || status !== 'playing' || turnsLeft <= 0) return
    playSpinStart()
    const mods = resolveModifiers(charms)
    const grid = drawGrid(Math.random, mods.weightBoosts)
    const lastWins = findLineWins(grid)
    // The result is decided now, but stays hidden (see ReelGrid's roll
    // animation) until the reels visually stop and call finishSpin().
    // The turn is spent up front; the payout is only banked in finishSpin().
    set({
      grid,
      isSpinning: true,
      lastWins,
      lastPayout: computePayout(lastWins, mods),
      turnsLeft: turnsLeft - 1,
    })
  },
  finishSpin: () => {
    const s = get()
    const money = s.money + s.lastPayout

    if (money >= s.quota) {
      // Money carries over. The turn allowance resets when the shop is left,
      // so charms bought there (e.g. +1 turn) count for the coming stage.
      const stage = s.stage + 1
      set({
        isSpinning: false,
        money: money + resolveModifiers(s.charms).clearBonus,
        stage,
        quota: quotaForStage(stage),
        status: 'shop',
        shopOffer: drawShopOffer(s.charms),
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
  buyCharm: (id) => {
    const { status, shopOffer, charms, money } = get()
    const charm = findCharm(id)
    if (status !== 'shop' || !charm || !shopOffer.includes(id) || charms.includes(id)) return
    if (money < charm.price) return
    set({ money: money - charm.price, charms: [...charms, id] })
  },
  leaveShop: () => {
    const { status, charms } = get()
    if (status !== 'shop') return
    set({
      status: 'playing',
      shopOffer: [],
      turnsLeft: TURNS_PER_STAGE + resolveModifiers(charms).extraTurns,
    })
  },
  restart: () => set(freshRun()),
}))
