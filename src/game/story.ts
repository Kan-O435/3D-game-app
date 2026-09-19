// The game's fiction: you're a fan (ヲタク) grinding to fund your favourite idol
// (推し). Each stage is a bigger event you're saving up for. Text only — no game
// rules live here, so wording can be changed freely.

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

// What the idol says on the stage's order sheet.
const OSHI_MESSAGES = [
  '来てくれてありがとう！ 最前は無理でも、心はいつもそばにいるよ。',
  '今日も応援ありがとう！ 次はもっと大きなステージに立つね。',
  '握手会、待ってるよ。手、洗って来てね？',
  'ワンマンだよ！ 絶対ぜったい見に来てね♡',
  '全国まわるの、ついてきてくれる…？',
  'アリーナだよ？ ここまで来られたの、みんなのおかげ。',
  '武道館…ずっと夢だったの。最後まで見ててね。',
  'ドームの景色、いっしょに見たいな。',
  'ツアー、最終日まで走りきるよ！',
  '世界に行こう、いっしょに！',
] as const

const FALLBACK_MESSAGE = 'いつもありがとう。これからもよろしくね！'

/** Name of the event you're saving for at this stage (1-based). */
export function stageName(stage: number): string {
  if (stage < 1) return STAGE_NAMES[0]
  if (stage <= STAGE_NAMES.length) return STAGE_NAMES[stage - 1]
  return `伝説の${stage - STAGE_NAMES.length}周年公演`
}

/** The idol's note for this stage's order sheet. */
export function oshiMessage(stage: number): string {
  return OSHI_MESSAGES[stage - 1] ?? FALLBACK_MESSAGE
}
