// Lines the boss says over the radio (the caption at the bottom of the screen).
// Deadpan office banter that also works as tutorial / reaction text. Pure and
// text-only — which line plays is picked here, *when* is decided by the store.

// A spin paying at least this much counts as a big win (same line as the BIG WIN
// banner in ui/winTier.ts — a test keeps the two in step).
export const BIG_WIN_PAYOUT = 100

export type RadioEvent =
  | 'tutorial'
  | 'stageStart'
  | 'win'
  | 'bigWin'
  | 'rateLimit'
  | 'payable'
  | 'lowTurns'
  | 'shop'
  | 'cleared'

const LINES: Record<RadioEvent, readonly string[]> = {
  tutorial: ['作業は簡単や。レバー引くか、スペースキー押すか、それだけや。'],
  stageStart: ['次の現場や。気ぃ抜くなよ。', '納付額、ちゃんと見たか？', '今日もよろしく頼むで。'],
  win: ['お、揃ったな。その調子や。', '悪くないな。', '数字は嘘つかんで。'],
  bigWin: ['ええ当たりやな。今日は運がええ。', 'これだけあれば、ちょっとは楽になるやろ。'],
  rateLimit: ['炎上や。今日の稼ぎは全部パーやな。', '燃えとるな…。ご愁傷様や。'],
  payable: ['両方のノルマが揃ったな。退場用の伝票、吊るしといたぞ。'],
  lowTurns: ['そろそろ時間やぞ。', '間に合うんか？'],
  shop: ['余った金で買い物しとけ。ただし納付の分は残しとけよ。', '買いすぎたらあとが苦しいぞ。'],
  cleared: ['全部片づけたか。…よう生き残ったな。'],
}

/** The line for an event; `random` is injectable like the other pure pickers. */
export function radioLine(event: RadioEvent, random: () => number = Math.random): string {
  const lines = LINES[event]
  return lines[Math.floor(random() * lines.length)]
}

/** Speaker tag shown in front of every line. */
export const RADIO_SPEAKER = '部長'
