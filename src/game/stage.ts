export const TURNS_PER_STAGE = 15
export const STARTING_MONEY = 0

// Fire the warning SE once this few turns remain before the deadline.
export const WARNING_TURNS = 2

// The debt payment due when a stage's turns run out: 12, 20, 28, 36, 44, ...
// The deadline is the *last turn* of the stage — paying early isn't a thing, so
// a stage always plays out all its turns. Coins left over after paying carry
// into the next stage.
// Tuned by Monte Carlo against the current payout table (~30 coins per 15-turn
// stage): never buying charms → median ~stage 4, ~1% reach stage 10; buying
// wisely (keeping a cushion for the next payment) → same median, ~15% reach 10.
// Placeholder balance, see docs/NOTES.md.
export function dueForStage(stage: number): number {
  return 12 + 8 * (stage - 1)
}
