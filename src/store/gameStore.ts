import { create } from 'zustand'
import {
  spin as drawGrid,
  findLineWins,
  BASE_PATTERN_IDS,
  computePayout,
  resolveModifiers,
  drawShopOffer,
  findCharm,
  dueForStage,
  CELL_COUNT,
  SYMBOL_COUNT,
  STARTING_MONEY,
  TURNS_PER_STAGE,
  WARNING_TURNS,
  type Grid,
  type LineWin,
} from '../game'
import { playSpinStart, playWarning } from '../audio/audioEngine'

// 'shop' sits between stages: entered after paying a stage's debt, left via
// leaveShop().
export type GameStatus = 'playing' | 'shop' | 'gameOver'

interface GameState {
  grid: Grid
  isSpinning: boolean
  lastWins: LineWin[]
  lastPayout: number
  status: GameStatus
  money: number
  stage: number
  // Debt payment owed when this stage's turns run out.
  due: number
  // Turns left before the deadline (the last one is the deadline turn).
  turnsLeft: number
  // Owned charm ids (each can be owned once) and the current shop's stock.
  charms: string[]
  shopOffer: string[]
  spin: () => void
  // Called by the reel animation once every column has visually stopped.
  // This is where the payout lands in `money` and, on the deadline turn, the
  // debt is paid (or the run ends).
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
  due: dueForStage(1),
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
    const lastWins = findLineWins(grid, [...BASE_PATTERN_IDS, ...mods.extraPatterns])
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

    // Deadline not reached yet — keep spinning. (Having enough money already
    // doesn't end the stage early; the payment is taken on the last turn.)
    if (s.turnsLeft > 0) {
      if (s.turnsLeft <= WARNING_TURNS) playWarning()
      set({ isSpinning: false, money })
      return
    }

    // Deadline: pay the debt or it's over.
    if (money < s.due) {
      set({ isSpinning: false, money, status: 'gameOver' })
      return
    }

    // Paid. Leftover coins carry over. The turn allowance resets when the shop
    // is left, so charms bought there (e.g. +1 turn) count for the next stage.
    const stage = s.stage + 1
    set({
      isSpinning: false,
      money: money - s.due + resolveModifiers(s.charms).clearBonus,
      stage,
      due: dueForStage(stage),
      status: 'shop',
      shopOffer: drawShopOffer(s.charms),
    })
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
