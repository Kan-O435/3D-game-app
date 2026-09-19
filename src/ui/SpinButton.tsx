import { useGameStore } from '../store/gameStore'
import { initAudio } from '../audio/audioEngine'

// The PUSH button. Only shown while playing — GameOverScreen owns RETRY and
// Shop owns NEXT STAGE.
export function SpinButton() {
  const spin = useGameStore((s) => s.spin)
  const isSpinning = useGameStore((s) => s.isSpinning)
  const isPlaying = useGameStore((s) => s.status === 'playing')

  if (!isPlaying) return null

  return (
    <button
      onClick={() => {
        // Browser autoplay policy requires audio to start from a user
        // gesture — this is the first guaranteed one, so start/resume it
        // here rather than trying to play BGM on mount.
        initAudio()
        spin()
      }}
      disabled={isSpinning}
      style={{
        position: 'absolute',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '12px 32px',
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: 2,
        background: isSpinning ? '#555' : '#c0392b',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        cursor: isSpinning ? 'default' : 'pointer',
      }}
    >
      {isSpinning ? 'SPINNING...' : 'PUSH'}
    </button>
  )
}
