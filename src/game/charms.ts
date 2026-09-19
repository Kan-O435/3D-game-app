import type { LineWin } from './paylines'
import { SCATTER_ID, WILD_ID } from './symbols'

// What the player's owned charms add up to. The spin/payout pipeline only ever
// reads this, so a charm is just "a function that nudges a Modifiers".
export interface Modifiers {
  // Multiplies the whole spin payout (1 = no change).
  payoutMultiplier: number
  extraTurns: number
  // symbolId -> factor applied to that symbol's draw weight.
  weightBoosts: Record<number, number>
  // Flat coins added per winning line.
  winBonus: number
  // Coins given when a spin has no winning line at all.
  consolation: number
  // Extra multiplier for wins that are 4+ symbols long.
  longMatchMultiplier: number
  // Coins granted right after a stage's debt is paid.
  clearBonus: number
  // Pattern ids (see paylines.ts) unlocked on top of the base rows.
  extraPatterns: string[]
  // Multiplies the performance points a spin earns.
  perfMultiplier: number
  // Scale the per-spin fee and the stage's debt (1 = unchanged, <1 = cheaper).
  spinCostFactor: number
  dueFactor: number
  // Ignore the rate limit (three curse symbols no longer wipe the spin).
  rateLimitImmune: boolean
}

export interface CharmDef {
  id: string
  name: string
  description: string
  price: number
  apply: (m: Modifiers) => void
}

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)

function boost(m: Modifiers, ids: number[], factor: number) {
  for (const id of ids) m.weightBoosts[id] = (m.weightBoosts[id] ?? 1) * factor
}

// Names/flavor text follow the fan-of-an-idol theme (docs/NOTES.md); ids and
// effects are what the rest of the code depends on, so reword freely.
// Prices/effects were tuned by simulation against the payment curve in stage.ts:
// each charm pays back in ~2 stages, and buying aggressively raises both the
// odds of an early loss and of a deep run (see docs/NOTES.md).
export const CHARMS: readonly CharmDef[] = [
  {
    id: 'blood-pact',
    name: '限定ペンライト',
    description: '配当が 25% 増える',
    price: 60,
    apply: (m) => void (m.payoutMultiplier += 0.25),
  },
  {
    id: 'candle-stub',
    name: '有給休暇',
    description: '各ステージのターン +1',
    price: 25,
    apply: (m) => void (m.extraTurns += 1),
  },
  {
    id: 'rusty-key',
    name: '握手券の束',
    description: '低位シンボルが出やすくなる',
    price: 20,
    apply: (m) => boost(m, range(0, 4), 3),
  },
  {
    id: 'black-cat-eye',
    name: '限定トレカ',
    description: 'レアシンボルが出やすくなる',
    price: 80,
    apply: (m) => boost(m, range(10, 11), 6),
  },
  {
    id: 'pity-coin',
    name: 'チェキ券',
    description: '外れたスピンでも +5 コイン',
    price: 80,
    apply: (m) => void (m.consolation += 5),
  },
  {
    id: 'silver-tooth',
    name: 'ファンレター',
    description: '当たりのラインごとに +5 コイン',
    price: 40,
    apply: (m) => void (m.winBonus += 5),
  },
  {
    id: 'skull-ring',
    name: 'ファンサうちわ',
    description: '4個以上揃いの配当が 2.5 倍',
    price: 35,
    apply: (m) => void (m.longMatchMultiplier *= 2.5),
  },
  {
    id: 'fate-dice',
    name: '臨時ボーナス',
    description: '納付のあと +30 コイン',
    price: 55,
    apply: (m) => void (m.clearBonus += 30),
  },
  {
    id: 'wild-tongue',
    name: '推しTシャツ',
    description: '推し(W)が出やすくなる',
    price: 45,
    apply: (m) => boost(m, [WILD_ID], 2),
  },
  {
    id: 'star-lure',
    name: 'サイリウム',
    description: 'ファンサ(★)が出やすくなる',
    price: 55,
    apply: (m) => boost(m, [SCATTER_ID], 1.4),
  },
  {
    id: 'overclock',
    name: 'オタ芸の特訓',
    description: '獲得する熱量が 1.5 倍',
    price: 40,
    apply: (m) => void (m.perfMultiplier *= 1.5),
  },
  {
    id: 'cheap-lever',
    name: '会員証',
    description: 'スピン費が 25% 安くなる',
    price: 30,
    apply: (m) => void (m.spinCostFactor *= 0.75),
  },
  {
    id: 'tax-break',
    name: '早割チケット',
    description: '納付額が 15% 減る',
    price: 50,
    apply: (m) => void (m.dueFactor *= 0.85),
  },
  {
    id: 'firewall',
    name: 'ミュート機能',
    description: '炎上(6)が3つ揃っても獲得が没収されない',
    price: 20,
    apply: (m) => void (m.rateLimitImmune = true),
  },
  {
    id: 'v-scar',
    name: 'ヲタ芸 V字',
    description: 'V字・逆V字のラインでも当たる',
    price: 80,
    apply: (m) => void m.extraPatterns.push('v', 'inv-v'),
  },
  {
    id: 'crooked-blade',
    name: 'ヲタ芸 斜め',
    description: '斜めのラインでも当たる',
    price: 80,
    apply: (m) => void m.extraPatterns.push('diag-down', 'diag-up'),
  },
]

export function findCharm(id: string): CharmDef | undefined {
  return CHARMS.find((c) => c.id === id)
}

export function resolveModifiers(ownedIds: readonly string[]): Modifiers {
  const m: Modifiers = {
    payoutMultiplier: 1,
    extraTurns: 0,
    weightBoosts: {},
    winBonus: 0,
    consolation: 0,
    longMatchMultiplier: 1,
    clearBonus: 0,
    extraPatterns: [],
    perfMultiplier: 1,
    spinCostFactor: 1,
    dueFactor: 1,
    rateLimitImmune: false,
  }
  for (const id of ownedIds) findCharm(id)?.apply(m)
  return m
}

// Final coins for one spin, after charm effects. Replaces summing
// `LineWin.payout` directly now that charms can bend the result.
export function computePayout(wins: readonly LineWin[], m: Modifiers): number {
  // A rate limit forfeits the whole spin — no line pay, no bonuses, no consolation.
  if (wins.some((w) => w.patternId === 'rate-limit')) return 0
  if (wins.length === 0) return m.consolation
  // The long-match bonus is about pattern runs; a scatter count isn't a "run".
  const isLongRun = (w: LineWin) => w.patternId !== 'scatter' && w.matchLength >= 4
  const base = wins.reduce(
    (sum, w) => sum + w.payout * (isLongRun(w) ? m.longMatchMultiplier : 1) + m.winBonus,
    0,
  )
  return Math.round(base * m.payoutMultiplier)
}

// Performance points a spin earns, after charm effects.
export function computePerformance(wins: readonly LineWin[], m: Modifiers): number {
  return Math.round(wins.reduce((sum, w) => sum + w.perf, 0) * m.perfMultiplier)
}

// Up to `count` distinct charms the player doesn't own yet. `random` is
// injectable like the other pure-logic entry points.
export function drawShopOffer(
  ownedIds: readonly string[],
  count = 3,
  random: () => number = Math.random,
): string[] {
  const pool = CHARMS.filter((c) => !ownedIds.includes(c.id)).map((c) => c.id)
  // Fisher-Yates, then take the head.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}
