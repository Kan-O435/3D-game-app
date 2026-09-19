import { SYMBOLS } from './symbols'

// "Symbol values change now and then" (from the reference's rules poster): after
// a spin there's a small chance one ordinary symbol's payout is rescaled. The
// state is just symbolId -> factor (missing = 1). It resets every stage, so a
// stage sees a couple of changes at most on average, not a slow random walk.
export type ValueFactors = Readonly<Record<number, number>>

export const DRIFT_CHANCE = 0.12
export const DRIFT_FACTORS = [0.5, 0.75, 1.5, 2] as const

export interface Drift {
  symbolId: number
  factor: number
}

// `random` is injectable like the other pure entry points. Only normal symbols
// drift — the wild, scatter and curse have their own rules. The new factor is
// always different from the symbol's current one.
export function rollDrift(
  current: ValueFactors,
  random: () => number = Math.random,
): { factors: ValueFactors; drift: Drift | null } {
  if (random() >= DRIFT_CHANCE) return { factors: current, drift: null }

  const candidates = SYMBOLS.filter((s) => s.kind === 'normal')
  const symbol = candidates[Math.floor(random() * candidates.length)]
  const options = DRIFT_FACTORS.filter((f) => f !== (current[symbol.id] ?? 1))
  const factor = options[Math.floor(random() * options.length)]

  return { factors: { ...current, [symbol.id]: factor }, drift: { symbolId: symbol.id, factor } }
}
