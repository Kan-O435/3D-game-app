import { describe, expect, it } from 'vitest'
import { stageName } from './index'

describe('stageName', () => {
  it('starts underground and works up to the dome', () => {
    expect(stageName(1)).toBe('地下ライブ')
    expect(stageName(7)).toBe('武道館')
    expect(stageName(10)).toBe('世界ツアー')
  })

  it('keeps going with anniversary shows once the list runs out', () => {
    expect(stageName(11)).toBe('伝説の1周年公演')
    expect(stageName(25)).toBe('伝説の15周年公演')
  })

  it('never returns an empty name, even for nonsense input', () => {
    for (const stage of [-5, 0, 1, 3, 10, 11, 999]) expect(stageName(stage).length).toBeGreaterThan(0)
  })
})
