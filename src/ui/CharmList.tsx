import { useGameStore } from '../store/gameStore'
import { findCharm } from '../game'

// The charms you own, as little gold tags in the corner. (Coins, performance and
// turns live on the machine's own display now — see scene/MachineScreens.tsx.)
export function CharmList() {
  const isPlaying = useGameStore((s) => s.status === 'playing')
  const charms = useGameStore((s) => s.charms)

  if (!isPlaying || charms.length === 0) return null

  return (
    <div
      className="slot-panel"
      style={{ position: 'absolute', top: 16, left: 16, maxWidth: 240, padding: 8, display: 'flex', flexWrap: 'wrap', gap: 4, pointerEvents: 'none' }}
    >
      {charms.map((id) => (
        <span
          key={id}
          title={findCharm(id)?.description}
          style={{
            padding: '1px 8px',
            fontSize: 12,
            color: '#2a1c00',
            background: 'linear-gradient(180deg, #ffe08a, #d9a521)',
            borderRadius: 999,
            boxShadow: '0 1px 0 #6b4b06',
          }}
        >
          {findCharm(id)?.name}
        </span>
      ))}
    </div>
  )
}
