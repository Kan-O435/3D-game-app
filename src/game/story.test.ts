import { describe, expect, it } from 'vitest'
import { DEATH_CAUSE_TEXT, TOTAL_STAGES, deathCause, stageName } from './index'

describe('stageName', () => {
  it('climbs the fan ladder: talk event, two-shot, live, headline show, Budokan', () => {
    expect([1, 2, 3, 4, 5].map(stageName)).toEqual(['お話会', '2ショット', 'ライブ', 'ワンマンライブ', '武道館'])
  })

  it('has a name for every stage of the run', () => {
    for (let stage = 1; stage <= TOTAL_STAGES; stage++) expect(stageName(stage).length).toBeGreaterThan(0)
  })

  it('keeps going with anniversary shows past the end, just in case', () => {
    expect(stageName(6)).toBe('伝説の1周年公演')
    expect(stageName(25)).toBe('伝説の20周年公演')
  })

  it('never returns an empty name, even for nonsense input', () => {
    for (const stage of [-5, 0, 1, 3, 5, 6, 999]) expect(stageName(stage).length).toBeGreaterThan(0)
  })

  it('gives every stage in the story its own name', () => {
    const names = Array.from({ length: TOTAL_STAGES }, (_, i) => stageName(i + 1))
    expect(new Set(names).size).toBe(TOTAL_STAGES)
  })
})

describe('deathCause', () => {
  const base = { money: 10, due: 30, perf: 2, perfNeeded: 7 }

  it('is "both" when short on coins and on performance', () => {
    expect(deathCause(base)).toBe('both')
  })

  it('is "tokens" when only the coins fall short, "perf" when only performance does', () => {
    expect(deathCause({ ...base, perf: 9 })).toBe('tokens')
    expect(deathCause({ ...base, money: 50 })).toBe('perf')
  })

  it('treats exactly-enough as met', () => {
    expect(deathCause({ ...base, money: 30 })).toBe('perf')
    expect(deathCause({ money: 30, due: 30, perf: 6, perfNeeded: 7 })).toBe('perf')
  })

  it('has text for every cause', () => {
    for (const cause of ['both', 'tokens', 'perf'] as const) expect(DEATH_CAUSE_TEXT[cause].length).toBeGreaterThan(0)
  })
})
