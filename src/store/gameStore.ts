import { create } from 'zustand'
import {
  spin as drawGrid,
  findLineWins,
  BASE_PATTERN_IDS,
  computePayout,
  computePerformance,
  resolveModifiers,
  drawShopOffer,
  findCharm,
  termsFor,
  CELL_COUNT,
  SYMBOL_COUNT,
  STARTING_MONEY,
  TURNS_PER_STAGE,
  WARNING_TURNS,
  SHOP_SLOTS,
  REROLL_COST,
  type Grid,
  type LineWin,
} from '../game'
import { playSpinStart, playWarning } from '../audio/audioEngine'

// One pass through the game:
//   title -> briefing -> playing -> (deadline) -> shop -> briefing -> playing ...
// 'briefing' is the stage's order sheet, 'shop' the exchange counter between
// stages; each has its own camera station (see scene/FixedCamera.tsx).
export type GameStatus = 'title' | 'briefing' | 'playing' | 'shop' | 'gameOver'

// Why a run ended, for the game-over screen.
export type FailReason = 'tokens' | 'perf'

interface GameState {
  grid: Grid
  isSpinning: boolean
  lastWins: LineWin[]
  lastPayout: number
  lastPerf: number
  status: GameStatus
  failReason: FailReason | null
  money: number
  stage: number
  // This stage's order (see game/stage.ts): coins due on the last turn,
  // performance points required by then, and the fee charged per spin.
  due: number
  perfNeeded: number
  spinCost: number
  // Performance points earned so far this stage.
  perf: number
  // Turns left before the deadline (the last one is the deadline turn).
  turnsLeft: number
  // What was paid at the last deadline (for the shop's header).
  lastPaid: number
  // Owned charm ids (each can be owned once) and the current shop's stock.
  charms: string[]
  shopOffer: string[]
  startRun: () => void
  acceptOrder: () => void
  spin: () => void
  // Called by the reel animation once every column has visually stopped.
  // This is where the payout lands in `money` and, on the deadline turn, the
  // order is settled (or the run ends).
  finishSpin: () => void
  buyCharm: (id: string) => void
  rerollShop: () => void
  leaveShop: () => void
  restart: () => void
}

// Not a real spin result — just something more interesting than all-zeros
// to look at before the player has pushed anything.
const initialGrid: Grid = Array.from({ length: CELL_COUNT }, (_, i) => i % SYMBOL_COUNT)

const freshRun = (status: GameStatus) => ({
  grid: initialGrid,
  isSpinning: false,
  lastWins: [] as LineWin[],
  lastPayout: 0,
  lastPerf: 0,
  status,
  failReason: null as FailReason | null,
  money: STARTING_MONEY,
  stage: 1,
  ...termsFor(1, { spinCostFactor: 1, dueFactor: 1 }),
  perf: 0,
  turnsLeft: TURNS_PER_STAGE,
  lastPaid: 0,
  charms: [] as string[],
  shopOffer: [] as string[],
})

// Shop spending must leave enough to pay the coming stage's spin fee — otherwise
// you could buy your way into a stage you can't even start.
export function canSpend(s: Pick<GameState, 'money' | 'spinCost'>, price: number): boolean {
  return s.money - price >= s.spinCost
}

// The deadline: both the debt and the performance requirement must be met.
// Returns the state change for either outcome — game over, or "settled": leftover
// coins carry over, and the next stage's order is drawn up (the shop can still
// change it — e.g. a tax break — see buyCharm).
function settleDeadline(s: GameState, money: number, perf: number): Partial<GameState> {
  if (money < s.due || perf < s.perfNeeded) {
    return {
      money,
      perf,
      turnsLeft: 0,
      status: 'gameOver',
      failReason: money < s.due ? 'tokens' : 'perf',
    }
  }
  const mods = resolveModifiers(s.charms)
  const stage = s.stage + 1
  return {
    money: money - s.due + mods.clearBonus,
    perf: 0,
    turnsLeft: 0,
    lastPaid: s.due,
    stage,
    ...termsFor(stage, mods),
    status: 'shop',
    shopOffer: drawShopOffer(s.charms, SHOP_SLOTS),
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  ...freshRun('title'),
  startRun: () => {
    if (get().status === 'title') set({ status: 'briefing' })
  },
  acceptOrder: () => {
    const s = get()
    if (s.status !== 'briefing') return
    // No working capital for even one pull: the stage can't be played, so it
    // goes straight to the deadline (normally that's the end of the run).
    if (s.money < s.spinCost) set(settleDeadline(s, s.money, s.perf))
    else set({ status: 'playing' })
  },
  spin: () => {
    const { isSpinning, status, turnsLeft, charms, money, spinCost } = get()
    if (isSpinning || status !== 'playing' || turnsLeft <= 0 || money < spinCost) return
    playSpinStart()
    const mods = resolveModifiers(charms)
    const grid = drawGrid(Math.random, mods.weightBoosts)
    const lastWins = findLineWins(grid, [...BASE_PATTERN_IDS, ...mods.extraPatterns])
    // The result is decided now, but stays hidden (see ReelGrid's roll
    // animation) until the reels visually stop and call finishSpin().
    // The turn and the fee are spent up front; the payout is only banked in
    // finishSpin().
    set({
      grid,
      isSpinning: true,
      lastWins,
      lastPayout: computePayout(lastWins, mods),
      lastPerf: computePerformance(lastWins, mods),
      money: money - spinCost,
      turnsLeft: turnsLeft - 1,
    })
  },
  finishSpin: () => {
    const s = get()
    const money = s.money + s.lastPayout
    const perf = s.perf + s.lastPerf

    // Can't afford another pull: the remaining turns are forfeited and the
    // deadline comes now.
    const brokeEarly = s.turnsLeft > 0 && money < s.spinCost

    // Deadline not reached yet — keep spinning. (Having enough already doesn't
    // end the stage early; the order is settled on the last turn.)
    if (s.turnsLeft > 0 && !brokeEarly) {
      if (s.turnsLeft <= WARNING_TURNS) playWarning()
      set({ isSpinning: false, money, perf })
      return
    }

    set({ isSpinning: false, ...settleDeadline(s, money, perf) })
  },
  buyCharm: (id) => {
    const { status, shopOffer, charms, money, stage } = get()
    const charm = findCharm(id)
    if (status !== 'shop' || !charm || !shopOffer.includes(id) || charms.includes(id)) return
    if (!canSpend(get(), charm.price)) return
    const nextCharms = [...charms, id]
    set({
      money: money - charm.price,
      charms: nextCharms,
      ...termsFor(stage, resolveModifiers(nextCharms)),
    })
  },
  rerollShop: () => {
    const { status, money, charms } = get()
    if (status !== 'shop' || !canSpend(get(), REROLL_COST)) return
    set({ money: money - REROLL_COST, shopOffer: drawShopOffer(charms, SHOP_SLOTS) })
  },
  leaveShop: () => {
    const { status, charms } = get()
    if (status !== 'shop') return
    set({
      status: 'briefing',
      shopOffer: [],
      turnsLeft: TURNS_PER_STAGE + resolveModifiers(charms).extraTurns,
    })
  },
  // Straight back to the first order — the title screen is only for the first
  // load.
  restart: () => set(freshRun('briefing')),
}))
