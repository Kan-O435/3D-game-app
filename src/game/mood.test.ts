import { describe, expect, it } from 'vitest'
import { TURNS_PER_STAGE, WARNING_TURNS, dreadFor, heartbeatBpm, moodFor, tensionFor } from './index'

describe('mood', () => {
  it('has no tension while turns are plentiful', () => {
    expect(tensionFor(TURNS_PER_STAGE)).toBe(0)
    expect(tensionFor(WARNING_TURNS + 1)).toBe(0)
  })

  it('rises each turn to 1 on the last, and clamps negatives', () => {
    const seq = [WARNING_TURNS, 1, 0].map(tensionFor)
    expect(seq[0]).toBeGreaterThan(0)
    expect(seq[0]).toBeLessThan(seq[1])
    expect(seq[1]).toBeLessThan(seq[2])
    expect(seq[2]).toBe(1)
    expect(tensionFor(-3)).toBe(1)
  })

  it('dread grows with stage and caps at 0.3', () => {
    expect(dreadFor(1)).toBe(0)
    expect(dreadFor(3)).toBeGreaterThan(0)
    expect(dreadFor(99)).toBe(0.3)
  })

  it('mood is tension + dread, clamped to 1, and dread alone stays below low-turn tension', () => {
    expect(moodFor(TURNS_PER_STAGE, 1)).toBe(0)
    expect(moodFor(0, 1)).toBe(1)
    expect(moodFor(0, 99)).toBe(1)
    expect(moodFor(TURNS_PER_STAGE, 99)).toBe(0.3)
    expect(moodFor(TURNS_PER_STAGE, 4)).toBeLessThan(tensionFor(WARNING_TURNS))
  })

  it('heartbeat runs 70..120 bpm and clamps', () => {
    expect([0, 1, 5, -1].map(heartbeatBpm)).toEqual([70, 120, 120, 70])
  })
})
