import { COLUMNS, ROWS } from '../game/layout'

// Geometry of the reel window, shared by the reels and the win effects. All in
// the reel group's local units (the group is centred on the window).
export const CELL_SIZE = 0.22
export const CELL_GAP = 0.04
export const STEP = CELL_SIZE + CELL_GAP
export const GRID_WIDTH = COLUMNS * CELL_SIZE + (COLUMNS - 1) * CELL_GAP
export const GRID_HEIGHT = ROWS * CELL_SIZE + (ROWS - 1) * CELL_GAP

/** Centre of grid cell `index` (row-major), as [x, y] in local units. */
export function cellPosition(index: number): [number, number] {
  const col = index % COLUMNS
  const row = Math.floor(index / COLUMNS)
  return [col * STEP - GRID_WIDTH / 2 + CELL_SIZE / 2, GRID_HEIGHT / 2 - row * STEP - CELL_SIZE / 2]
}

/** Local y of the centre of row `row` (may be -1 or ROWS for the rows just outside). */
export function rowY(row: number): number {
  return GRID_HEIGHT / 2 - row * STEP - CELL_SIZE / 2
}
