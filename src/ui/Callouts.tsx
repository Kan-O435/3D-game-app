import type { CSSProperties } from 'react'
import { useGameStore } from '../store/gameStore'
import { symbolColor } from '../scene/icons'
import { winTier } from './winTier'

// Result banners: WIN / BIG WIN / JACKPOT by size, the red 炎上 (the rate limit), and the
// "相場変動" note when a symbol's value drifts. All are keyed per result so the
// CSS animation replays each spin, and only appear once the reels have stopped
// (same moment the money display starts rolling).
export function Callouts() {
  const isPlaying = useGameStore((s) => s.status === 'playing')
  const isSpinning = useGameStore((s) => s.isSpinning)
  const stage = useGameStore((s) => s.stage)
  const turnsLeft = useGameStore((s) => s.turnsLeft)
  const lastPayout = useGameStore((s) => s.lastPayout)
  const lastPerf = useGameStore((s) => s.lastPerf)
  const lastDrift = useGameStore((s) => s.lastDrift)
  const rateLimited = useGameStore((s) => s.lastWins.some((w) => w.patternId === 'rate-limit'))

  // The deadline turn moves straight on to the shop, so only show while playing.
  if (!isPlaying || isSpinning) return null

  const key = `${stage}-${turnsLeft}`
  const tier = winTier(lastPayout)
  const title = tier === 'jackpot' ? 'JACKPOT!!' : tier === 'big' ? 'BIG WIN' : 'WIN'

  return (
    <>
      {lastDrift && (
        <div
          key={`drift-${key}`}
          className="win-banner drift"
          style={{ '--drift': lastDrift.factor > 1 ? '#7fd18b' : '#e07a6b' } as CSSProperties}
        >
          <span className="win-title">
            相場変動
            <span
              style={{ display: 'inline-block', width: 14, height: 14, margin: '0 8px', background: symbolColor(lastDrift.symbolId) }}
            />
            {lastDrift.factor > 1 ? '▲' : '▼'} ×{lastDrift.factor}
          </span>
        </div>
      )}

      {rateLimited && (
        <div key={`limit-${key}`} className="win-banner limit">
          <span className="win-title">炎上!!</span>
          <span className="win-amount">今回の獲得は全没収</span>
        </div>
      )}

      {!rateLimited && (lastPayout > 0 || lastPerf > 0) && (
        <>
          {tier === 'jackpot' && <div key={`flash-${key}`} className="win-flash" />}
          <div key={`win-${key}`} className={`win-banner ${tier === 'win' ? '' : tier}`}>
            {lastPayout > 0 && <span className="win-title">{title}</span>}
            {lastPayout > 0 && <span className="win-amount">+{lastPayout}</span>}
            {lastPerf > 0 && <span className="win-perf">+{lastPerf} P</span>}
          </div>
        </>
      )}
    </>
  )
}
