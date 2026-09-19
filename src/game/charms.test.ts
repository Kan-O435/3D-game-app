import { describe, expect, it } from 'vitest'
import {
  CHARMS,
  CURSE_ID,
  SCATTER_ID,
  WILD_ID,
  computePayout,
  computePerformance,
  drawShopOffer,
  findCharm,
  resolveModifiers,
  type LineWin,
} from './index'

const win = (matchLength: number, payout: number, perf = 0): LineWin => ({
  patternId: 'row-0',
  symbolId: 0,
  matchLength,
  cells: [],
  payout,
  perf,
})
const scatter = (count: number, payout: number): LineWin => ({
  patternId: 'scatter',
  symbolId: SCATTER_ID,
  matchLength: count,
  cells: [],
  payout,
  perf: 0,
})
const rateLimit: LineWin = { patternId: 'rate-limit', symbolId: CURSE_ID, matchLength: 3, cells: [], payout: 0, perf: 0 }
const mods = (...ids: string[]) => resolveModifiers(ids)

describe('charm catalogue', () => {
  it('has unique ids and sane prices', () => {
    const ids = CHARMS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(CHARMS.every((c) => c.price > 0 && c.name && c.description)).toBe(true)
  })

  it('starts from neutral modifiers', () => {
    expect(mods()).toEqual({
      payoutMultiplier: 1,
      extraTurns: 0,
      weightBoosts: {},
      winBonus: 0,
      consolation: 0,
      longMatchMultiplier: 1,
      clearBonus: 0,
      extraPatterns: [],
      perfMultiplier: 1,
      spinCostFactor: 1,
      dueFactor: 1,
      rateLimitImmune: false,
    })
  })

  it('finds a charm by id', () => {
    expect(findCharm('blood-pact')?.name).toBeTruthy()
    expect(findCharm('nope')).toBeUndefined()
  })
})

describe('computePayout', () => {
  it('is 0 with no wins and no charms, and the consolation with pity-coin', () => {
    expect(computePayout([], mods())).toBe(0)
    expect(computePayout([], mods('pity-coin'))).toBe(5)
  })

  it('applies the payout multiplier to the total', () => {
    expect(computePayout([win(2, 4)], mods('blood-pact'))).toBe(5)
  })

  it('adds silver-tooth per winning line', () => {
    expect(computePayout([win(2, 4), win(3, 12)], mods('silver-tooth'))).toBe(26)
  })

  it('boosts only 4+ runs with skull-ring, never a scatter count', () => {
    expect(computePayout([win(4, 40)], mods('skull-ring'))).toBe(100)
    expect(computePayout([win(3, 40)], mods('skull-ring'))).toBe(40)
    expect(computePayout([scatter(4, 100)], mods('skull-ring'))).toBe(100)
  })

  it('counts a scatter win as a line for silver-tooth', () => {
    expect(computePayout([scatter(3, 30)], mods('silver-tooth'))).toBe(35)
  })

  it('rounds fractional line payouts at the total', () => {
    expect(Number.isInteger(computePayout([win(3, 14.4)], mods()))).toBe(true)
  })

  it('a rate limit forfeits everything, bonuses and consolation included', () => {
    const all = mods('silver-tooth', 'pity-coin', 'blood-pact')
    expect(computePayout([win(5, 500), rateLimit], all)).toBe(0)
    expect(computePayout([rateLimit], all)).toBe(0)
  })
})

describe('computePerformance', () => {
  it('sums line perf and applies overclock', () => {
    const wins = [win(3, 0, 4), win(2, 0, 2)]
    expect(computePerformance(wins, mods())).toBe(6)
    expect(computePerformance(wins, mods('overclock'))).toBe(9)
    expect(computePerformance([], mods())).toBe(0)
    expect(computePerformance([rateLimit], mods('overclock'))).toBe(0)
  })
})

describe('charm effects', () => {
  it('turns, clear bonus, spin cost and due factors', () => {
    expect(mods('candle-stub').extraTurns).toBe(1)
    expect(mods('fate-dice').clearBonus).toBe(30)
    expect(mods('cheap-lever').spinCostFactor).toBe(0.75)
    expect(mods('tax-break').dueFactor).toBe(0.85)
    expect(mods('firewall').rateLimitImmune).toBe(true)
  })

  it('pattern charms unlock their patterns and stack', () => {
    expect(mods('v-scar').extraPatterns).toEqual(['v', 'inv-v'])
    expect(mods('crooked-blade').extraPatterns).toEqual(['diag-down', 'diag-up'])
    expect(mods('v-scar', 'crooked-blade').extraPatterns).toHaveLength(4)
  })

  it('weight charms boost their own symbols only — never the specials', () => {
    expect(mods('wild-tongue').weightBoosts[WILD_ID]).toBe(2)
    expect(mods('star-lure').weightBoosts[SCATTER_ID]).toBe(1.4)
    const cat = mods('black-cat-eye').weightBoosts
    expect(cat[WILD_ID]).toBeUndefined()
    expect(cat[SCATTER_ID]).toBeUndefined()
    expect(cat[CURSE_ID]).toBeUndefined()
    const key = mods('rusty-key').weightBoosts
    expect([WILD_ID, SCATTER_ID, CURSE_ID].every((id) => key[id] === undefined)).toBe(true)
  })
})

describe('drawShopOffer', () => {
  it('offers distinct, unowned charms', () => {
    const offer = drawShopOffer(['blood-pact', 'fate-dice'], 8)
    expect(offer).toHaveLength(8)
    expect(new Set(offer).size).toBe(8)
    expect(offer).not.toContain('blood-pact')
    expect(offer).not.toContain('fate-dice')
  })

  it('shrinks when few remain', () => {
    const all = CHARMS.map((c) => c.id)
    expect(drawShopOffer(all.slice(1), 8)).toHaveLength(1)
    expect(drawShopOffer(all, 8)).toEqual([])
  })

  it('is deterministic for an injected random', () => {
    const seq = () => {
      let i = 0
      return () => [0.1, 0.7, 0.3, 0.9, 0.5][i++ % 5]
    }
    expect(drawShopOffer([], 5, seq())).toEqual(drawShopOffer([], 5, seq()))
  })
})
