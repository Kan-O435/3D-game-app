import { describe, expect, it } from 'vitest'
import { coinsFor, leverAngle, popScale, powerFor, punch, scrollPhase, shake, thud, winHop } from './motion'

describe('powerFor / coinsFor', () => {
  it('scales with the win tier and is zero for no win', () => {
    expect(powerFor(0)).toBe(0)
    expect(powerFor(20)).toBeLessThan(powerFor(100))
    expect(powerFor(100)).toBeLessThan(powerFor(500))
  })

  it('gives a few coins for a small win and caps the shower', () => {
    expect(coinsFor(0)).toBe(0)
    expect(coinsFor(3)).toBe(4)
    expect(coinsFor(60)).toBe(10)
    expect(coinsFor(100000)).toBe(34)
  })
})

describe('thud', () => {
  it('is 0 with no landings, biggest right at a landing, and gone after half a second', () => {
    expect(thud(5, [])).toBe(0)
    expect(thud(5, [5])).toBeCloseTo(1)
    expect(thud(5.6, [5])).toBe(0)
  })

  it('stacks several landings but is capped', () => {
    expect(thud(5, [4.95, 4.98, 5])).toBeGreaterThan(thud(5, [5]))
    expect(thud(5, Array(20).fill(5))).toBeLessThanOrEqual(1.4)
  })

  it('ignores landings from the future', () => {
    expect(thud(5, [6])).toBe(0)
  })
})

describe('winHop / shake / punch', () => {
  it('are zero before the event, after their window, or with no power', () => {
    for (const fn of [winHop, shake, punch]) {
      expect(fn(1, 2, 1)).toBe(0)
      expect(fn(10, 2, 1)).toBe(0)
      expect(fn(2.1, 2, 0)).toBe(0)
    }
  })

  it('scale with power', () => {
    expect(winHop(2.1, 2, 1.6)).toBeGreaterThan(winHop(2.1, 2, 0.6))
    expect(shake(2.05, 2, 1.6)).toBeGreaterThan(shake(2.05, 2, 0.6))
  })

  it('shake and hop die away; punch rises then falls', () => {
    expect(shake(2.0, 2, 1)).toBeGreaterThan(shake(2.6, 2, 1))
    expect(punch(2.02, 2, 1)).toBeLessThan(punch(2.2, 2, 1))
    expect(punch(2.2, 2, 1)).toBeGreaterThan(punch(3.2, 2, 1))
  })
})

describe('scrollPhase', () => {
  it('starts at 0, accelerates, then advances at the full speed', () => {
    expect(scrollPhase(0, 14)).toBe(0)
    expect(scrollPhase(-1, 14)).toBe(0)
    const early = scrollPhase(0.05, 14)
    expect(early).toBeGreaterThan(0)
    expect(early).toBeLessThan(14 * 0.05) // slower than full speed while ramping
    const a = scrollPhase(1, 14)
    const b = scrollPhase(2, 14)
    expect(b - a).toBeCloseTo(14) // one second at full speed
  })

  it('is continuous where the ramp ends', () => {
    const ramp = 0.18
    expect(scrollPhase(ramp - 1e-6, 14, ramp)).toBeCloseTo(scrollPhase(ramp + 1e-6, 14, ramp), 3)
  })
})

describe('popScale', () => {
  it('is 1 before its turn, overshoots above 1 right after, and settles back to 1', () => {
    expect(popScale(-0.1)).toBe(1)
    expect(popScale(0)).toBeCloseTo(1.45)
    expect(Math.abs(popScale(2) - 1)).toBeLessThan(0.001)
  })
})

describe('leverAngle', () => {
  it('is 0 before the pull, reaches full pull quickly, and springs back to rest', () => {
    expect(leverAngle(-1)).toBe(0)
    expect(leverAngle(0)).toBe(0)
    expect(leverAngle(0.11)).toBeCloseTo(1.05)
    expect(Math.abs(leverAngle(2))).toBeLessThan(0.001)
  })

  it('wobbles past rest on the way back (overshoot to the other side)', () => {
    const samples = Array.from({ length: 60 }, (_, i) => leverAngle(0.11 + i * 0.01))
    expect(Math.min(...samples)).toBeLessThan(0)
  })
})
