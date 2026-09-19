// Grid shape: 5 reels x 3 rows = 15 visible cells (see CLAUDE.md "Game design
// constants"). Single source of truth — scene/ReelGrid.tsx imports this
// rather than hardcoding its own copy.
export const COLUMNS = 5
export const ROWS = 3
export const CELL_COUNT = COLUMNS * ROWS
