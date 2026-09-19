import { RADIO_SPEAKER } from '../game'
import { useGameStore } from '../store/gameStore'

// The boss's radio: a caption at the bottom of the screen that fades in, stays a
// few seconds and fades out. It is re-keyed by the line's id so the fade replays
// even when the same text comes round again. Lines come from the store (which
// decides *when* to speak) via game/radio.ts (which decides *what*).
export function Radio() {
  const radio = useGameStore((s) => s.radio)
  const status = useGameStore((s) => s.status)

  // Hidden on the title screen and behind the end-of-run receipts.
  if (!radio || status === 'title' || status === 'gameOver' || status === 'cleared') return null

  return (
    <div key={radio.id} className="radio-line">
      <span style={{ color: '#ff5a4a', marginRight: 8 }}>▼</span>
      <span style={{ color: '#ffb8b0', marginRight: 8 }}>無線:{RADIO_SPEAKER}</span>
      {radio.text}
    </div>
  )
}
