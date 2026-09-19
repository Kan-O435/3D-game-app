import { useGameStore } from '../store/gameStore'
import { initAudio } from '../audio/audioEngine'

// The big red PUSH button under the machine. On the title screen it starts the
// run (and pulses to invite a press); while playing it pulls the lever and shows
// what the pull costs. In the other states other panels own the buttons.
export function SpinButton() {
  const status = useGameStore((s) => s.status)
  const isSpinning = useGameStore((s) => s.isSpinning)
  const money = useGameStore((s) => s.money)
  const spinCost = useGameStore((s) => s.spinCost)
  const spin = useGameStore((s) => s.spin)
  const startRun = useGameStore((s) => s.startRun)

  if (status !== 'title' && status !== 'playing') return null

  const broke = status === 'playing' && money < spinCost
  const disabled = isSpinning || broke

  return (
    <button
      className={`arcade-btn${status === 'title' ? ' pulse-glow' : ''}`}
      onClick={() => {
        // Browser autoplay policy requires audio to start from a user
        // gesture — this is the first guaranteed one, so start/resume it
        // here rather than trying to play BGM on mount.
        initAudio()
        if (status === 'title') startRun()
        else spin()
      }}
      disabled={disabled}
      style={{
        position: 'absolute',
        bottom: 28,
        left: '50%',
        transform: 'translateX(-50%)',
        minWidth: 190,
        fontSize: 24,
      }}
    >
      {isSpinning ? 'SPINNING' : broke ? 'NO COINS' : 'PUSH'}
      {status === 'playing' && !isSpinning && !broke && <small>−{spinCost} COINS</small>}
    </button>
  )
}
