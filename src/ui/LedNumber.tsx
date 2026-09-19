import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { easeValue } from './countUp'

const DURATION_MS = 600

// A number on a glowing LED display that rolls to its new value (coins tick up
// after a win, down when the fee is charged) instead of jumping. Unlit "8"s sit
// behind it like a seven-segment display; `digits` sets how many.
export function LedNumber({
  value,
  digits,
  color,
  size = 28,
}: {
  value: number
  digits: number
  color?: string
  size?: number
}) {
  const [shown, setShown] = useState(value)
  const current = useRef(value) // what's on screen right now, so a new target starts from it

  useEffect(() => {
    const from = current.current
    if (from === value) return
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const next = easeValue(from, value, (now - start) / DURATION_MS)
      current.current = next
      setShown(next)
      if (next !== value) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])

  const style = { fontSize: size, minWidth: `${digits}ch`, ...(color ? { '--led': color } : {}) } as CSSProperties
  return (
    <span className="led" style={style}>
      <span className="led-ghost" aria-hidden>
        {'8'.repeat(digits)}
      </span>
      <span style={{ position: 'relative' }}>{shown}</span>
    </span>
  )
}
