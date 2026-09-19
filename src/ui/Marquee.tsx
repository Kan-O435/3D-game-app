import type { CSSProperties } from 'react'
import { useGameStore } from '../store/gameStore'

const BULBS = 8
const bulbStyle = (i: number) => ({ '--i': i }) as CSSProperties

function Bulbs({ reverse }: { reverse?: boolean }) {
  const order = Array.from({ length: BULBS }, (_, i) => (reverse ? BULBS - 1 - i : i))
  return (
    <div className="bulbs">
      {order.map((i) => (
        <i key={i} className="bulb" style={bulbStyle(i)} />
      ))}
    </div>
  )
}

// The lit sign above the machine: a stage plate with bulbs chasing along both
// sides. The bulbs speed up while the reels spin, flash on a win and go red on
// a rate limit — all driven by CSS off `data-state`.
export function Marquee() {
  const isPlaying = useGameStore((s) => s.status === 'playing')
  const stage = useGameStore((s) => s.stage)
  const turnsLeft = useGameStore((s) => s.turnsLeft)
  const isSpinning = useGameStore((s) => s.isSpinning)
  const lastPayout = useGameStore((s) => s.lastPayout)
  const rateLimited = useGameStore((s) => s.lastWins.some((w) => w.patternId === 'rate-limit'))

  if (!isPlaying) return null

  const state = isSpinning ? 'spin' : rateLimited ? 'limit' : lastPayout > 0 ? 'win' : 'idle'

  // Re-keyed per result so the finite win/limit flash replays every time.
  return (
    <div className="marquee" data-state={state} key={`${state}-${stage}-${turnsLeft}`}>
      <Bulbs />
      <div className="marquee-plate">STAGE {stage}</div>
      <Bulbs reverse />
    </div>
  )
}
