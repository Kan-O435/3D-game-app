// The game's fiction, told deadpan: the paperwork is perfectly ordinary, but the
// event each stage is saving up for is an idol's (地下ライブ ... 武道館 ... ドーム).
// Text only — no game rules live here, so wording can be changed freely.

const STAGE_NAMES = [
  '地下ライブ',
  'ミニライブ',
  '握手会',
  'ワンマンライブ',
  'ホールツアー',
  'アリーナ公演',
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
