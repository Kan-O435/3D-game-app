import type { CSSProperties } from 'react'
import { useGameStore } from '../store/gameStore'
import { TURNS_PER_STAGE, WARNING_TURNS, findCharm, resolveModifiers } from '../game'
import { LedNumber } from './LedNumber'

const SEGMENTS = 12

// Lit segments for a 0..1 fill.
function SegBar({ fill, color }: { fill: number; color: string }) {
  const lit = Math.round(Math.min(1, Math.max(0, fill)) * SEGMENTS)
  return (
    <div className="segbar" style={{ '--seg': color } as CSSProperties}>
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <i key={i} className={i < lit ? 'on' : undefined} />
      ))}
    </div>
  )
}

// The cabinet's display panel: coins, performance, and the deadline as one lamp
// per remaining turn. Purely reads the store — a DOM overlay next to the Canvas.
export function Hud() {
  const money = useGameStore((s) => s.money)
  const due = useGameStore((s) => s.due)
  const perf = useGameStore((s) => s.perf)
  const perfNeeded = useGameStore((s) => s.perfNeeded)
  const spinCost = useGameStore((s) => s.spinCost)
  const isPlaying = useGameStore((s) => s.status === 'playing')
  const turnsLeft = useGameStore((s) => s.turnsLeft)
  const charms = useGameStore((s) => s.charms)

  // The order/shop screens carry their own numbers; this panel is for playing.
  if (!isPlaying) return null

  const lowTurns = turnsLeft <= WARNING_TURNS
  const totalLamps = Math.max(TURNS_PER_STAGE + resolveModifiers(charms).extraTurns, turnsLeft)
  const perfOk = perf >= perfNeeded
  const moneyOk = money >= due

  return (
    <div className="slot-panel" style={{ position: 'absolute', top: 16, left: 16, width: 232, padding: 10, pointerEvents: 'none' }}>
      <div className="led-window">
        <div className="led-label">COINS</div>
        <LedNumber value={money} digits={5} size={30} color={moneyOk ? 'var(--led-green)' : 'var(--led-amber)'} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#b8a685', marginTop: 2 }}>
          <span>DUE {due}</span>
          <span>FEE −{spinCost}</span>
        </div>
        <SegBar fill={money / due} color={moneyOk ? 'var(--led-green)' : 'var(--led-amber)'} />
      </div>

      <div className="led-window" style={{ marginTop: 8 }}>
        <div className="led-label">PERFORMANCE</div>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <LedNumber value={perf} digits={2} size={26} color={perfOk ? 'var(--led-green)' : 'var(--led-blue)'} />
          <span style={{ fontSize: 13, color: '#8fb8d4' }}>/ {perfNeeded} P</span>
        </span>
        <SegBar fill={perf / perfNeeded} color={perfOk ? 'var(--led-green)' : 'var(--led-blue)'} />
      </div>

      <div className="led-window" style={{ marginTop: 8 }}>
        <div className="led-label">DEADLINE　{turnsLeft} TURNS</div>
        <div className="lamps">
          {Array.from({ length: totalLamps }, (_, i) => (
            <span key={i} className={`lamp${i < turnsLeft ? ' on' : ''}${i < turnsLeft && lowTurns ? ' low' : ''}`} />
          ))}
        </div>
      </div>

      <div style={{ marginTop: 8, fontSize: 10, color: '#8a7a62', lineHeight: 1.6 }}>
        <b style={{ color: '#f5c542' }}>W</b> ワイルド ・ <b style={{ color: '#c77dff' }}>★</b> 3個で配当 ・{' '}
        <b style={{ color: '#ff5a4a' }}>6</b> 3個で没収
      </div>

      {charms.length > 0 && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #3a2a1c', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {charms.map((id) => (
            <span
              key={id}
              title={findCharm(id)?.description}
              style={{
                padding: '1px 7px',
                fontSize: 11,
                color: '#2a1c00',
                background: 'linear-gradient(180deg, #ffe08a, #d9a521)',
                borderRadius: 999,
                boxShadow: '0 1px 0 #6b4b06',
              }}
            >
              {findCharm(id)?.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
