import type { CSSProperties } from 'react'
import { useGameStore } from '../store/gameStore'
import { oshiMessage, stageName } from '../game'

const paper: CSSProperties = {
  background: '#e8e1cd',
  color: '#2a2622',
  border: '1px solid #8d8571',
  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
  fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif',
}

const row: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: 18, lineHeight: 1.9 }

// The stage's plan, shown while the camera is on the left wall: what you owe for
// this event, how much heat (performance) it takes, how many days until it, and
// what each pull costs — plus a note from your idol. Wording follows the
// fan-of-an-idol theme (see game/story.ts); the structure is what matters.
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
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>オタ活心得</div>
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          <li>1スピン＝1日。開演の日までに軍資金を用意せよ。</li>
          <li>図柄は左から連続で並ぶと配当になる。</li>
          <li>W（推し）は何にでも化ける。★（ファンサ）は3個以上でどこでも配当。</li>
          <li>炎上マーク（6）が3つ揃うと、その日の稼ぎは全没収。</li>
          <li>チケット代と熱量、両方足りなければ推しに会えない。</li>
          <li>スピン費が払えなくなると、その時点で開演日になる。</li>
          <li>物販で買うほど手持ちが減る。チケット代を忘れるな。</li>
        </ul>
      </div>

      <div style={{ ...paper, width: 380, padding: '20px 28px' }}>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 8, textAlign: 'center' }}>推し活計画書</div>
        <div style={{ fontSize: 15, margin: '10px 0 14px', borderBottom: '1px solid #8d8571', paddingBottom: 8 }}>
          件名: STAGE {stage}「{stageName(stage)}」参戦の件
        </div>
        <div style={row}>
          <span>一、チケット・遠征費</span>
          <b style={{ color: '#a3231b' }}>{due} コイン</b>
        </div>
        <div style={row}>
          <span>二、必要熱量（推し度）</span>
          <b style={{ color: '#a3231b' }}>{perfNeeded} P</b>
        </div>
        <div style={row}>
          <span>三、開演まで</span>
          <b style={{ color: '#a3231b' }}>{turns} 回</b>
        </div>
        <div style={row}>
          <span>四、1回の元手（スピン費）</span>
          <b style={{ color: '#a3231b' }}>{spinCost} コイン/回</b>
        </div>
        <div style={{ marginTop: 10, color: '#a3231b', fontWeight: 700 }}>上記の通り、推しのために励むこと。</div>
        <div style={{ marginTop: 12, padding: '8px 10px', fontSize: 13, lineHeight: 1.6, background: 'rgba(214, 58, 110, 0.1)', borderLeft: '3px solid #d63a6e' }}>
          <b style={{ color: '#b8285a' }}>♥ 推しからの一言</b>
          <br />
          {oshiMessage(stage)}
        </div>
        <button className="arcade-btn" onClick={acceptOrder} style={{ marginTop: 16, width: '100%', fontSize: 16 }}>
          いってきます！（台へ）
        </button>
      </div>
    </div>
  )
}
