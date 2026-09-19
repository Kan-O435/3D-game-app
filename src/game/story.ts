// The game's fiction, told deadpan: the paperwork is perfectly ordinary, but what
// each stage is saving up for is a fan's ladder — first enough for the お話会
// (talk event), then a 2ショット, then a live show, and onwards to the dome.
// Text only — no game rules live here, so wording can be changed freely.

const STAGE_NAMES = [
  'お話会', // first goal: enough for the talk event
  '2ショット', // then the two-shot photo
  'ライブ', // then a live show
  'ワンマンライブ', // then a headline show
  '武道館', // the finale — the run is five stages long (TOTAL_STAGES)
] as const

/** Name of the event you're saving for at this stage (1-based). */
export function stageName(stage: number): string {
  if (stage < 1) return STAGE_NAMES[0]
  if (stage <= STAGE_NAMES.length) return STAGE_NAMES[stage - 1]
  return `伝説の${stage - STAGE_NAMES.length}周年公演`
}

export type DeathCause = 'both' | 'tokens' | 'perf'

/**
 * Cause of death for the certificate, read off the final numbers: short on
 * coins, short on performance, or both.
 */
export function deathCause(s: { money: number; due: number; perf: number; perfNeeded: number }): DeathCause {
  const shortOnCoins = s.money < s.due
  const shortOnPerf = s.perf < s.perfNeeded
  if (shortOnCoins && shortOnPerf) return 'both'
  return shortOnCoins ? 'tokens' : 'perf'
}

export const DEATH_CAUSE_TEXT: Record<DeathCause, string> = {
  both: '両ノルマ未達',
  tokens: '納付額未達',
  perf: '必要性能値未達',
}
