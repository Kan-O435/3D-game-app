import { TOTAL_STAGES, findCharm, stageName } from '../game'
import { useGameStore } from '../store/gameStore'
import { Receipt } from './Receipt'

// The ending: every stage paid off. Same receipt look as the death certificate,
// but a gold tint and a stamp that says you made it.
export function ClearScreen() {
  const isCleared = useGameStore((s) => s.status === 'cleared')
  const money = useGameStore((s) => s.money)
  const totalEarned = useGameStore((s) => s.totalEarned)
  const spinsMade = useGameStore((s) => s.spinsMade)
  const charms = useGameStore((s) => s.charms)
  const restart = useGameStore((s) => s.restart)

  if (!isCleared) return null

  return (
    <div className="clear-screen">
      <div className="clear-banner">完了</div>
      <Receipt
        title="業務完了通知書"
        subtitle={`全 ${TOTAL_STAGES} ステージ、無事に納付完了しました。`}
        stamp="済"
        rows={[
          { label: '最終ステージ', value: `「${stageName(TOTAL_STAGES)}」` },
          { label: '総獲得コイン', value: `${totalEarned}` },
          { label: '最終所持金', value: `${money}` },
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
      <button className="arcade-btn gold" onClick={restart} style={{ marginTop: 6 }}>
        もう一度　RETRY
      </button>
    </div>
  )
}
