// How big a spin's payout is, for choosing the banner (WIN / BIG WIN / JACKPOT).
export type WinTier = 'win' | 'big' | 'jackpot'

export const BIG_WIN = 100
export const JACKPOT = 500

export function winTier(payout: number): WinTier {
  if (payout >= JACKPOT) return 'jackpot'
  if (payout >= BIG_WIN) return 'big'
  return 'win'
}
