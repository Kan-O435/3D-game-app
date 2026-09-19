import type { CSSProperties } from 'react'
import { useGameStore } from '../store/gameStore'
import { WARNING_TURNS, findCharm } from '../game'

const panelStyle: CSSProperties = {
  position: 'absolute',
  top: 16,
  left: 16,
  minWidth: 180,
  padding: '12px 16px',
  background: 'rgba(0, 0, 0, 0.6)',
  border: '1px solid #555',
  borderRadius: 8,
  color: '#eee',
  fontFamily: 'monospace',
  pointerEvents: 'none',
}

const rowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 24,
  fontSize: 16,
  lineHeight: 1.6,
}

const labelStyle: CSSProperties = { color: '#999', letterSpacing: 1 }

// Money / due / turns readout, plus the transient "+N" and "STAGE CLEAR"
// callouts. Purely reads the store — DOM overlay sibling of the <Canvas>.
export function Hud() {
  const money = useGameStore((s) => s.money)
  const due = useGameStore((s) => s.due)
  const perf = useGameStore((s) => s.perf)
  const perfNeeded = useGameStore((s) => s.perfNeeded)
  const spinCost = useGameStore((s) => s.spinCost)
  const lastPerf = useGameStore((s) => s.lastPerf)
  const rateLimited = useGameStore((s) => s.lastWins.some((w) => w.patternId === 'rate-limit'))
  const isPlaying = useGameStore((s) => s.status === 'playing')
  const stage = useGameStore((s) => s.stage)
  const turnsLeft = useGameStore((s) => s.turnsLeft)
  const isSpinning = useGameStore((s) => s.isSpinning)
  const lastPayout = useGameStore((s) => s.lastPayout)
  const charms = useGameStore((s) => s.charms)

  const progress = Math.min(1, money / due)
  const perfProgress = Math.min(1, perf / perfNeeded)
  const lowTurns = turnsLeft <= WARNING_TURNS

  // The order/shop screens carry their own numbers; this panel is for playing.
  if (!isPlaying) return null

  return (
    <>
      <div style={panelStyle}>
        <div style={rowStyle}>
          <span style={labelStyle}>STAGE</span>
          <span>{stage}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>COINS</span>
          <span style={{ color: '#f1c40f' }}>{money}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>DUE</span>
          <span>{due}</span>
        </div>
        <div style={{ height: 6, margin: '4px 0 6px', background: '#333', borderRadius: 3 }}>
          <div
            style={{
              width: `${progress * 100}%`,
              height: '100%',
              background: '#2ecc71',
              borderRadius: 3,
              transition: 'width 300ms',
            }}
          />
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>PERF</span>
          <span style={{ color: perf >= perfNeeded ? '#7fd18b' : undefined }}>
            {perf} / {perfNeeded} P
          </span>
        </div>
        <div style={{ height: 6, margin: '4px 0 6px', background: '#333', borderRadius: 3 }}>
          <div
            style={{
              width: `${perfProgress * 100}%`,
              height: '100%',
              background: '#3498db',
              borderRadius: 3,
              transition: 'width 300ms',
            }}
          />
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>SPIN FEE</span>
          <span>{spinCost}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>DEADLINE</span>
          <span style={{ color: lowTurns ? '#e74c3c' : undefined, fontWeight: lowTurns ? 700 : undefined }}>
            {turnsLeft} turns
          </span>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: '#777', lineHeight: 1.5 }}>
          W = ワイルド（何にでも化ける）
          <br />★ = 3個以上でボーナス（どこでも可）
        </div>
        {charms.length > 0 && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #444', fontSize: 12, color: '#bbb' }}>
            {charms.map((id) => (
              <div key={id} title={findCharm(id)?.description}>
                ◆ {findCharm(id)?.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout only shows once the reels have visibly stopped, matching when
          `money` itself updates. The key restarts the pop animation per result. */}
      {!isSpinning && rateLimited && (
        <div key={`limit-${stage}-${turnsLeft}`} className="hud-pop" style={calloutStyle('#ff5a4a', 40, '30%')}>
          RATE LIMIT
          <span style={{ display: 'block', fontSize: 16, letterSpacing: 2 }}>今回の獲得は全没収</span>
        </div>
      )}

      {!isSpinning && !rateLimited && (lastPayout > 0 || lastPerf > 0) && (
        <div key={`${stage}-${turnsLeft}-${money}`} className="hud-pop" style={calloutStyle('#f1c40f', 48, '30%')}>
          +{lastPayout}
          {lastPerf > 0 && <span style={{ fontSize: 24, color: '#5dade2' }}>　+{lastPerf}P</span>}
        </div>
      )}
    </>
  )
}

function calloutStyle(color: string, fontSize: number, top: string): CSSProperties {
  return {
    position: 'absolute',
    top,
    left: 0,
    right: 0,
    textAlign: 'center',
    color,
    fontSize,
    fontWeight: 800,
    fontFamily: 'monospace',
    letterSpacing: 4,
    textShadow: '0 0 12px rgba(0, 0, 0, 0.9)',
    pointerEvents: 'none',
  }
}
