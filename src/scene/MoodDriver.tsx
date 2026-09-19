import { useFrame } from '@react-three/fiber'
import { moodFor, dreadFor } from '../game'
import { useGameStore } from '../store/gameStore'
import { moodState } from './moodState'

export function MoodDriver() {
  useFrame((_, dt) => {
    const s = useGameStore.getState()
    const target =
      s.status === 'playing' ? moodFor(s.turnsLeft, s.stage) : s.status === 'gameOver' ? 1 : dreadFor(s.stage)
    // Ease toward the target so a turn ticking down fades in rather than pops.
    moodState.value += (target - moodState.value) * Math.min(1, dt * 2)
  })
  return null
}
