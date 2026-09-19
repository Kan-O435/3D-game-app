import { COLUMNS } from './layout'
import { cellAt, type Grid } from './spin'
import type { ValueFactors } from './drift'
import { CURSE_ID, SCATTER_ID, SYMBOLS, WILD_ID, type SymbolKind } from './symbols'

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
  // Performance points this win earns (see symbols.ts `perf`); 0 for scatters.
  perf: number
}

// Classic left-to-right slot rule: a win is a run of the same symbol starting
// at column 0 along a pattern, at least MIN_MATCH long.
// 2 (not 3) because with 15 symbols a 3-run only hits ~3% of spins, which
// makes a turn-limited debt-payment game pure luck — see docs/NOTES.md.
const MIN_MATCH = 2

// Longer runs pay progressively more than a flat per-cell rate. Tuned by
// simulation together with src/game/stage.ts's payment curve (median run clears
// ~4 stages); still not final balance.
const MATCH_MULTIPLIER: Readonly<Record<number, number>> = {
  2: 1.5,
  3: 4.5,
  4: 15,
  5: 45,
}

function payoutFor(symbolId: number, matchLength: number, factors: ValueFactors = {}): number {
  const symbol = SYMBOLS.find((s) => s.id === symbolId)
  if (!symbol) throw new Error(`Unknown symbol id: ${symbolId}`)
  // `factors` is the drifting symbol values (see drift.ts); missing = unchanged.
  return symbol.payout * (factors[symbolId] ?? 1) * (MATCH_MULTIPLIER[matchLength] ?? 0)
}

// Scatter payout by how many scatters are on the grid (3 minimum; more than 5
// pays the 5 rate). Flat coins — not multiplied by the line-match table.
const SCATTER_MIN = 3
const SCATTER_PAYOUT: Readonly<Record<number, number>> = {
  3: 30,
  4: 100,
  5: 300,
}

// One point of performance per matched symbol beyond the first, times the
// symbol's own perf value: a 2-run of a perf-2 symbol is 2, a 5-run is 8.
function perfFor(symbolId: number, matchLength: number): number {
  const symbol = SYMBOLS.find((s) => s.id === symbolId)
  return (symbol?.perf ?? 0) * (matchLength - 1)
}

const KIND_BY_ID = new Map(SYMBOLS.map((s) => [s.id, s.kind]))

// Walks one pattern from column 0. Wilds extend a run of whatever normal
// symbol shows up first (so W,W,A,A,B is a 4-run of A); a scatter, a curse or a
// different normal symbol ends it. A run of only wilds pays as the wild.
function winOnPattern(grid: Grid, pattern: Pattern, factors: ValueFactors): LineWin | null {
  let base: number | null = null
  let length = 0

  for (let col = 0; col < COLUMNS; col++) {
    const id = cellAt(grid, col, pattern.rows[col])
    const kind = KIND_BY_ID.get(id)
    if (kind === 'scatter' || kind === 'curse') break
    if (kind === 'normal') {
      if (base === null) base = id
      else if (id !== base) break
    }
    length++
  }

  if (length < MIN_MATCH) return null
  const symbolId = base ?? WILD_ID
  return {
    patternId: pattern.id,
    symbolId,
    matchLength: length,
    cells: pattern.rows.slice(0, length).map((row, col) => row * COLUMNS + col),
    payout: payoutFor(symbolId, length, factors) * pattern.payoutFactor,
    perf: perfFor(symbolId, length),
  }
}

// Scatters pay wherever they land, independent of any pattern, so this part
// ignores `activePatternIds`.
function scatterWin(grid: Grid): LineWin | null {
  const cells = grid.flatMap((id, i) => (id === SCATTER_ID ? [i] : []))
  if (cells.length < SCATTER_MIN) return null
  return {
    patternId: 'scatter',
    symbolId: SCATTER_ID,
    matchLength: cells.length,
    cells,
    payout: SCATTER_PAYOUT[Math.min(cells.length, 5)],
    perf: 0,
  }
}

export function findLineWins(
  grid: Grid,
  activePatternIds: readonly string[] = BASE_PATTERN_IDS,
  valueFactors: ValueFactors = {},
): LineWin[] {
  const wins: LineWin[] = []

  for (const pattern of PATTERNS) {
    if (!activePatternIds.includes(pattern.id)) continue
    const win = winOnPattern(grid, pattern, valueFactors)
    if (win) wins.push(win)
  }

  const scatter = scatterWin(grid)
  if (scatter) wins.push(scatter)

  return wins
}

// The rate limit: this many curse symbols anywhere on the grid and the whole
// spin's take is forfeited. Returned as a LineWin (payout 0, patternId
// 'rate-limit') so the renderer can highlight the offending cells; the store
// swaps it in for the real wins unless a charm makes the player immune, and
// computePayout treats it as "pays nothing".
export const RATE_LIMIT_COUNT = 3

export function findRateLimit(grid: Grid): LineWin | null {
  const cells = grid.flatMap((id, i) => (id === CURSE_ID ? [i] : []))
  if (cells.length < RATE_LIMIT_COUNT) return null
  return { patternId: 'rate-limit', symbolId: CURSE_ID, matchLength: cells.length, cells, payout: 0, perf: 0 }
}

export function totalPayout(wins: readonly LineWin[]): number {
  return wins.reduce((sum, win) => sum + win.payout, 0)
}

// Rows for the on-screen payout table (配当表): symbols that pay the same are
// grouped into one row. `lengths`/`payouts` are parallel — for line rows that's
// 2..5 in a row on a base pattern; for the scatter row it's 3..5 anywhere.
export interface PayoutRow {
  kind: SymbolKind
  symbolIds: number[]
  perf: number
  // Drift factor for this row's symbols (1 = unchanged); rows split when the
  // symbols of one payout tier drift differently.
  factor: number
  lengths: number[]
  payouts: number[]
}

export function payoutTable(valueFactors: ValueFactors = {}): PayoutRow[] {
  const rows = new Map<string, PayoutRow>()
  for (const s of SYMBOLS) {
    const factor = valueFactors[s.id] ?? 1
    const key = s.kind === 'scatter' || s.kind === 'curse' ? s.kind : `${s.kind}-${s.payout}-${s.perf}-${factor}`
    const existing = rows.get(key)
    if (existing) {
      existing.symbolIds.push(s.id)
      continue
    }
    const lengths = s.kind === 'scatter' ? [3, 4, 5] : s.kind === 'curse' ? [RATE_LIMIT_COUNT] : [2, 3, 4, 5]
    rows.set(key, {
      kind: s.kind,
      symbolIds: [s.id],
      perf: s.perf,
      factor,
      lengths,
      payouts: lengths.map((n) => (s.kind === 'scatter' ? SCATTER_PAYOUT[n] : s.kind === 'curse' ? 0 : payoutFor(s.id, n, valueFactors))),
    })
  }
  return [...rows.values()]
}
