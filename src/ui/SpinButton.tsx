import { useGameStore } from '../store/gameStore'
import { initAudio } from '../audio/audioEngine'

// The red PUSH button under the machine. On the title screen it starts the
// run; while playing it pulls the lever (and shows what the pull costs). In
// the other states other panels own the buttons.
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
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '12px 32px',
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: 2,
        background: disabled ? '#555' : '#c0392b',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {isSpinning ? 'SPINNING...' : status === 'title' ? 'PUSH' : `PUSH（−${spinCost}）`}
    </button>
  )
}
