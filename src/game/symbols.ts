// normal — pays on pattern runs like any symbol.
// wild — substitutes for any normal symbol in a run (never for scatter).
// scatter — never part of a run; pays by how many appear anywhere on the grid.
export type SymbolKind = 'normal' | 'wild' | 'scatter'

export interface SymbolDef {
  id: number
  kind: SymbolKind
  weight: number
  payout: number
}

// Tiered like a real slot: many common/low-pay symbols, a few rare/high-pay
// ones. Weights and payouts below are placeholder guesses, not tuned — see
// docs/NOTES.md ("Turn count / payment curve") for the balance work still to
// do. CLAUDE.md's tiered example (CloverPit's own payout shape) is the
// calibration reference for the *shape* of this table, not its values.
export const SYMBOLS: readonly SymbolDef[] = [
  // Common — weight 20, payout 2 (x5)
  { id: 0, kind: 'normal', weight: 20, payout: 2 },
  { id: 1, kind: 'normal', weight: 20, payout: 2 },
  { id: 2, kind: 'normal', weight: 20, payout: 2 },
  { id: 3, kind: 'normal', weight: 20, payout: 2 },
  { id: 4, kind: 'normal', weight: 20, payout: 2 },
  // Uncommon — weight 10, payout 4 (x5)
  { id: 5, kind: 'normal', weight: 10, payout: 4 },
  { id: 6, kind: 'normal', weight: 10, payout: 4 },
  { id: 7, kind: 'normal', weight: 10, payout: 4 },
  { id: 8, kind: 'normal', weight: 10, payout: 4 },
  { id: 9, kind: 'normal', weight: 10, payout: 4 },
  // Rare — weight 4, payout 8 (x3)
  { id: 10, kind: 'normal', weight: 4, payout: 8 },
  { id: 11, kind: 'normal', weight: 4, payout: 8 },
  { id: 12, kind: 'normal', weight: 4, payout: 8 },
  // Specials. The wild's payout applies to a run made only of wilds; the
  // scatter's payout is unused (see SCATTER_PAYOUT in paylines.ts).
  { id: 13, kind: 'scatter', weight: 9, payout: 0 },
  { id: 14, kind: 'wild', weight: 2, payout: 20 },
]

export const SYMBOL_COUNT = SYMBOLS.length

export const WILD_ID = SYMBOLS.find((s) => s.kind === 'wild')!.id
export const SCATTER_ID = SYMBOLS.find((s) => s.kind === 'scatter')!.id
