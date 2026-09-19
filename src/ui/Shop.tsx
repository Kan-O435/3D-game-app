import { canSpend, useGameStore } from '../store/gameStore'
import { LedNumber } from './LedNumber'
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
      <div className="neon" style={{ fontSize: 30, fontWeight: 800, letterSpacing: '0.2em', color: 'var(--led-green)', textShadow: '0 0 12px var(--led-green)' }}>
        物販ブース ─ チケット代 −{lastPaid}
      </div>
      <div className="slot-panel led-window" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '6px 16px' }}>
        <span className="led-label">手持ち</span>
        <LedNumber value={money} digits={5} size={30} />
        <span style={{ fontSize: 12, color: '#b8a685' }}>
          次のライブ STAGE {stage}：チケット代 {due} ・ 熱量 {perfNeeded}P ・ スピン費 {spinCost}
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
                background: bought ? '#1f3a29' : 'linear-gradient(180deg, #f3ecd6, #e0d6b8)',
                color: bought ? '#8fd6a5' : '#2a2622',
                border: `2px solid ${bought ? '#2ecc71' : 'var(--gold-dark)'}`,
                borderRadius: 6,
                boxShadow: bought ? '0 0 10px rgba(46,204,113,0.4)' : '0 3px 0 #6b4b06, 0 5px 10px rgba(0,0,0,0.5)',
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
        {offer.length === 0 && <div style={{ color: '#999' }}>売り切れ — 品替えで入れ替えよう</div>}
      </div>

      <div style={{ fontSize: 12, color: '#888' }}>※ スピン費（{spinCost}）を下回る買い物はできない</div>
      <div style={{ display: 'flex', gap: 14, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="arcade-btn gray" onClick={rerollShop} disabled={!canSpend({ money, spinCost }, REROLL_COST)}>
          品替え<small>−{REROLL_COST} コイン</small>
        </button>
        <button className="arcade-btn" onClick={leaveShop}>
          次のライブへ
        </button>
      </div>
    </div>
  )
}
