import { describe, expect, it } from 'vitest'
import { easeValue } from './countUp'

describe('easeValue', () => {
  it('starts at `from` and lands exactly on `to`', () => {
    expect(easeValue(10, 50, 0)).toBe(10)
    expect(easeValue(10, 50, 1)).toBe(50)
    expect(easeValue(10, 50, 2)).toBe(50)
  })

  it('clamps negative progress', () => {
    expect(easeValue(10, 50, -1)).toBe(10)
  })

  it('moves monotonically toward the target, both up and down', () => {
    const up = [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => easeValue(0, 100, t))
    expect([...up].sort((a, b) => a - b)).toEqual(up)
    const down = [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => easeValue(100, 0, t))
    expect([...down].sort((a, b) => b - a)).toEqual(down)
  })

  it('eases out: covers more than half the distance by the halfway point', () => {
    expect(easeValue(0, 100, 0.5)).toBeGreaterThan(50)
  })

  it('returns integers and handles from === to', () => {
    expect(Number.isInteger(easeValue(0, 7, 0.37))).toBe(true)
    expect(easeValue(5, 5, 0.5)).toBe(5)
  })
})
