import type { CSSProperties } from 'react'
import { useGameStore } from '../store/gameStore'

const paper: CSSProperties = {
  background: '#e8e1cd',
  color: '#2a2622',
  border: '1px solid #8d8571',
  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
  fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif',
}

const row: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: 18, lineHeight: 1.9 }

// The stage order, shown while the camera is on the left wall. Wording is a
// placeholder (docs/NOTES.md) — the structure is what matters: what you owe,
// how much performance is required, how many turns, and the fee per spin.
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
        gap: 24,
        padding: 16,
        boxSizing: 'border-box',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ ...paper, width: 240, padding: 16, fontSize: 13, lineHeight: 1.7 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>作業標準書</div>
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          <li>1スピン＝1ターン。ターンが尽きた時点で納付。</li>
          <li>図柄は左から連続で並ぶと配当になる。</li>
          <li>W は何にでも化ける。★ は3個以上でどこでも配当。</li>
          <li>「6」が3つ揃うとレートリミット。その回の獲得は全没収。</li>
          <li>納付額と性能値、両方足りなければ終わり。</li>
          <li>スピン費が払えなくなると、残りのターンは放棄され納付になる。</li>
          <li>ショップで買うほど手持ちが減る。納付を忘れるな。</li>
        </ul>
      </div>

      <div style={{ ...paper, width: 380, padding: '20px 28px' }}>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 8, textAlign: 'center' }}>業務命令書</div>
        <div style={{ fontSize: 15, margin: '10px 0 14px', borderBottom: '1px solid #8d8571', paddingBottom: 8 }}>
          件名: STAGE {stage} ノルマ達成の件
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
