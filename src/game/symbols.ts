// normal — pays on pattern runs like any symbol.
// wild — substitutes for any normal symbol in a run (never for scatter).
// scatter — never part of a run; pays by how many appear anywhere on the grid.
// curse — the "6": never part of a run; 3+ anywhere on the grid is a rate limit
//   that wipes out the whole spin's take (see findRateLimit in paylines.ts).
export type SymbolKind = 'normal' | 'wild' | 'scatter' | 'curse'

export interface SymbolDef {
  id: number
  kind: SymbolKind
  weight: number
  payout: number
  // Performance points (P) earned per matched symbol beyond the first — the
  // second thing a stage's order demands besides money. See paylines.ts.
  perf: number
}

// Payout values are 5x the original 2/4/8/20 so the per-spin fee (a few coins)
// stays small next to a typical win — see docs/NOTES.md.
// Tiered like a real slot: many common/low-pay symbols, a few rare/high-pay
// ones. Weights and payouts below are placeholder guesses, not tuned — see
// docs/NOTES.md ("Turn count / payment curve") for the balance work still to
// do. CLAUDE.md's tiered example (CloverPit's own payout shape) is the
// calibration reference for the *shape* of this table, not its values.
export const SYMBOLS: readonly SymbolDef[] = [
  // Common — weight 20
  { id: 0, kind: 'normal', weight: 20, payout: 10, perf: 2 },
  { id: 1, kind: 'normal', weight: 20, payout: 10, perf: 2 },
  { id: 2, kind: 'normal', weight: 20, payout: 10, perf: 2 },
  { id: 3, kind: 'normal', weight: 20, payout: 10, perf: 2 },
  { id: 4, kind: 'normal', weight: 20, payout: 10, perf: 2 },
  // Uncommon — weight 10
  { id: 5, kind: 'normal', weight: 10, payout: 20, perf: 2 },
  { id: 6, kind: 'normal', weight: 10, payout: 20, perf: 2 },
  { id: 7, kind: 'normal', weight: 10, payout: 20, perf: 2 },
  { id: 8, kind: 'normal', weight: 10, payout: 20, perf: 2 },
  { id: 9, kind: 'normal', weight: 10, payout: 20, perf: 2 },
  // Rare — weight 4
  { id: 10, kind: 'normal', weight: 4, payout: 40, perf: 1 },
  { id: 11, kind: 'normal', weight: 4, payout: 40, perf: 1 },

  // Specials. The curse has no payout of its own. The wild's payout applies to a run made only of wilds; the
  // scatter's payout is unused (see SCATTER_PAYOUT in paylines.ts).
  { id: 12, kind: 'curse', weight: 8, payout: 0, perf: 0 },
  { id: 13, kind: 'scatter', weight: 9, payout: 0, perf: 0 },
  { id: 14, kind: 'wild', weight: 2, payout: 100, perf: 2 },
]

export const SYMBOL_COUNT = SYMBOLS.length

export const WILD_ID = SYMBOLS.find((s) => s.kind === 'wild')!.id
export const SCATTER_ID = SYMBOLS.find((s) => s.kind === 'scatter')!.id
export const CURSE_ID = SYMBOLS.find((s) => s.kind === 'curse')!.id
