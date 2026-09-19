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
// Tiered like a real slot, and deliberately lopsided: five common symbols fill
// most of the reels (so 3-in-a-row happens about every 6 spins, not every 13),
// the uncommon ones and the two rares are occasional. The specials' weights were
// scaled up with the total so the flame / star / wild turn up as often as
// before. See docs/NOTES.md for the numbers behind this.
export const SYMBOLS: readonly SymbolDef[] = [
  // Common — weight 50
  { id: 0, kind: 'normal', weight: 50, payout: 10, perf: 2 },
  { id: 1, kind: 'normal', weight: 50, payout: 10, perf: 2 },
  { id: 2, kind: 'normal', weight: 50, payout: 10, perf: 2 },
  { id: 3, kind: 'normal', weight: 50, payout: 10, perf: 2 },
  { id: 4, kind: 'normal', weight: 50, payout: 10, perf: 2 },
  // Uncommon — weight 6
  { id: 5, kind: 'normal', weight: 6, payout: 100, perf: 2 },
  { id: 6, kind: 'normal', weight: 6, payout: 100, perf: 2 },
  { id: 7, kind: 'normal', weight: 6, payout: 100, perf: 2 },
  { id: 8, kind: 'normal', weight: 6, payout: 100, perf: 2 },
  { id: 9, kind: 'normal', weight: 6, payout: 100, perf: 2 },
  // Rare — weight 1
  { id: 10, kind: 'normal', weight: 1, payout: 500, perf: 1 },
  { id: 11, kind: 'normal', weight: 1, payout: 500, perf: 1 },

  // Specials. The curse has no payout of its own. The wild's payout applies to a run made only of wilds; the
  // scatter's payout is unused (see SCATTER_PAYOUT in paylines.ts).
  { id: 12, kind: 'curse', weight: 14, payout: 0, perf: 0 },
  { id: 13, kind: 'scatter', weight: 16, payout: 0, perf: 0 },
  { id: 14, kind: 'wild', weight: 4, payout: 100, perf: 2 },
]

export const SYMBOL_COUNT = SYMBOLS.length

export const WILD_ID = SYMBOLS.find((s) => s.kind === 'wild')!.id
export const SCATTER_ID = SYMBOLS.find((s) => s.kind === 'scatter')!.id
export const CURSE_ID = SYMBOLS.find((s) => s.kind === 'curse')!.id
