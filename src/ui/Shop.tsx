import { useGameStore } from '../store/gameStore'
import { dueForStage, findCharm } from '../game'

// Between-stage shop. Reads/writes the store only; the store decides what's
// buyable, this just renders it.
export function Shop() {
  const isShop = useGameStore((s) => s.status === 'shop')
  const stage = useGameStore((s) => s.stage)
  const money = useGameStore((s) => s.money)
  const due = useGameStore((s) => s.due)
  const offer = useGameStore((s) => s.shopOffer)
  const owned = useGameStore((s) => s.charms)
  const buyCharm = useGameStore((s) => s.buyCharm)
  const leaveShop = useGameStore((s) => s.leaveShop)

  if (!isShop) return null

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 16,
        boxSizing: 'border-box',
        background: 'rgba(0, 0, 0, 0.88)',
        color: '#eee',
        fontFamily: 'monospace',
      }}
    >
      <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: 4, color: '#2ecc71' }}>
        PAID {dueForStage(stage - 1)}
      </div>
      <div style={{ fontSize: 18 }}>
        MONEY <span style={{ color: '#f1c40f' }}>{money}</span>
        <span style={{ color: '#999' }}> / NEXT DUE {due}</span>
      </div>
      <div style={{ fontSize: 13, color: '#999' }}>
        次の期限までに払えるだけ残す — 買うか、貯めるか
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
        {offer.map((id) => {
          const charm = findCharm(id)
          if (!charm) return null
          const bought = owned.includes(id)
          const canAfford = money >= charm.price
          return (
            <div
              key={id}
              style={{
                width: 190,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                background: '#1a1a1a',
                border: `1px solid ${bought ? '#2ecc71' : '#555'}`,
                borderRadius: 8,
                opacity: bought ? 0.6 : 1,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700 }}>{charm.name}</div>
              <div style={{ fontSize: 13, color: '#bbb', minHeight: 36 }}>{charm.description}</div>
              <button
                onClick={() => buyCharm(id)}
                disabled={bought || !canAfford}
                style={{
                  padding: '8px 12px',
                  fontSize: 15,
                  fontWeight: 700,
                  background: bought ? '#27ae60' : canAfford ? '#c0392b' : '#444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: bought || !canAfford ? 'default' : 'pointer',
                }}
              >
                {bought ? 'SOLD' : `BUY ${charm.price}`}
              </button>
            </div>
          )
        })}
        {offer.length === 0 && <div style={{ color: '#999' }}>品切れ — もう買えるものはない</div>}
      </div>

      <button
        onClick={leaveShop}
        style={{
          marginTop: 8,
          padding: '12px 32px',
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 2,
          background: '#c0392b',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        NEXT STAGE
      </button>
    </div>
  )
}
