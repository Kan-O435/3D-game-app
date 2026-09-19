import { useGameStore } from './store/gameStore'

// Dev-only handle on the store (`window.__game.setState({...})`) so a screenshot
// script can jump straight to the shop, game over, etc. instead of playing there.
// The DEV guard lets the bundler drop it from production builds.
if (import.meta.env.DEV) {
  ;(window as unknown as { __game: typeof useGameStore }).__game = useGameStore
}
