import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CHARMS, REROLL_COST, SHOP_SLOTS, STARTING_MONEY, SYMBOLS, TURNS_PER_STAGE, termsFor } from '../game'
import { canSpend, useGameStore } from './gameStore'

// The store fires sound effects; they need a real AudioContext, which node lacks.
vi.mock('../audio/audioEngine', () => ({ playSpinStart: vi.fn(), playWarning: vi.fn() }))

const st = useGameStore
const g = () => st.getState()
const priceOf = (id: string) => CHARMS.find((c) => c.id === id)!.price

beforeEach(() => {
  vi.restoreAllMocks()
  st.setState(st.getInitialState(), true) // back to the title screen
})

/** Skip ahead: jump to the deadline turn of a stage with the given position. */
const atDeadline = (patch: object = {}) => {
  st.setState({
    status: 'playing',
    isSpinning: true,
    lastPayout: 0,
    lastPerf: 0,
    turnsLeft: 0,
    stage: 1,
    due: 28,
    perfNeeded: 3,
    spinCost: 2,
    charms: [],
    shopOffer: [],
    valueFactors: {},
    lastDrift: null,
    failReason: null,
    ...patch,
  })
  g().finishSpin()
}

/** Start a run and land in the playing state of stage 1. */
const startPlaying = () => {
  g().startRun()
  g().acceptOrder()
}

describe('screens', () => {
  it('starts on the title screen with the stage-1 order', () => {
    expect(g()).toMatchObject({
      status: 'title',
      money: STARTING_MONEY,
      due: 32,
      perfNeeded: 7,
      spinCost: 2,
      turnsLeft: TURNS_PER_STAGE,
    })
  })

  it('goes title -> briefing -> playing, and refuses to skip ahead', () => {
    g().spin()
    g().acceptOrder()
    expect(g().status).toBe('title')
    g().startRun()
    expect(g().status).toBe('briefing')
    g().spin()
    expect(g().isSpinning).toBe(false)
    g().acceptOrder()
    expect(g().status).toBe('playing')
  })

  it('restart skips the title screen and wipes the run', () => {
    startPlaying()
    st.setState({ charms: ['fate-dice'], money: 5, stage: 4 })
    g().restart()
    expect(g()).toMatchObject({ status: 'briefing', stage: 1, money: STARTING_MONEY, charms: [], failReason: null })
  })
})

describe('spinning', () => {
  it('charges the fee and spends a turn up front, then banks payout and performance', () => {
    startPlaying()
    const before = g().money
    g().spin()
    expect(g()).toMatchObject({ isSpinning: true, money: before - 2, turnsLeft: TURNS_PER_STAGE - 1 })
    const { lastPayout, lastPerf } = g()
    g().spin() // ignored while spinning
    expect(g().money).toBe(before - 2)
    g().finishSpin()
    expect(g()).toMatchObject({ money: before - 2 + lastPayout, perf: lastPerf, isSpinning: false })
  })

  it('refuses to spin without the fee', () => {
    startPlaying()
    st.setState({ money: 1 })
    g().spin()
    expect(g().isSpinning).toBe(false)
    expect(g().money).toBe(1)
  })

  it('does not end a stage early, however rich you are', () => {
    startPlaying()
    st.setState({ money: 500, perf: 99, isSpinning: true, lastPayout: 0, lastPerf: 0, turnsLeft: 6 })
    g().finishSpin()
    expect(g()).toMatchObject({ status: 'playing', money: 500 })
  })

  it('forfeits the remaining turns when it cannot pay the fee, and the deadline comes now', () => {
    startPlaying()
    st.setState({ money: 1, perf: 0, isSpinning: true, lastPayout: 0, lastPerf: 0, turnsLeft: 6 })
    g().finishSpin()
    expect(g()).toMatchObject({ status: 'gameOver', failReason: 'tokens', turnsLeft: 0 })
  })
})

describe('the deadline', () => {
  it('pays the due, resets performance and opens the shop with the next order', () => {
    atDeadline({ money: 50, perf: 5 })
    expect(g()).toMatchObject({ status: 'shop', stage: 2, money: 22, perf: 0, lastPaid: 28, due: 50, perfNeeded: 8 })
    expect(g().shopOffer).toHaveLength(SHOP_SLOTS)
  })

  it('needs both the coins and the performance', () => {
    atDeadline({ money: 27, perf: 9 })
    expect(g()).toMatchObject({ status: 'gameOver', failReason: 'tokens', money: 27 }) // nothing deducted
    atDeadline({ money: 200, perf: 2 })
    expect(g()).toMatchObject({ status: 'gameOver', failReason: 'perf' })
  })

  it('exactly enough passes, and the deadline turn\'s own take counts', () => {
    atDeadline({ money: 28, perf: 3 })
    expect(g()).toMatchObject({ status: 'shop', money: 0 })
    atDeadline({ money: 16, perf: 3, lastPayout: 12 })
    expect(g().status).toBe('shop')
    atDeadline({ money: 28, perf: 1, lastPerf: 2 })
    expect(g().status).toBe('shop')
  })

  it('fate-dice pays its bonus after the debt is taken', () => {
    atDeadline({ money: 28, perf: 3, charms: ['fate-dice'] })
    expect(g().money).toBe(30)
  })
})

describe('the shop', () => {
  const enterShop = (money = 300) => atDeadline({ money, perf: 3 })

  it('offers 8 distinct items; buying deducts the price, once', () => {
    enterShop()
    const offer = [...g().shopOffer]
    expect(new Set(offer)).toHaveLength(SHOP_SLOTS)
    const id = offer[0]
    const before = g().money
    g().buyCharm(id)
    expect(g().charms).toEqual([id])
    expect(g().money).toBe(before - priceOf(id))
    g().buyCharm(id)
    expect(g().charms).toHaveLength(1)
  })

  it('refuses purchases outside the offer or outside the shop', () => {
    enterShop()
    const outside = CHARMS.find((c) => !g().shopOffer.includes(c.id))!.id
    g().buyCharm(outside)
    expect(g().charms).toEqual([])
    st.setState({ status: 'playing', shopOffer: [] })
    g().buyCharm('blood-pact')
    expect(g().charms).toEqual([])
  })

  it('cannot spend below the coming spin fee', () => {
    enterShop()
    st.setState({ shopOffer: ['rusty-key', 'pity-coin'], charms: [] })
    const fee = g().spinCost
    st.setState({ money: priceOf('rusty-key') + fee - 1 })
    g().buyCharm('rusty-key')
    expect(g().charms).toEqual([])
    st.setState({ money: priceOf('rusty-key') + fee })
    g().buyCharm('rusty-key')
    expect(g()).toMatchObject({ charms: ['rusty-key'], money: fee })
    expect(canSpend({ money: 5, spinCost: 2 }, 3)).toBe(true)
    expect(canSpend({ money: 5, spinCost: 2 }, 4)).toBe(false)
  })

  it('reroll costs coins, redraws, skips owned items, and has to leave the fee too', () => {
    enterShop()
    const first = g().shopOffer.join()
    st.setState({ money: 0 })
    g().rerollShop()
    expect(g().shopOffer.join()).toBe(first)
    const owned = g().shopOffer[0]
    st.setState({ money: 500, charms: [owned] })
    g().rerollShop()
    expect(g().money).toBe(500 - REROLL_COST)
    expect(g().shopOffer).toHaveLength(SHOP_SLOTS)
    expect(g().shopOffer).not.toContain(owned)
    st.setState({ money: REROLL_COST + g().spinCost - 1 })
    const before = g().shopOffer.join()
    g().rerollShop()
    expect(g().shopOffer.join()).toBe(before)
  })

  it('tax-break lowers the coming due immediately', () => {
    enterShop(500)
    st.setState({ shopOffer: ['tax-break'], charms: [] })
    const before = g().due
    g().buyCharm('tax-break')
    expect(g().due).toBe(termsFor(g().stage, { spinCostFactor: 1, dueFactor: 0.85 }).due)
    expect(g().due).toBeLessThan(before)
  })

  it('cannot spin in the shop; leaving goes to the briefing with turns reset', () => {
    enterShop(500)
    g().spin()
    expect(g().isSpinning).toBe(false)
    st.setState({ charms: ['candle-stub'] })
    g().leaveShop()
    expect(g()).toMatchObject({ status: 'briefing', turnsLeft: TURNS_PER_STAGE + 1, shopOffer: [] })
    g().acceptOrder()
    expect(g().status).toBe('playing')
  })

  it('a stage you cannot even afford to start goes straight to its deadline', () => {
    enterShop(28)
    st.setState({ money: 1 })
    g().leaveShop()
    g().acceptOrder()
    expect(g()).toMatchObject({ status: 'gameOver', failReason: 'tokens' })
  })
})

// Force every symbol the RNG draws to be `id` (its weight bucket's midpoint).
const forceSymbol = (id: number) => {
  const total = SYMBOLS.reduce((sum, s) => sum + s.weight, 0)
  const before = SYMBOLS.filter((s) => s.id < id).reduce((sum, s) => sum + s.weight, 0)
  const mid = SYMBOLS.find((s) => s.id === id)!.weight / 2
  return () => (before + mid) / total
}
const CURSE = SYMBOLS.find((s) => s.kind === 'curse')!.id

describe('rate limit in the store', () => {
  it('wipes the spin: only the marker remains, nothing is earned, the fee is still paid', () => {
    startPlaying()
    vi.spyOn(Math, 'random').mockImplementation(forceSymbol(CURSE))
    const before = g().money
    g().spin()
    expect(g().grid.every((id) => id === CURSE)).toBe(true)
    expect(g().lastWins).toHaveLength(1)
    expect(g().lastWins[0]).toMatchObject({ patternId: 'rate-limit', payout: 0, perf: 0 })
    expect(g().lastWins[0].cells).toHaveLength(15)
    expect(g().lastPayout).toBe(0)
    g().finishSpin()
    expect(g()).toMatchObject({ money: before - g().spinCost, perf: 0 })
  })

  it('firewall ignores it', () => {
    startPlaying()
    st.setState({ charms: ['firewall'] })
    vi.spyOn(Math, 'random').mockImplementation(forceSymbol(CURSE))
    g().spin()
    expect(g().lastWins.every((w) => w.patternId !== 'rate-limit')).toBe(true)
  })
})

describe('drifting values in the store', () => {
  const seq = (...values: number[]) => {
    let i = 0
    return () => values[Math.min(i++, values.length - 1)]
  }

  it('a fresh stage has none', () => {
    startPlaying()
    expect(g().valueFactors).toEqual({})
    expect(g().lastDrift).toBeNull()
  })

  it('can drift a symbol between spins, and announces it until the next spin', () => {
    startPlaying()
    vi.spyOn(Math, 'random').mockImplementation(seq(0.9))
    g().spin()
    vi.spyOn(Math, 'random').mockImplementation(seq(0.01, 0, 0))
    g().finishSpin()
    const drift = g().lastDrift!
    expect(drift).not.toBeNull()
    expect(g().valueFactors[drift.symbolId]).toBe(drift.factor)
    vi.spyOn(Math, 'random').mockImplementation(seq(0.9))
    g().spin()
    expect(g().lastDrift).toBeNull()
  })

  it('never drifts on the deadline turn, and resets on leaving the shop and on restart', () => {
    vi.spyOn(Math, 'random').mockImplementation(seq(0.01, 0, 0))
    atDeadline({ money: 500, perf: 99 })
    expect(g()).toMatchObject({ status: 'shop', lastDrift: null, valueFactors: {} })
    st.setState({ valueFactors: { 1: 2 }, lastDrift: { symbolId: 1, factor: 2 } })
    g().leaveShop()
    expect(g()).toMatchObject({ valueFactors: {}, lastDrift: null })
    st.setState({ valueFactors: { 1: 2 } })
    g().restart()
    expect(g().valueFactors).toEqual({})
  })
})

describe('whole runs', () => {
  it('always terminate, spin whenever it is allowed, and use every turn of every cleared stage', () => {
    let deepest = 0
    for (let run = 0; run < 150; run++) {
      g().restart()
      g().acceptOrder()
      let guard = 0
      let turnsThisStage = 0
      while (g().status !== 'gameOver' && guard++ < 100000) {
        if (g().status === 'shop') {
          for (const id of g().shopOffer) g().buyCharm(id)
          g().leaveShop()
          g().acceptOrder()
          turnsThisStage = 0
          continue
        }
        if (g().status !== 'playing') break
        g().spin()
        expect(g().isSpinning).toBe(true)
        turnsThisStage++
        g().finishSpin()
        if (g().status === 'shop') expect(turnsThisStage).toBeGreaterThanOrEqual(1)
      }
      expect(g().status).toBe('gameOver')
      deepest = Math.max(deepest, g().stage)
    }
    expect(deepest).toBeGreaterThanOrEqual(2)
  })
})
