import { describe, expect, it } from 'vitest'
import {
  BASE_PATTERN_IDS,
  COLUMNS,
  CURSE_ID,
  PATTERNS,
  RATE_LIMIT_COUNT,
  ROWS,
  SCATTER_ID,
  SYMBOLS,
  WILD_ID,
  findLineWins,
  findRateLimit,
  payoutTable,
} from './index'

// A grid where nothing matches by accident: ids 0..11 only (no wild / scatter /
// curse), arranged so no pattern starts with a repeated symbol.
const blank = () =>
  Array.from({ length: COLUMNS * ROWS }, (_, i) => (i * 7 + 3) % 13).map((id) => (id === CURSE_ID ? 4 : id))

const A = 2
const B = 5
const ALL = PATTERNS.map((p) => p.id)

/** Blank grid with `symbols` laid along a pattern's path. */
const along = (rows: readonly number[], symbols: number[]) => {
  const grid = blank()
  symbols.forEach((id, col) => (grid[rows[col] * COLUMNS + col] = id))
  return grid
}
const middleRow = (symbols: number[]) => along([1, 1, 1, 1, 1], symbols)
const rowWins = (symbols: number[]) => findLineWins(middleRow(symbols), ['row-1'])

const symbolDef = (id: number) => SYMBOLS.find((s) => s.id === id)!

describe('patterns', () => {
  it('are COLUMNS long and stay inside the grid', () => {
    for (const p of PATTERNS) {
      expect(p.rows).toHaveLength(COLUMNS)
      expect(p.rows.every((r) => r >= 0 && r < ROWS)).toBe(true)
    }
  })

  it('finds nothing on the blank grid (test-fixture sanity)', () => {
    expect(findLineWins(blank(), ALL)).toEqual([])
  })

  it.each(PATTERNS)('$id pays a full 5-match on its own path', (p) => {
    const wins = findLineWins(along(p.rows, [11, 11, 11, 11, 11]), [p.id])
    expect(wins).toHaveLength(1)
    expect(wins[0]).toMatchObject({ patternId: p.id, matchLength: 5 })
  })

  it('reports the matched cells of a row win', () => {
    const [win] = rowWins([A, A, A, B, B])
    expect(win).toMatchObject({ patternId: 'row-1', matchLength: 3 })
    expect(win.cells).toEqual([5, 6, 7])
  })

  it('only the base rows are active by default', () => {
    expect(BASE_PATTERN_IDS).toEqual(['row-0', 'row-1', 'row-2'])
    const v = along([0, 1, 2, 1, 0], [9, 9, 9, 9, 9])
    expect(findLineWins(v)).toEqual([])
    const [win] = findLineWins(v, [...BASE_PATTERN_IDS, 'v'])
    expect(win.patternId).toBe('v')
    expect(win.cells).toEqual([0, 6, 12, 8, 4])
  })

  it('needs the run to start on column 0', () => {
    const grid = blank()
    ;[1, 2, 3].forEach((c) => (grid[c] = 4))
    expect(findLineWins(grid).filter((w) => w.patternId === 'row-0')).toEqual([])
  })

  it('pays extra patterns at their payoutFactor', () => {
    const rowPay = rowWins([symbolDef(5).id, 5, 5])[0].payout
    const vPay = findLineWins(along([0, 1, 2, 1, 0], [5, 5, 5]), ['v'])[0].payout
    expect(vPay).toBeCloseTo(rowPay * 0.6)
  })

  it('lets several patterns win in the same spin', () => {
    const grid = along([1, 1, 1, 1, 1], [2, 2, 2, 2, 2])
    ;[0, 5, 10].forEach((row, col) => (grid[row * COLUMNS + col] = 2)) // touches other paths
    expect(findLineWins(grid, ALL).length).toBeGreaterThan(1)
  })
})

describe('wild', () => {
  const W = WILD_ID

  it('is registered as the wild kind', () => {
    expect(symbolDef(W).kind).toBe('wild')
  })

  it('extends a run of the first normal symbol', () => {
    const [win] = rowWins([A, W, A, B, B])
    expect(win).toMatchObject({ symbolId: A, matchLength: 3 })
  })

  it('leading wilds adopt the next normal symbol', () => {
    const [win] = rowWins([W, W, A, A, B])
    expect(win).toMatchObject({ symbolId: A, matchLength: 4 })
  })

  it('a different symbol ends the run even after a wild', () => {
    const [win] = rowWins([W, A, B, B, B])
    expect(win).toMatchObject({ symbolId: A, matchLength: 2 })
  })

  it('an all-wild run pays as the wild', () => {
    const [win] = rowWins([W, W, W, W, W])
    expect(win).toMatchObject({ symbolId: W, matchLength: 5 })
    expect(win.payout).toBe(symbolDef(W).payout * 45)
  })

  it('never bridges a scatter or a curse', () => {
    expect(rowWins([A, W, SCATTER_ID, A, A])[0].matchLength).toBe(2)
    expect(rowWins([A, W, CURSE_ID, A, A])[0].matchLength).toBe(2)
  })
})

describe('scatter', () => {
  const scatters = (n: number) => {
    const grid = blank()
    ;[0, 7, 14, 3, 9, 11].slice(0, n).forEach((i) => (grid[i] = SCATTER_ID))
    return grid
  }
  const scatterWin = (grid: number[]) => findLineWins(grid, []).find((w) => w.patternId === 'scatter')

  it('breaks a run, and a line starting on one never wins', () => {
    expect(rowWins([A, A, SCATTER_ID, A, A])[0].matchLength).toBe(2)
    expect(rowWins([SCATTER_ID, A, A, A, A])).toEqual([])
  })

  it('needs 3 anywhere on the grid', () => {
    expect(scatterWin(scatters(2))).toBeUndefined()
    const win = scatterWin(scatters(3))!
    expect(win).toMatchObject({ matchLength: 3, payout: 30, perf: 0 })
    expect(win.cells).toHaveLength(3)
  })

  it('pays 30 / 100 / 300 and caps at the 5 rate', () => {
    expect([3, 4, 5, 6].map((n) => scatterWin(scatters(n))!.payout)).toEqual([30, 100, 300, 300])
  })

  it('pays regardless of which patterns are active', () => {
    expect(findLineWins(scatters(3)).some((w) => w.patternId === 'scatter')).toBe(true)
    expect(findLineWins(scatters(3), ['v']).some((w) => w.patternId === 'scatter')).toBe(true)
  })

  it('is not triggered by wilds', () => {
    const grid = blank()
    ;[0, 7, 14].forEach((i) => (grid[i] = WILD_ID))
    expect(scatterWin(grid)).toBeUndefined()
  })
})

describe('curse / rate limit', () => {
  const curses = (n: number) => {
    const grid = blank()
    ;[0, 7, 14, 3, 9, 11].slice(0, n).forEach((i) => (grid[i] = CURSE_ID))
    return grid
  }

  it('is one of the 15 symbols', () => {
    expect(SYMBOLS).toHaveLength(15)
    expect(symbolDef(CURSE_ID).kind).toBe('curse')
  })

  it('needs RATE_LIMIT_COUNT anywhere on the grid', () => {
    expect(RATE_LIMIT_COUNT).toBe(3)
    expect(findRateLimit(curses(2))).toBeNull()
    expect(findRateLimit(curses(3))).toMatchObject({ patternId: 'rate-limit', matchLength: 3, payout: 0, perf: 0 })
    expect(findRateLimit(curses(6))!.cells).toHaveLength(6)
  })

  it('never joins a run and wild does not bridge it', () => {
    expect(rowWins([CURSE_ID, A, A, A, A])).toEqual([])
    expect(rowWins([A, A, CURSE_ID, A, A])[0].matchLength).toBe(2)
    expect(rowWins([A, WILD_ID, CURSE_ID, A, A])[0].matchLength).toBe(2)
  })

  it('is decided by the store, not by findLineWins', () => {
    expect(findLineWins(curses(3)).every((w) => w.patternId !== 'rate-limit')).toBe(true)
  })
})

describe('performance points', () => {
  it('a win earns symbol perf x (matched - 1)', () => {
    const perf = symbolDef(A).perf
    expect(rowWins([A, A, B, B, B])[0].perf).toBe(perf * 1)
    expect(rowWins([A, A, A, A, A])[0].perf).toBe(perf * 4)
  })

  it('scatter wins earn none', () => {
    const grid = blank()
    ;[0, 7, 14].forEach((i) => (grid[i] = SCATTER_ID))
    expect(findLineWins(grid).find((w) => w.patternId === 'scatter')!.perf).toBe(0)
  })
})

describe('drifting symbol values in payouts', () => {
  const base = () => rowWins([A, A, A, B, B])[0].payout
  const drifted = (factors: Record<number, number>) =>
    findLineWins(middleRow([A, A, A, B, B]), ['row-1'], factors)[0].payout

  it('scales only that symbol', () => {
    expect(drifted({ [A]: 2 })).toBe(base() * 2)
    expect(drifted({ [A]: 0.5 })).toBe(base() * 0.5)
    expect(drifted({ [B]: 2 })).toBe(base())
    expect(drifted({})).toBe(base())
  })
})

describe('payout table', () => {
  it('has parallel lengths/payouts and lists every symbol exactly once', () => {
    const table = payoutTable()
    expect(table.every((r) => r.lengths.length === r.payouts.length)).toBe(true)
    expect(table.flatMap((r) => r.symbolIds).sort((a, b) => a - b)).toEqual(SYMBOLS.map((s) => s.id))
  })

  it('shows 2-run = symbol payout x its multiplier, the scatter row, and the curse row', () => {
    const table = payoutTable()
    const common = table.find((r) => r.symbolIds.includes(0))!
    expect(common.lengths[0]).toBe(2)
    expect(common.payouts[0]).toBe(symbolDef(0).payout * 1.5)
    expect(table.find((r) => r.kind === 'scatter')!.payouts).toEqual([30, 100, 300])
    expect(table.find((r) => r.kind === 'curse')).toMatchObject({ lengths: [RATE_LIMIT_COUNT], payouts: [0] })
  })

  it('splits a tier when only some symbols drifted, and scales the row', () => {
    const plain = payoutTable()
    const drifted = payoutTable({ 0: 2 })
    expect(drifted).toHaveLength(plain.length + 1)
    const row = drifted.find((r) => r.symbolIds.includes(0))!
    expect(row).toMatchObject({ symbolIds: [0], factor: 2 })
    expect(row.payouts[0]).toBe(plain.find((r) => r.symbolIds.includes(0))!.payouts[0] * 2)
    expect(plain.every((r) => r.factor === 1)).toBe(true)
  })
})
