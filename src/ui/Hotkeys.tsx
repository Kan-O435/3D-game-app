import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'
import { pressPush } from '../store/actions'

const HOLD_TO_SKIP_MS = 400

// Keyboard: Space/Enter is the "do the obvious thing" key for the current
// screen (start, accept the order, pull the lever, retry); in play Enter pays
// the debt early instead. 1-8 buy in the shop.
// The shop deliberately has no Space action so it can't skip the counter by
// accident.
export function Hotkeys() {
  // When Space went down, so a long press can be told from a tap.
  const spaceDownAt = useRef(0)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const s = useGameStore.getState()

      // While the reels spin: tap Space to stop the next reel, hold it to skip
      // the rest of the animation. (Holding the key that started the spin
      // counts too — a long press from the start skips straight to the result.)
      if (e.code === 'Space') {
        if (!e.repeat) spaceDownAt.current = performance.now()
        if (s.isSpinning) {
          e.preventDefault()
          if (e.repeat) {
            if (performance.now() - spaceDownAt.current > HOLD_TO_SKIP_MS) s.requestReelSkip()
          } else s.requestReelStop()
          return
        }
      }
      if (e.repeat) return

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        // A focused button would also "click" on Space release — drop focus.
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
        // While playing, Enter pays the debt early (when both requirements are
        // met) and Space pulls the lever; everywhere else they're interchangeable.
        if (s.status === 'playing' && e.code === 'Enter') s.payEarly()
        else if (s.status === 'title' || s.status === 'playing') pressPush()
        else if (s.status === 'briefing') s.acceptOrder()
        else if (s.status === 'gameOver' || s.status === 'cleared') s.restart()
        return
      }

      const digit = /^Digit([1-8])$/.exec(e.code)
      if (digit && s.status === 'shop') {
        const id = s.shopOffer[Number(digit[1]) - 1]
        if (id) s.buyCharm(id)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return null
}
