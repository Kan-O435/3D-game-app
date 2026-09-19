import { Canvas } from '@react-three/fiber'
import { Scene } from './scene/Scene'
import { SpinButton } from './ui/SpinButton'
import { MuteButton } from './ui/MuteButton'
import { Hud } from './ui/Hud'
import { GameOverScreen } from './ui/GameOverScreen'

export default function App() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas>
        <Scene />
      </Canvas>
      <Hud />
      <SpinButton />
      <MuteButton />
      <GameOverScreen />
    </div>
  )
}