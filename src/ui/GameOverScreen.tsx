import { DEATH_CAUSE_TEXT, TOTAL_STAGES, deathCause, findCharm, stageName } from '../game'
import { useGameStore } from '../store/gameStore'
import { Receipt } from './Receipt'

// The death certificate: the camera has gone back to the order sheet on the left
// wall, the screen goes red, a stamp comes down, and a receipt lists how the run
// went. The crack is the mark of the paper being hit — pure decoration.
export function GameOverScreen() {
  const isGameOver = useGameStore((s) => s.status === 'gameOver')
  const stage = useGameStore((s) => s.stage)
  const money = useGameStore((s) => s.money)
  const due = useGameStore((s) => s.due)
  const perf = useGameStore((s) => s.perf)
  const perfNeeded = useGameStore((s) => s.perfNeeded)
  const totalEarned = useGameStore((s) => s.totalEarned)
  const spinsMade = useGameStore((s) => s.spinsMade)
  const charms = useGameStore((s) => s.charms)
  const restart = useGameStore((s) => s.restart)

  if (!isGameOver) return null

  const cause = deathCause({ money, due, perf, perfNeeded })

  return (
    <div className="gameover-screen">
      <div className="gameover-banner">却下</div>
      <div style={{ position: 'relative' }}>
        <Receipt
          title="死亡診断書"
          subtitle={`死因　${DEATH_CAUSE_TEXT[cause]}（${money}/${due} コイン・${perf}/${perfNeeded}P）`}
          stamp="死"
          rows={[
            { label: '生存ステージ', value: `${stage - 1} / ${TOTAL_STAGES}` },
            { label: '死亡ステージ', value: `STAGE ${stage}「${stageName(stage)}」` },
            { label: '総獲得コイン', value: `${totalEarned}` },
            { label: '最終所持金', value: `${money}` },
            { label: '到達性能値', value: `${perf} P` },
            { label: '回転数', value: `${spinsMade}` },
          ]}
        >
          <div className="receipt-rule" />
          <div className="receipt-row">
            <span>装備品</span>
            <b>{charms.length} 点</b>
          </div>
          <div className="receipt-list">
            {charms.length === 0 ? 'なし' : charms.map((id) => findCharm(id)?.name).join(' / ')}
          </div>
        </Receipt>
        <svg className="crack" viewBox="0 0 90 90" aria-hidden>
          <g fill="none" stroke="#f4efe2" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M45 45 L30 12 L34 4 M45 45 L70 20 L84 22 M45 45 L82 52 L86 68 M45 45 L60 80 L54 88 M45 45 L18 62 L6 60 M45 45 L14 34 L4 24" />
            <path d="M30 12 L22 14 M70 20 L74 10 M82 52 L74 58 M60 80 L68 82 M18 62 L20 72 M14 34 L22 40" />
          </g>
          <circle cx="45" cy="45" r="3.2" fill="#120d0a" />
        </svg>
      </div>
      <button className="arcade-btn" onClick={restart} style={{ marginTop: 6 }}>
        もう一度出勤する　RETRY
      </button>
    </div>
  )
}
