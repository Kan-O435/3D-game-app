import { describe, expect, it } from 'vitest'
import { DRIFT_CHANCE, DRIFT_FACTORS, SYMBOLS, rollDrift } from './index'

/** A `random` that returns the given values in order (then repeats the last). */
const seq = (...values: number[]) => {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)]
}

const normals = SYMBOLS.filter((s) => s.kind === 'normal')

describe('rollDrift', () => {
  it('does nothing when the chance roll fails', () => {
    const { factors, drift } = rollDrift({}, seq(0.5))
    expect(drift).toBeNull()
    expect(factors).toEqual({})
  })

  it('picks the first symbol and factor for low rolls', () => {
    const { factors, drift } = rollDrift({}, seq(0.05, 0, 0))
    expect(drift).toEqual({ symbolId: normals[0].id, factor: DRIFT_FACTORS[0] })
    expect(factors[normals[0].id]).toBe(0.5)
  })

  it('picks the last symbol and factor for the top of both rolls without overflowing', () => {
    const { drift } = rollDrift({}, seq(0.05, 0.9999, 0.9999))
    expect(drift).toEqual({
      symbolId: normals[normals.length - 1].id,
      factor: DRIFT_FACTORS[DRIFT_FACTORS.length - 1],
    })
  })

  it("never repeats the symbol's current factor", () => {
    const { drift } = rollDrift({ [normals[0].id]: 0.5 }, seq(0.05, 0, 0))
    expect(drift!.factor).toBe(DRIFT_FACTORS[1])
  })

  it('does not mutate its input and keeps other symbols', () => {
    const before = { [normals[3].id]: 2 }
    const { factors } = rollDrift(before, seq(0.05, 0, 0))
    expect(before).toEqual({ [normals[3].id]: 2 })
    expect(factors[normals[3].id]).toBe(2)
  })

  it('drifts about DRIFT_CHANCE of the time and only ever normal symbols', () => {
    let hits = 0
    const kinds = new Set<string>()
    const runs = 20000
    for (let i = 0; i < runs; i++) {
      const { drift } = rollDrift({})
      if (drift) {
        hits++
        kinds.add(SYMBOLS.find((s) => s.id === drift.symbolId)!.kind)
      }
    }
    expect(Math.abs(hits / runs - DRIFT_CHANCE)).toBeLessThan(0.015)
    expect([...kinds]).toEqual(['normal'])
  })
})
