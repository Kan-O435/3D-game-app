export const TURNS_PER_STAGE = 15
export const STARTING_MONEY = 0

// Fire the warning SE once this few turns remain in a stage.
export const WARNING_TURNS = 2

// Quota is a target for the running money total (money carries over between
// stages), so it grows cumulatively: 10, 23, 39, 58, 80, ...
// Numbers come from a Monte Carlo run against the current symbol weights and
// payline multipliers — stage 1 clears ~89% of the time, median run reaches
// stage ~5. Placeholder balance, see docs/NOTES.md.
export function quotaForStage(stage: number): number {
  return Math.round(10 * stage * (1 + 0.15 * (stage - 1)))
}
