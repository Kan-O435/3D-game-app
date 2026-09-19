import { describe, expect, it } from 'vitest'
import { RADIO_SPEAKER, radioLine, type RadioEvent } from './index'

const EVENTS: RadioEvent[] = ['tutorial', 'stageStart', 'win', 'bigWin', 'rateLimit', 'payable', 'lowTurns', 'shop', 'cleared']

describe('radioLine', () => {
  it('has something to say for every event', () => {
    for (const event of EVENTS) expect(radioLine(event).length).toBeGreaterThan(0)
  })

  it('is deterministic for an injected random and never indexes past the list', () => {
    for (const event of EVENTS) {
      expect(radioLine(event, () => 0)).toBe(radioLine(event, () => 0))
      expect(radioLine(event, () => 0.9999).length).toBeGreaterThan(0)
    }
  })

  it('can vary: the win event has more than one line', () => {
    const seen = new Set([0, 0.4, 0.7, 0.99].map((r) => radioLine('win', () => r)))
    expect(seen.size).toBeGreaterThan(1)
  })

  it('names the speaker', () => {
    expect(RADIO_SPEAKER.length).toBeGreaterThan(0)
  })
})
