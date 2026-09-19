import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/dotgothic16'
import './index.css'
import App from './App.tsx'
import './devtools'

// Text drawn onto 3D canvases (signs, slips) can't wait for the browser to fetch
// the pixel font lazily the way DOM text does, so load it — including the few
// Japanese glyphs the canvases use — before the scene is built. Capped so a slow
// network never blocks the game.
const CANVAS_GLYPHS = '納付伝票して退場炎上マーク混入中'
const fontsLoaded = Promise.all([
  document.fonts.load('16px DotGothic16'),
  document.fonts.load('16px DotGothic16', CANVAS_GLYPHS),
]).catch(() => undefined)
const timeout = new Promise((resolve) => setTimeout(resolve, 2500))

Promise.race([fontsLoaded, timeout]).then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
