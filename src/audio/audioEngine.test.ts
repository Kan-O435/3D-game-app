import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// A minimal Web Audio stand-in: enough for the engine to build and start nodes.
class FakeNode {
  gain = { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }
  frequency = { value: 0 }
  type = ''
  connect() {
    return this
  }
  start() {
    started++
  }
  stop() {}
  disconnect() {}
}
let started = 0

class FakeAudioContext {
  state = 'running'
  currentTime = 0
  destination = {}
  createGain() {
    return new FakeNode()
  }
  createOscillator() {
    return new FakeNode()
  }
  resume() {}
}

// The engine keeps module-level state, so load a fresh copy for every test.
const loadEngine = async () => {
  vi.resetModules()
  return import('./audioEngine')
}

beforeEach(() => {
  started = 0
  vi.useFakeTimers()
  vi.stubGlobal('AudioContext', FakeAudioContext)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('heartbeat', () => {
  it('does nothing until the audio context exists', async () => {
    const audio = await loadEngine()
    audio.setHeartbeat(90)
    expect(vi.getTimerCount()).toBe(0)
    expect(started).toBe(0)
  })

  it('can still start later even if it was asked too early with the same bpm', async () => {
    const audio = await loadEngine()
    audio.setHeartbeat(90)
    audio.initAudio()
    const before = started
    audio.setHeartbeat(90)
    expect(started).toBeGreaterThan(before)
    expect(vi.getTimerCount()).toBe(1)
  })

  it('thumps immediately and then every 60000/bpm ms', async () => {
    const audio = await loadEngine()
    audio.initAudio()
    const before = started
    audio.setHeartbeat(120)
    const afterFirst = started
    expect(afterFirst).toBeGreaterThan(before)
    vi.advanceTimersByTime(500)
    expect(started).toBeGreaterThan(afterFirst)
  })

  it('an unchanged bpm is a no-op, a changed one replaces the timer, 0 stops it', async () => {
    const audio = await loadEngine()
    audio.initAudio()
    audio.setHeartbeat(90)
    audio.setHeartbeat(90)
    expect(vi.getTimerCount()).toBe(1)
    audio.setHeartbeat(120)
    expect(vi.getTimerCount()).toBe(1)
    audio.setHeartbeat(0)
    expect(vi.getTimerCount()).toBe(0)
    audio.setHeartbeat(0) // stopping twice is harmless
    expect(vi.getTimerCount()).toBe(0)
  })
})
