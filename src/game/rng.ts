import { SYMBOLS } from './symbols'

// `random` is injectable so this stays deterministic under test.
// `weightBoosts` (symbolId -> factor) lets charms skew the draw; omitted, it's
// the plain weighted table.
export function drawSymbol(
  random: () => number = Math.random,
  weightBoosts: Readonly<Record<number, number>> = {},
): number {
  const weightOf = (s: (typeof SYMBOLS)[number]) => s.weight * (weightBoosts[s.id] ?? 1)
  const total = SYMBOLS.reduce((sum, s) => sum + weightOf(s), 0)
  let roll = random() * total
  for (const symbol of SYMBOLS) {
    const w = weightOf(symbol)
    if (roll < w) return symbol.id
    roll -= w
  }
  // Floating-point safety net — `roll` should always land inside the loop
  // above, but if rounding pushes it past the last bucket, fall back to it.
  return SYMBOLS[SYMBOLS.length - 1].id
}
