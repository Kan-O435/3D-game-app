// The game's fiction, told deadpan: the paperwork is perfectly ordinary, but what
// each stage is saving up for is a fan's ladder — first enough for the お話会
// (talk event), then a 2ショット, then a live show, and onwards to the dome.
// Text only — no game rules live here, so wording can be changed freely.

const STAGE_NAMES = [
  'お話会', // first goal: enough for the talk event
  '2ショット', // then the two-shot photo
  'ライブ', // then finally a live show
  'ワンマンライブ',
  'ホールツアー',
  '武道館',
  'ドーム公演',
  '全国ドームツアー',
  '世界ツアー',
] as const

/** Name of the event you're saving for at this stage (1-based). */
export function stageName(stage: number): string {
  if (stage < 1) return STAGE_NAMES[0]
  if (stage <= STAGE_NAMES.length) return STAGE_NAMES[stage - 1]
  return `伝説の${stage - STAGE_NAMES.length}周年公演`
}
