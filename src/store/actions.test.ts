import { beforeEach, describe, expect, it, vi } from 'vitest'
import { initAudio } from '../audio/audioEngine'
import { pressPush } from './actions'
import { useGameStore } from './gameStore'

vi.mock('../audio/audioEngine', () => ({ initAudio: vi.fn(), playSpinStart: vi.fn(), playWarning: vi.fn() }))

const st = useGameStore
const g = () => st.getState()

beforeEach(() => {
  vi.clearAllMocks()
  st.setState(st.getInitialState(), true)
})

describe('pressPush', () => {
  it('starts the run from the title screen, and starts audio (first user gesture)', () => {
    pressPush()
    expect(g().status).toBe('briefing')
    expect(initAudio).toHaveBeenCalledTimes(1)
  })

  it('pulls the lever while playing', () => {
    st.setState({ status: 'playing' })
    const turns = g().turnsLeft
    pressPush()
    expect(g().isSpinning).toBe(true)
    expect(g().turnsLeft).toBe(turns - 1)
    expect(initAudio).toHaveBeenCalledTimes(1)
  })

  it('does nothing on the other screens', () => {
    for (const status of ['briefing', 'shop', 'gameOver'] as const) {
      st.setState({ status })
      pressPush()
      expect(g().status).toBe(status)
      expect(g().isSpinning).toBe(false)
    }
    expect(initAudio).not.toHaveBeenCalled()
  })

  it('cannot pull while already spinning or when the fee is unaffordable', () => {
    st.setState({ status: 'playing', isSpinning: true })
    const turns = g().turnsLeft
    pressPush()
    expect(g().turnsLeft).toBe(turns)
    st.setState({ isSpinning: false, money: 0 })
    pressPush()
    expect(g().isSpinning).toBe(false)
  })
})
