import { useGameStore } from '../store/gameStore'

export function GameOverScreen() {
  const isGameOver = useGameStore((s) => s.status === 'gameOver')
  const stage = useGameStore((s) => s.stage)
  const money = useGameStore((s) => s.money)
  const due = useGameStore((s) => s.due)
  const perf = useGameStore((s) => s.perf)
  const perfNeeded = useGameStore((s) => s.perfNeeded)
  const failReason = useGameStore((s) => s.failReason)
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
      <div className="neon" style={{ fontSize: 60, fontWeight: 900, letterSpacing: '0.15em', color: 'var(--led-red)', textShadow: '0 0 14px var(--led-red), 0 0 34px var(--cab-red)' }}>
        推し活、終了
      </div>
      <div style={{ fontSize: 20 }}>
        STAGE {stage}: {failReason === 'perf' ? '熱量が足りなくて、推しに会えなかった' : 'チケット代が足りなくて、推しに会えなかった'}
      </div>
      <div style={{ fontSize: 16, color: '#999' }}>
        手持ち {money} / チケット代 {due}　·　熱量 {perf} / {perfNeeded} P
      </div>
      <button className="arcade-btn" onClick={restart} style={{ marginTop: 16 }}>
        もう一度、推す
      </button>
    </div>
  )
}
