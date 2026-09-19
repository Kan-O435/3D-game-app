// Shared "how is the machine moving right now" state, plus the pure curves that
// turn event timestamps into offsets. ReelGrid records events (a reel landing, a
// win, a rate limit); the cabinet, camera and lights read them each frame and
// derive their motion from `now - eventTime`, so nothing needs per-frame decay
// bookkeeping. A plain mutable object like moodState: writers are the reels.

export const motion = {
  /** True from the lever pull until the last reel lands. */
  spinning: false,
  /** Times (clock seconds) of the most recent reel landings. */
  landings: [] as number[],
  /** When the last win happened, and how big (see powerFor). */
  winAt: -100,
  winPower: 0,
  /** When the last rate limit hit. */
  limitAt: -100,
  /** Coins the coin-burst should still spawn (consumed by CoinBurst). */
  pendingCoins: 0,
}

const MAX_LANDINGS = 8

export function markLanding(now: number) {
  motion.landings.push(now)
  if (motion.landings.length > MAX_LANDINGS) motion.landings.shift()
}

export function markWin(now: number, payout: number) {
  motion.winAt = now
  motion.winPower = powerFor(payout)
  motion.pendingCoins += coinsFor(payout)
}

export function markLimit(now: number) {
  motion.limitAt = now
}

/** How hard a win hits: ordinary, BIG WIN, JACKPOT (same lines as ui/winTier). */
export function powerFor(payout: number): number {
  if (payout >= 500) return 1.6
  if (payout >= 100) return 1.1
  return payout > 0 ? 0.6 : 0
}

/** How many coins burst out of the tray for a payout (a handful up to a shower). */
export function coinsFor(payout: number): number {
  if (payout <= 0) return 0
  return Math.max(4, Math.min(34, Math.round(payout / 6)))
}

/** The thump each landing reel gives the machine: 0..~1, dying away in ~0.25 s. */
export function thud(now: number, landings: readonly number[]): number {
  let total = 0
  for (const t of landings) {
    const age = now - t
    if (age >= 0 && age < 0.5) total += Math.exp(-age * 12)
  }
  return Math.min(1.4, total)
}

/** Vertical hop after a win, in metres: a few decaying bounces. */
export function winHop(now: number, winAt: number, power: number): number {
  const age = now - winAt
  if (age < 0 || age > 1.6 || power <= 0) return 0
  return power * 0.045 * Math.exp(-age * 2.6) * Math.abs(Math.sin(age * 11))
}

/** Sideways/vertical shake amplitude after a hit (win or rate limit): 0..power, decaying. */
export function shake(now: number, at: number, power: number): number {
  const age = now - at
  if (age < 0 || age > 1.2 || power <= 0) return 0
  return power * Math.exp(-age * 4.5)
}

/** Camera punch-in after a win: pushes forward then eases back (0..power). */
export function punch(now: number, at: number, power: number): number {
  const age = now - at
  if (age < 0 || age > 1.5 || power <= 0) return 0
  return power * Math.sin(Math.min(1, age / 0.18) * Math.PI * 0.5) * Math.exp(-age * 3.2)
}

/** Reel scroll phase (in cells) `t` seconds after the lever, easing up to `speed`. */
export function scrollPhase(t: number, speed: number, ramp = 0.18): number {
  if (t <= 0) return 0
  if (t < ramp) return (0.5 * speed * t * t) / ramp
  return speed * (t - ramp / 2)
}

/** Pop scale for a winning cell `age` seconds after its turn: overshoots then settles to 1. */
export function popScale(age: number): number {
  if (age < 0) return 1
  return 1 + 0.45 * Math.exp(-age * 7) * Math.cos(age * 16)
}

/**
 * Lever angle offset (radians, toward the camera) `age` seconds after the pull:
 * yanked down fast, then springs back with a couple of damped wobbles.
 */
export function leverAngle(age: number): number {
  if (age < 0) return 0
  const DOWN = 0.11
  if (age < DOWN) return 1.05 * Math.sin((age / DOWN) * Math.PI * 0.5)
  const t = age - DOWN
  return 1.05 * Math.exp(-t * 5.5) * Math.cos(t * 13)
}
