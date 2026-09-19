import { canSpend, useGameStore } from '../store/gameStore'
import { findCharm, REROLL_COST } from '../game'

// The exchange counter between stages. Reads/writes the store only; the store
// decides what's buyable, this just renders it. Number keys 1-8 buy (see
// Hotkeys.tsx).
export function Shop() {
  const isShop = useGameStore((s) => s.status === 'shop')
  const stage = useGameStore((s) => s.stage)
  const money = useGameStore((s) => s.money)
  const due = useGameStore((s) => s.due)
  const perfNeeded = useGameStore((s) => s.perfNeeded)
  const spinCost = useGameStore((s) => s.spinCost)
  const lastPaid = useGameStore((s) => s.lastPaid)
  const offer = useGameStore((s) => s.shopOffer)
  const owned = useGameStore((s) => s.charms)
  const buyCharm = useGameStore((s) => s.buyCharm)
  const rerollShop = useGameStore((s) => s.rerollShop)
  const leaveShop = useGameStore((s) => s.leaveShop)

  if (!isShop) return null

  const bigButton = {
    padding: '12px 28px',
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 2,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
  } as const

  return (
    <div
      className="fade-in"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        padding: 16,
        boxSizing: 'border-box',
        background: 'rgba(0, 0, 0, 0.55)',
        color: '#eee',
        fontFamily: 'monospace',
      }}
    >
      <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 4, color: '#2ecc71' }}>
        納付完了 −{lastPaid}
      </div>
      <div style={{ fontSize: 18 }}>
        COINS <span style={{ color: '#f1c40f' }}>{money}</span>
        <span style={{ color: '#999' }}>
          {' '}
          / STAGE {stage}: 納付 {due} · {perfNeeded}P · スピン費 {spinCost}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 10,
          width: 'min(100%, 980px)',
        }}
      >
        {offer.map((id, i) => {
          const charm = findCharm(id)
          if (!charm) return null
          const bought = owned.includes(id)
          const canAfford = canSpend({ money, spinCost }, charm.price)
          return (
            <button
              key={id}
              onClick={() => buyCharm(id)}
              disabled={bought || !canAfford}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                textAlign: 'left',
                background: bought ? '#1f3a29' : '#e8e1cd',
                color: bought ? '#8fd6a5' : '#2a2622',
                border: `2px solid ${bought ? '#2ecc71' : '#8d8571'}`,
                borderRadius: 6,
                opacity: !bought && !canAfford ? 0.5 : 1,
                cursor: bought || !canAfford ? 'default' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 800, width: 22 }}>{i + 1}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 16, fontWeight: 700 }}>{charm.name}</span>
                <span style={{ display: 'block', fontSize: 12 }}>{charm.description}</span>
              </span>
              <span style={{ fontSize: 18, fontWeight: 800, color: bought ? '#2ecc71' : '#a3231b' }}>
                {bought ? 'SOLD' : charm.price}
              </span>
            </button>
          )
        })}
        {offer.length === 0 && <div style={{ color: '#999' }}>品切れ — 品替えで入れ替えよう</div>}
      </div>

      <div style={{ fontSize: 12, color: '#888' }}>※ スピン費（{spinCost}）を下回る買い物はできない</div>
      <div style={{ display: 'flex', gap: 14, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={rerollShop}
          disabled={!canSpend({ money, spinCost }, REROLL_COST)}
          style={{
            ...bigButton,
            background: !canSpend({ money, spinCost }, REROLL_COST) ? '#444' : '#5d6d7e',
            cursor: !canSpend({ money, spinCost }, REROLL_COST) ? 'default' : 'pointer',
          }}
        >
          品替え（−{REROLL_COST}）
        </button>
        <button onClick={leaveShop} style={{ ...bigButton, background: '#c0392b', cursor: 'pointer' }}>
          次のステージへ
        </button>
      </div>
    </div>
  )
}
