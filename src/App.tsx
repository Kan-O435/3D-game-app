import { Canvas } from '@react-three/fiber'
import { Scene } from './scene/Scene'
import { SpinButton } from './ui/SpinButton'
import { MuteButton } from './ui/MuteButton'
import { Hud } from './ui/Hud'
import { Marquee } from './ui/Marquee'
import { Callouts } from './ui/Callouts'
import { GameOverScreen } from './ui/GameOverScreen'
import { Shop } from './ui/Shop'
import { OrderSheet } from './ui/OrderSheet'
import { PayoutTable } from './ui/PayoutTable'
import { Hotkeys } from './ui/Hotkeys'

export default function App() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas>
        <Scene />
      </Canvas>
      <Marquee />
      <Hud />
      <Callouts />
      <PayoutTable />
      <SpinButton />
      <MuteButton />
      <OrderSheet />
      <Shop />
      <GameOverScreen />
      <Hotkeys />
    </div>
  )
}