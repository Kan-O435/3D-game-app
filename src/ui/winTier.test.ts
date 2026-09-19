import { describe, expect, it } from 'vitest'
import { BIG_WIN_PAYOUT } from '../game'
import { BIG_WIN, JACKPOT, winTier } from './winTier'

describe('winTier', () => {
  it('is a plain win below the big-win line', () => {
    expect(winTier(1)).toBe('win')
    expect(winTier(BIG_WIN - 1)).toBe('win')
  })

  it('is a big win from BIG_WIN up to JACKPOT', () => {
    expect(winTier(BIG_WIN)).toBe('big')
    expect(winTier(JACKPOT - 1)).toBe('big')
  })

  it('is a jackpot from JACKPOT up', () => {
    expect(winTier(JACKPOT)).toBe('jackpot')
    expect(winTier(9999)).toBe('jackpot')
  })
})

describe('big-win threshold', () => {
  it('matches the radio\'s notion of a big win', () => {
    expect(BIG_WIN).toBe(BIG_WIN_PAYOUT)
  })
})
