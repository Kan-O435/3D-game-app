import { create } from 'zustand'
import {
  spin as drawGrid,
  findLineWins,
  findRateLimit,
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
  TOTAL_STAGES,
  BIG_WIN_PAYOUT,
  radioLine,
  type RadioEvent,
  SHOP_SLOTS,
  REROLL_COST,
  rollDrift,
  type Drift,
  type Grid,
  type LineWin,
  type ValueFactors,
} from '../game'
import { playSpinStart, playWarning } from '../audio/audioEngine'

// One pass through the game:
//   title -> briefing -> playing -> (deadline) -> shop -> briefing -> playing ...
// and after the last stage's deadline: 'cleared' (the ending). A failed deadline
// is 'gameOver'.
// 'briefing' is the stage's order sheet, 'shop' the exchange counter between
// stages; each has its own camera station (see scene/FixedCamera.tsx).
export type GameStatus = 'title' | 'briefing' | 'playing' | 'shop' | 'gameOver' | 'cleared'

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
  // Drifting symbol values for this stage (symbolId -> factor; see game/drift.ts)
  // and the change that just happened, for the HUD to announce.
  valueFactors: ValueFactors
  lastDrift: Drift | null
  // Owned charm ids (each can be owned once) and the current shop's stock.
  charms: string[]
  shopOffer: string[]
  // Run statistics, for the end-of-run receipts.
  totalEarned: number
  spinsMade: number
  // The boss's latest radio line (the caption at the bottom); `id` changes each
  // time so the UI can replay its fade even when the text repeats.
  radio: { id: number; text: string } | null
  // Whether "both quotas met" was already announced this stage.
  payableAnnounced: boolean
  // Counters the reel animation watches: each request_* bump is one press —
  // stop the next reel now, or skip the whole animation.
  reelStops: number
  reelSkips: number
  startRun: () => void
  acceptOrder: () => void
  spin: () => void
  // Called by the reel animation once every column has visually stopped.
  // This is where the payout lands in `money` and, on the deadline turn, the
  // order is settled (or the run ends).
  finishSpin: () => void
  requestReelStop: () => void
  requestReelSkip: () => void
  // Pay the debt now instead of waiting for the last turn — only once both the
  // coins and the performance requirement are already met.
  payEarly: () => void
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
  valueFactors: {} as ValueFactors,
  lastDrift: null as Drift | null,
  charms: [] as string[],
  shopOffer: [] as string[],
  totalEarned: 0,
  spinsMade: 0,
  radio: null as { id: number; text: string } | null,
  payableAnnounced: false,
  reelStops: 0,
  reelSkips: 0,
})

// Shop spending must leave enough to pay the coming stage's spin fee — otherwise
// you could buy your way into a stage you can't even start.
export function canSpend(s: Pick<GameState, 'money' | 'spinCost'>, price: number): boolean {
  return s.money - price >= s.spinCost
}

// Both requirements met while turns remain: the stage can be paid off early.
export function canPayEarly(
  s: Pick<GameState, 'status' | 'isSpinning' | 'money' | 'due' | 'perf' | 'perfNeeded' | 'turnsLeft'>,
): boolean {
  return s.status === 'playing' && !s.isSpinning && s.turnsLeft > 0 && s.money >= s.due && s.perf >= s.perfNeeded
}

// A radio line as a state patch (the id bumps so the caption re-plays).
function speak(s: Pick<GameState, 'radio'>, event: RadioEvent): Pick<GameState, 'radio'> {
  return { radio: { id: (s.radio?.id ?? 0) + 1, text: radioLine(event) } }
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
  // Paid off the last stage: the run is won.
  if (s.stage >= TOTAL_STAGES) {
    return {
      money: money - s.due + mods.clearBonus,
      perf: 0,
      turnsLeft: 0,
      lastPaid: s.due,
      status: 'cleared',
      payableAnnounced: false,
      ...speak(s, 'cleared'),
    }
  }
  const stage = s.stage + 1
  return {
    money: money - s.due + mods.clearBonus,
    perf: 0,
    turnsLeft: 0,
    lastPaid: s.due,
    payableAnnounced: false,
    ...speak(s, 'shop'),
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
    else set({ status: 'playing', ...speak(s, s.stage === 1 && s.spinsMade === 0 ? 'tutorial' : 'stageStart') })
  },
  spin: () => {
    const { isSpinning, status, turnsLeft, charms, money, spinCost, valueFactors } = get()
    if (isSpinning || status !== 'playing' || turnsLeft <= 0 || money < spinCost) return
    playSpinStart()
    const mods = resolveModifiers(charms)
    const grid = drawGrid(Math.random, mods.weightBoosts)
    // Three or more curse symbols wipe the spin: the result is just the
    // rate-limit marker (payout 0), so nothing else gets paid or highlighted.
    const rateLimit = mods.rateLimitImmune ? null : findRateLimit(grid)
    const lastWins = rateLimit
      ? [rateLimit]
      : findLineWins(grid, [...BASE_PATTERN_IDS, ...mods.extraPatterns], valueFactors)
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
      lastDrift: null,
      spinsMade: get().spinsMade + 1,
    })
  },
  finishSpin: () => {
    const s = get()
    const money = s.money + s.lastPayout
    const perf = s.perf + s.lastPerf
    const totalEarned = s.totalEarned + s.lastPayout

    // Can't afford another pull: the remaining turns are forfeited and the
    // deadline comes now.
    const brokeEarly = s.turnsLeft > 0 && money < s.spinCost

    // Deadline not reached yet — keep spinning. (Having enough already doesn't
    // end the stage early; the order is settled on the last turn.)
    if (s.turnsLeft > 0 && !brokeEarly) {
      if (s.turnsLeft <= WARNING_TURNS) playWarning()
      // Symbol values may shift between spins (never on the deadline turn — the
      // stage is over and they reset anyway).
      const { factors, drift } = rollDrift(s.valueFactors)

      // What (if anything) the boss says about this spin — one line, most
      // important first.
      const payable = money >= s.due && perf >= s.perfNeeded
      const rateLimited = s.lastWins.some((w) => w.patternId === 'rate-limit')
      let event: RadioEvent | null = null
      if (payable && !s.payableAnnounced) event = 'payable'
      else if (rateLimited) event = 'rateLimit'
      else if (s.lastPayout >= BIG_WIN_PAYOUT) event = 'bigWin'
      else if (s.turnsLeft === WARNING_TURNS) event = 'lowTurns'
      else if (s.lastPayout > 0 && Math.random() < 0.35) event = 'win'

      set({
        isSpinning: false,
        money,
        perf,
        totalEarned,
        valueFactors: factors,
        lastDrift: drift,
        payableAnnounced: s.payableAnnounced || event === 'payable',
        ...(event ? speak(s, event) : {}),
      })
      return
    }

    set({ isSpinning: false, totalEarned, ...settleDeadline(s, money, perf) })
  },
  requestReelStop: () => {
    if (get().isSpinning) set({ reelStops: get().reelStops + 1 })
  },
  requestReelSkip: () => {
    if (get().isSpinning) set({ reelSkips: get().reelSkips + 1 })
  },
  payEarly: () => {
    const s = get()
    if (!canPayEarly(s)) return
    set({ isSpinning: false, ...settleDeadline(s, s.money, s.perf) })
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
      valueFactors: {},
      lastDrift: null,
      turnsLeft: TURNS_PER_STAGE + resolveModifiers(charms).extraTurns,
    })
  },
  // Straight back to the first order — the title screen is only for the first
  // load.
  restart: () => set(freshRun('briefing')),
}))
