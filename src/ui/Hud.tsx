import type { CSSProperties } from 'react'
import { useGameStore } from '../store/gameStore'
import { WARNING_TURNS } from '../game'

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

// Money / quota / turns readout, plus the transient "+N" and "STAGE CLEAR"
// callouts. Purely reads the store — DOM overlay sibling of the <Canvas>.
export function Hud() {
  const money = useGameStore((s) => s.money)
  const quota = useGameStore((s) => s.quota)
  const stage = useGameStore((s) => s.stage)
  const turnsLeft = useGameStore((s) => s.turnsLeft)
  const isSpinning = useGameStore((s) => s.isSpinning)
  const lastPayout = useGameStore((s) => s.lastPayout)
  const stageClearCount = useGameStore((s) => s.stageClearCount)

  const progress = Math.min(1, money / quota)
  const lowTurns = turnsLeft <= WARNING_TURNS

  return (
    <>
      <div style={panelStyle}>
        <div style={rowStyle}>
          <span style={labelStyle}>STAGE</span>
          <span>{stage}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>MONEY</span>
          <span style={{ color: '#f1c40f' }}>{money}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>QUOTA</span>
          <span>{quota}</span>
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
          <span style={labelStyle}>TURNS</span>
          <span style={{ color: lowTurns ? '#e74c3c' : undefined, fontWeight: lowTurns ? 700 : undefined }}>
            {turnsLeft}
          </span>
        </div>
      </div>

      {/* Payout only shows once the reels have visibly stopped, matching when
          `money` itself updates. The key restarts the pop animation per result. */}
      {!isSpinning && lastPayout > 0 && (
        <div key={`${stage}-${turnsLeft}-${money}`} className="hud-pop" style={calloutStyle('#f1c40f', 48, '30%')}>
          +{lastPayout}
        </div>
      )}

      {stageClearCount > 0 && (
        <div key={stageClearCount} className="hud-banner" style={calloutStyle('#2ecc71', 40, '18%')}>
          STAGE {stage - 1} CLEAR
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
