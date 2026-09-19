import { describe, expect, it } from 'vitest'
import { REROLL_COST, SHOP_SLOTS, STARTING_MONEY, TURNS_PER_STAGE, termsFor } from './index'

const plain = { spinCostFactor: 1, dueFactor: 1 }

describe('stage terms', () => {
  it('due grows 34, 57, 94, 145', () => {
    expect([1, 2, 3, 4].map((s) => termsFor(s, plain).due)).toEqual([34, 57, 94, 145])
  })

  it('performance needed grows by one each stage', () => {
    expect([1, 2, 3, 4, 5, 7].map((s) => termsFor(s, plain).perfNeeded)).toEqual([8, 9, 10, 11, 12, 14])
  })

  it('spin cost steps up every third stage', () => {
    expect([1, 3, 4, 7, 10].map((s) => termsFor(s, plain).spinCost)).toEqual([2, 2, 3, 4, 5])
  })

  it('charm factors apply, and the spin fee never drops below 1', () => {
    expect(termsFor(2, { spinCostFactor: 1, dueFactor: 0.85 }).due).toBe(48)
    expect(termsFor(1, { spinCostFactor: 0.1, dueFactor: 1 }).spinCost).toBe(1)
  })

  it('exposes the run constants', () => {
    expect(TURNS_PER_STAGE).toBe(12)
    expect(STARTING_MONEY).toBe(30)
    expect(SHOP_SLOTS).toBe(8)
    expect(REROLL_COST).toBe(6)
  })
})
