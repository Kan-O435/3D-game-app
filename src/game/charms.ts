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

// Names/flavor text are placeholders until the icon theme is settled (see
// docs/NOTES.md); ids and effects are what the rest of the code depends on.
// Prices/effects were tuned by simulation against the payment curve in stage.ts:
// each charm pays back in ~2 stages, and buying aggressively raises both the
// odds of an early loss and of a deep run (see docs/NOTES.md).
export const CHARMS: readonly CharmDef[] = [
  {
    id: 'blood-pact',
    name: '血の契約',
    description: '配当が 25% 増える',
    price: 16,
    apply: (m) => void (m.payoutMultiplier += 0.25),
  },
  {
    id: 'candle-stub',
    name: '蝋燭の残り火',
    description: '各ステージのターン +1',
    price: 6,
    apply: (m) => void (m.extraTurns += 1),
  },
  {
    id: 'rusty-key',
    name: '錆びた鍵',
    description: '低位シンボルが出やすくなる',
    price: 5,
    apply: (m) => boost(m, range(0, 4), 3),
  },
  {
    id: 'black-cat-eye',
    name: '黒猫の目',
    description: 'レアシンボルが出やすくなる',
    price: 20,
    apply: (m) => boost(m, range(10, 12), 6),
  },
  {
    id: 'pity-coin',
    name: '慰めの硬貨',
    description: '外れたスピンでも +1 コイン',
    price: 22,
    apply: (m) => void (m.consolation += 1),
  },
  {
    id: 'silver-tooth',
    name: '銀の歯',
    description: '当たりのラインごとに +1 コイン',
    price: 11,
    apply: (m) => void (m.winBonus += 1),
  },
  {
    id: 'skull-ring',
    name: '骸骨の指輪',
    description: '4個以上揃いの配当が 2.5 倍',
    price: 8,
    apply: (m) => void (m.longMatchMultiplier *= 2.5),
  },
  {
    id: 'fate-dice',
    name: '運命の賽',
    description: '支払いのあと +6 コイン',
    price: 10,
    apply: (m) => void (m.clearBonus += 6),
  },
  {
    id: 'wild-tongue',
    name: '偽りの舌',
    description: 'ワイルド(W)が出やすくなる',
    price: 12,
    apply: (m) => boost(m, [WILD_ID], 2),
  },
  {
    id: 'star-lure',
    name: '星の誘い',
    description: 'ボーナス(★)が出やすくなる',
    price: 12,
    apply: (m) => boost(m, [SCATTER_ID], 1.4),
  },
  {
    id: 'v-scar',
    name: '裂け目',
    description: 'V字・逆V字のラインでも当たる',
    price: 22,
    apply: (m) => void m.extraPatterns.push('v', 'inv-v'),
  },
  {
    id: 'crooked-blade',
    name: '歪んだ刃',
    description: '斜めのラインでも当たる',
    price: 22,
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
  }
  for (const id of ownedIds) findCharm(id)?.apply(m)
  return m
}

// Final coins for one spin, after charm effects. Replaces summing
// `LineWin.payout` directly now that charms can bend the result.
export function computePayout(wins: readonly LineWin[], m: Modifiers): number {
  if (wins.length === 0) return m.consolation
  // The long-match bonus is about pattern runs; a scatter count isn't a "run".
  const isLongRun = (w: LineWin) => w.patternId !== 'scatter' && w.matchLength >= 4
  const base = wins.reduce(
    (sum, w) => sum + w.payout * (isLongRun(w) ? m.longMatchMultiplier : 1) + m.winBonus,
    0,
  )
  return Math.round(base * m.payoutMultiplier)
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
