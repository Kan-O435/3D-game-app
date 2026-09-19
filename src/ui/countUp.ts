// Pure helper behind the rolling-number displays: the value a counter shows
// `progress` (0..1) of the way from `from` to `to`, easing out so it settles
// gently. Integers only — these are coin counts.
export function easeValue(from: number, to: number, progress: number): number {
  const t = Math.min(1, Math.max(0, progress))
  if (t >= 1) return to
  const eased = 1 - (1 - t) ** 3
  return Math.round(from + (to - from) * eased)
}
