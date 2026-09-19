import { useGameStore } from '../store/gameStore'

export function GameOverScreen() {
  const isGameOver = useGameStore((s) => s.status === 'gameOver')
  const stage = useGameStore((s) => s.stage)
  const money = useGameStore((s) => s.money)
  const quota = useGameStore((s) => s.quota)
  const restart = useGameStore((s) => s.restart)

  if (!isGameOver) return null

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#eee',
        fontFamily: 'monospace',
      }}
    >
      <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: 6, color: '#c0392b' }}>GAME OVER</div>
      <div style={{ fontSize: 20 }}>Failed stage {stage}</div>
      <div style={{ fontSize: 16, color: '#999' }}>
        MONEY {money} / QUOTA {quota}
      </div>
      <button
        onClick={restart}
        style={{
          marginTop: 16,
          padding: '12px 32px',
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 2,
          background: '#c0392b',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        RETRY
      </button>
    </div>
  )
}
