import { describe, expect, it } from 'vitest'
import { COLUMNS, ROWS } from '../game/layout'
import { CELL_SIZE, GRID_HEIGHT, GRID_WIDTH, STEP, cellPosition, rowY } from './reelLayout'

describe('reel layout', () => {
  it('is centred: the first and last cells mirror each other', () => {
    const [x0, y0] = cellPosition(0)
    const [x1, y1] = cellPosition(COLUMNS * ROWS - 1)
    expect(x0).toBeCloseTo(-x1)
    expect(y0).toBeCloseTo(-y1)
  })

  it('cells are one STEP apart and stay inside the window', () => {
    expect(cellPosition(1)[0] - cellPosition(0)[0]).toBeCloseTo(STEP)
    expect(cellPosition(COLUMNS)[1] - cellPosition(0)[1]).toBeCloseTo(-STEP)
    for (let i = 0; i < COLUMNS * ROWS; i++) {
      const [x, y] = cellPosition(i)
      expect(Math.abs(x) + CELL_SIZE / 2).toBeLessThanOrEqual(GRID_WIDTH / 2 + 1e-9)
      expect(Math.abs(y) + CELL_SIZE / 2).toBeLessThanOrEqual(GRID_HEIGHT / 2 + 1e-9)
    }
  })

  it('rowY matches the cell rows and extends beyond the window', () => {
    expect(rowY(0)).toBeCloseTo(cellPosition(0)[1])
    expect(rowY(ROWS - 1)).toBeCloseTo(cellPosition(COLUMNS * (ROWS - 1))[1])
    expect(rowY(-1)).toBeGreaterThan(rowY(0))
    expect(rowY(ROWS)).toBeLessThan(rowY(ROWS - 1))
  })
})
