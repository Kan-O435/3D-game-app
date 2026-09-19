import { useGameStore } from '../store/gameStore'

// The controls hint shown while the reels are spinning.
export function SpinHint() {
  const isSpinning = useGameStore((s) => s.isSpinning)
  if (!isSpinning) return null
  return (
    <div className="spin-hint">連打:リール停止 ／ 長押し:スキップ</div>
  )
}
