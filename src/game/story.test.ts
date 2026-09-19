import { describe, expect, it } from 'vitest'
import { TOTAL_STAGES, stageName } from './index'

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
