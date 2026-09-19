import type { Modifiers } from './charms'

export const TURNS_PER_STAGE = 12
export const STARTING_MONEY = 30

// Fire the warning SE once this few turns remain before the deadline.
export const WARNING_TURNS = 2

// Shop: 8 items on the counter, and a "品替え" (reroll) button.
export const SHOP_SLOTS = 8
export const REROLL_COST = 10

// What a stage's order demands. All three grow with the stage:
//  - due:        coins paid on the stage's last turn (32, 50, 76, 110, ...)
//  - perfNeeded: performance points (P) that must have been earned by then
//                (7, 8, 9, 10, ...) — money alone isn't enough
//  - spinCost:   coins charged for every spin (2, 2, 2, 3, 3, 3, 4, ...)
// The deadline is the *last turn* of the stage; having enough early does
// nothing, every stage plays out all its turns. Leftover coins carry over.
// Numbers come from a Monte Carlo run against the current payout table (a spin
// is worth ~9 coins and ~1.4 P on average, after rate limits; ~50% of spins
// pay): never buying charms → median stage 4, stage-1 pass ≈ 96%; buying wisely
// → median 4 and ~11% reach stage 10. Placeholder balance, see docs/NOTES.md.
export function baseDueForStage(stage: number): number {
  const n = stage - 1
  return 32 + 14 * n + 4 * n * n
}

export function basePerfNeededForStage(stage: number): number {
  return 7 + (stage - 1)
}

export function baseSpinCostForStage(stage: number): number {
  return 2 + Math.floor((stage - 1) / 3)
}

export interface StageTerms {
  due: number
  perfNeeded: number
  spinCost: number
}

// The order for a stage after charm effects (cheaper lever, tax break, ...).
export function termsFor(stage: number, mods: Pick<Modifiers, 'spinCostFactor' | 'dueFactor'>): StageTerms {
  return {
    due: Math.round(baseDueForStage(stage) * mods.dueFactor),
    perfNeeded: basePerfNeededForStage(stage),
    spinCost: Math.max(1, Math.round(baseSpinCostForStage(stage) * mods.spinCostFactor)),
  }
}
