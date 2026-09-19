import { canPayEarly, useGameStore } from '../store/gameStore'

// Shown once both requirements are met while turns remain: pay the debt now and
// leave, or keep spinning for more (at the risk of dropping below the due
// again). The 3D slip hanging beside the machine does the same thing.
export function PayPrompt() {
  const payable = useGameStore((s) => canPayEarly(s))
  const payEarly = useGameStore((s) => s.payEarly)
  const turnsLeft = useGameStore((s) => s.turnsLeft)

  if (!payable) return null

  return (
    <button
      className="arcade-btn gold pay-prompt"
      onClick={payEarly}
      style={{ position: 'absolute', right: 16, bottom: 72, fontSize: 15 }}
    >
      納付して退場 [Enter]
      <small>残り {turnsLeft} ターンは放棄</small>
    </button>
  )
}
