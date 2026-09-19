import { COLUMNS } from './layout'
import { cellAt, type Grid } from './spin'
import { SYMBOLS } from './symbols'

// A payline is one row index per column: [1,1,1,1,1] is the middle row,
// [0,1,2,1,0] a V. Wins are matched left-to-right from column 0 along it.
export interface Pattern {
  id: string
  // One row index per column (length COLUMNS).
  rows: readonly number[]
  // Scales payouts on this line. The three base rows pay in full; the extra
  // patterns (unlocked by charms) pay less per line because there are more of
  // them to hit — tuned so each pattern charm is worth about a mid-tier charm.
  payoutFactor: number
}

export const PATTERNS: readonly Pattern[] = [
  { id: 'row-0', rows: [0, 0, 0, 0, 0], payoutFactor: 1 },
  { id: 'row-1', rows: [1, 1, 1, 1, 1], payoutFactor: 1 },
  { id: 'row-2', rows: [2, 2, 2, 2, 2], payoutFactor: 1 },
  { id: 'v', rows: [0, 1, 2, 1, 0], payoutFactor: 0.6 },
  { id: 'inv-v', rows: [2, 1, 0, 1, 2], payoutFactor: 0.6 },
  { id: 'diag-down', rows: [0, 0, 1, 2, 2], payoutFactor: 0.6 },
  { id: 'diag-up', rows: [2, 2, 1, 0, 0], payoutFactor: 0.6 },
]

// Always active. Everything else has to be unlocked (see charms.ts).
export const BASE_PATTERN_IDS: readonly string[] = ['row-0', 'row-1', 'row-2']

export interface LineWin {
  patternId: string
  symbolId: number
  matchLength: number
  // Grid indices (row-major) of the matched cells, so callers can highlight
  // them without knowing the pattern's shape.
  cells: number[]
  // May be fractional (pattern factor); computePayout rounds the spin total.
  payout: number
}

// Classic left-to-right slot rule: a win is a run of the same symbol starting
// at column 0 along a pattern, at least MIN_MATCH long.
// 2 (not 3) because with 15 symbols a 3-run only hits ~3% of spins, which
// makes a turn-limited quota game pure luck — see docs/NOTES.md.
const MIN_MATCH = 2

// Longer runs pay progressively more than a flat per-cell rate. Tuned by
// simulation together with src/game/stage.ts's quota curve (median run clears
// ~4 stages); still not final balance.
const MATCH_MULTIPLIER: Readonly<Record<number, number>> = {
  2: 2,
  3: 6,
  4: 20,
  5: 60,
}

function payoutFor(symbolId: number, matchLength: number): number {
  const symbol = SYMBOLS.find((s) => s.id === symbolId)
  if (!symbol) throw new Error(`Unknown symbol id: ${symbolId}`)
  return symbol.payout * (MATCH_MULTIPLIER[matchLength] ?? 0)
}

export function findLineWins(
  grid: Grid,
  activePatternIds: readonly string[] = BASE_PATTERN_IDS,
): LineWin[] {
  const wins: LineWin[] = []

  for (const pattern of PATTERNS) {
    if (!activePatternIds.includes(pattern.id)) continue

    const first = cellAt(grid, 0, pattern.rows[0])
    let matchLength = 1
    while (matchLength < COLUMNS && cellAt(grid, matchLength, pattern.rows[matchLength]) === first) {
      matchLength++
    }
    if (matchLength >= MIN_MATCH) {
      wins.push({
        patternId: pattern.id,
        symbolId: first,
        matchLength,
        cells: pattern.rows.slice(0, matchLength).map((row, col) => row * COLUMNS + col),
        payout: payoutFor(first, matchLength) * pattern.payoutFactor,
      })
    }
  }

  return wins
}

export function totalPayout(wins: readonly LineWin[]): number {
  return wins.reduce((sum, win) => sum + win.payout, 0)
}
