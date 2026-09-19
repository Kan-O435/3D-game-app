import { useGameStore } from '../store/gameStore'
import { initAudio } from '../audio/audioEngine'

// Minimal stand-in so Phase 5's animation has something to trigger it.
// Phase 8 builds this out into the real HUD (money/quota/turns around it).
export function SpinButton() {
  const spin = useGameStore((s) => s.spin)
  const restart = useGameStore((s) => s.restart)
  const isSpinning = useGameStore((s) => s.isSpinning)
  const isGameOver = useGameStore((s) => s.status === 'gameOver')

  return (
    <button
      onClick={() => {
        // Browser autoplay policy requires audio to start from a user
        // gesture — this is the first guaranteed one, so start/resume it
        // here rather than trying to play BGM on mount.
        initAudio()
        if (isGameOver) restart()
        else spin()
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
      {isSpinning ? 'SPINNING...' : isGameOver ? 'RETRY' : 'PUSH'}
    </button>
  )
}
