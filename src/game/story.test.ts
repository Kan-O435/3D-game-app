import { describe, expect, it } from 'vitest'
import { stageName } from './index'

describe('stageName', () => {
  it('climbs the fan ladder: talk event, two-shot, live, then bigger venues', () => {
    expect([1, 2, 3].map(stageName)).toEqual(['お話会', '2ショット', 'ライブ'])
    expect(stageName(6)).toBe('武道館')
    expect(stageName(9)).toBe('世界ツアー')
  })

  it('keeps going with anniversary shows once the list runs out', () => {
    expect(stageName(10)).toBe('伝説の1周年公演')
    expect(stageName(25)).toBe('伝説の16周年公演')
  })

  it('never returns an empty name, even for nonsense input', () => {
    for (const stage of [-5, 0, 1, 3, 9, 10, 999]) expect(stageName(stage).length).toBeGreaterThan(0)
  })

  it('gives every stage in the story its own name', () => {
    const names = Array.from({ length: 9 }, (_, i) => stageName(i + 1))
    expect(new Set(names).size).toBe(9)
  })
})
