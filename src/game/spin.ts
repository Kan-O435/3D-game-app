import { CELL_COUNT, COLUMNS } from './layout'
import { drawSymbol } from './rng'

// Row-major: index = row * COLUMNS + col.
export type Grid = readonly number[]

export function spin(random: () => number = Math.random): Grid {
  return Array.from({ length: CELL_COUNT }, () => drawSymbol(random))
}

export function cellAt(grid: Grid, col: number, row: number): number {
  return grid[row * COLUMNS + col]
}
