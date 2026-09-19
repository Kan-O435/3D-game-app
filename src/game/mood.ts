import { WARNING_TURNS } from './stage'

// How tense the moment is, 0..1, from turns left in the stage: nothing until
// the last WARNING_TURNS turns, then rising as they run out (the final turn —
// including while its reels are still spinning — is the peak).
export function tensionFor(turnsLeft: number): number {
  if (turnsLeft > WARNING_TURNS) return 0
  return Math.min(1, (WARNING_TURNS + 1 - Math.max(0, turnsLeft)) / (WARNING_TURNS + 1))
}

// Slow background creep: deeper stages are a little darker even with turns to
// spare. Capped so it never reaches full tension on its own.
export function dreadFor(stage: number): number {
  return Math.min(0.3, Math.max(0, stage - 1) * 0.05)
}

// What drives lights / post-processing / camera unrest.
export function moodFor(turnsLeft: number, stage: number): number {
  return Math.min(1, tensionFor(turnsLeft) + dreadFor(stage))
}

// Heartbeat speed for a given mood/tension level.
export function heartbeatBpm(level: number): number {
  return 70 + 50 * Math.min(1, Math.max(0, level))
}
