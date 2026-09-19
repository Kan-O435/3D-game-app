import type { CSSProperties } from 'react'
import { useGameStore } from '../store/gameStore'
import { stageName } from '../game'

const paper: CSSProperties = {
  background: '#e8e1cd',
  color: '#2a2622',
  border: '1px solid #8d8571',
  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
  fontFamily: 'var(--pixel)',
}

const row: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: 18, lineHeight: 1.9 }

// The stage order, shown while the camera is on the left wall. Deliberately a
// plain office memo: what you owe, how much performance is required, how many
// turns, and the fee per spin. The only tell is the event named in the subject
// line (see game/story.ts) — the joke is that it's all very ordinary paperwork.
export function OrderSheet() {
  const isBriefing = useGameStore((s) => s.status === 'briefing')
  const stage = useGameStore((s) => s.stage)
  const due = useGameStore((s) => s.due)
  const perfNeeded = useGameStore((s) => s.perfNeeded)
  const turns = useGameStore((s) => s.turnsLeft)
  const spinCost = useGameStore((s) => s.spinCost)
  const acceptOrder = useGameStore((s) => s.acceptOrder)

  if (!isBriefing) return null

  return (
    <div
      className="fade-in"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ ...paper, width: 380, padding: '20px 28px' }}>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 8, textAlign: 'center' }}>業務命令書</div>
        <div style={{ fontSize: 15, margin: '10px 0 14px', borderBottom: '1px solid #8d8571', paddingBottom: 8 }}>
          件名: STAGE {stage}「{stageName(stage)}」ノルマ達成の件
        </div>
        <div style={row}>
          <span>一、納付額</span>
          <b style={{ color: '#a3231b' }}>{due} コイン</b>
        </div>
        <div style={row}>
          <span>二、必要性能値</span>
          <b style={{ color: '#a3231b' }}>{perfNeeded} P</b>
        </div>
        <div style={row}>
          <span>三、期限ターン</span>
          <b style={{ color: '#a3231b' }}>{turns} 回</b>
        </div>
        <div style={row}>
          <span>四、スピン費</span>
          <b style={{ color: '#a3231b' }}>{spinCost} コイン/回</b>
        </div>
        <div style={{ marginTop: 10, color: '#a3231b', fontWeight: 700 }}>上記の通り命ずる。</div>
        <button className="arcade-btn" onClick={acceptOrder} style={{ marginTop: 16, width: '100%', fontSize: 16 }}>
          了解（台へ戻る）
        </button>
      </div>
    </div>
  )
}
