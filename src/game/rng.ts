import { SYMBOLS } from './symbols'

const TOTAL_WEIGHT = SYMBOLS.reduce((sum, s) => sum + s.weight, 0)

// `random` is injectable so this stays deterministic under test.
export function drawSymbol(random: () => number = Math.random): number {
  let roll = random() * TOTAL_WEIGHT
  for (const symbol of SYMBOLS) {
    if (roll < symbol.weight) return symbol.id
    roll -= symbol.weight
  }
  // Floating-point safety net — `roll` should always land inside the loop
  // above, but if rounding pushes it past the last bucket, fall back to it.
  return SYMBOLS[SYMBOLS.length - 1].id
}
