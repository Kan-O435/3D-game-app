import { COLUMNS, ROWS } from './layout'
import { cellAt, type Grid } from './spin'
import { SYMBOLS } from './symbols'

export interface LineWin {
  row: number
  symbolId: number
  matchLength: number
  payout: number
}

// Classic left-to-right slot rule: each row is a payline, and a win is a run
// of the same symbol starting at column 0, at least MIN_MATCH long.
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

export function findLineWins(grid: Grid): LineWin[] {
  const wins: LineWin[] = []

  for (let row = 0; row < ROWS; row++) {
    const first = cellAt(grid, 0, row)
    let matchLength = 1
    while (matchLength < COLUMNS && cellAt(grid, matchLength, row) === first) {
      matchLength++
    }
    if (matchLength >= MIN_MATCH) {
      wins.push({ row, symbolId: first, matchLength, payout: payoutFor(first, matchLength) })
    }
  }

  return wins
}

export function totalPayout(wins: readonly LineWin[]): number {
  return wins.reduce((sum, win) => sum + win.payout, 0)
}
