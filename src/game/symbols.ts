export interface SymbolDef {
  id: number
  weight: number
  payout: number
}

// Tiered like a real slot: many common/low-pay symbols, a few rare/high-pay
// ones. Weights and payouts below are placeholder guesses, not tuned — see
// docs/NOTES.md ("Turn count / quota curve") for the balance work still to
// do. CLAUDE.md's tiered example (CloverPit's own payout shape) is the
// calibration reference for the *shape* of this table, not its values.
export const SYMBOLS: readonly SymbolDef[] = [
  // Common — weight 20, payout 2 (x5)
  { id: 0, weight: 20, payout: 2 },
  { id: 1, weight: 20, payout: 2 },
  { id: 2, weight: 20, payout: 2 },
  { id: 3, weight: 20, payout: 2 },
  { id: 4, weight: 20, payout: 2 },
  // Uncommon — weight 10, payout 4 (x5)
  { id: 5, weight: 10, payout: 4 },
  { id: 6, weight: 10, payout: 4 },
  { id: 7, weight: 10, payout: 4 },
  { id: 8, weight: 10, payout: 4 },
  { id: 9, weight: 10, payout: 4 },
  // Rare — weight 4, payout 8 (x3)
  { id: 10, weight: 4, payout: 8 },
  { id: 11, weight: 4, payout: 8 },
  { id: 12, weight: 4, payout: 8 },
  // Super rare — weight 1, payout 20 (x2)
  { id: 13, weight: 1, payout: 20 },
  { id: 14, weight: 1, payout: 20 },
]

export const SYMBOL_COUNT = SYMBOLS.length
