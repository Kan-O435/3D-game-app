import type { Modifiers } from './charms'

export const TURNS_PER_STAGE = 12
export const STARTING_MONEY = 20

// Fire the warning SE once this few turns remain before the deadline.
export const WARNING_TURNS = 2

// Shop: 8 items on the counter, and a "品替え" (reroll) button.
export const SHOP_SLOTS = 8
export const REROLL_COST = 10

// What a stage's order demands. All three grow with the stage:
//  - due:        coins paid on the stage's last turn (32, 52, 80, 116, ...)
//  - perfNeeded: performance points (P) that must have been earned by then
//                (4, 4, 5, 5, 6, ...) — money alone isn't enough
//  - spinCost:   coins charged for every spin (2, 2, 2, 3, 3, 3, 4, ...)
// The deadline is the *last turn* of the stage; having enough early does
// nothing, every stage plays out all its turns. Leftover coins carry over.
// Numbers come from a Monte Carlo run against the current payout table (a spin
// is worth ~10 coins and ~0.7 P on average): never buying charms → median
// stage 3; buying wisely → median 4 and ~12% reach stage 10. Placeholder
// balance, see docs/NOTES.md.
export function baseDueForStage(stage: number): number {
  const n = stage - 1
  return 32 + 16 * n + 4 * n * n
}

export function basePerfNeededForStage(stage: number): number {
  return 4 + Math.floor((stage - 1) * 0.5)
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
