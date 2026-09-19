import { Canvas } from '@react-three/fiber'
import { Scene } from './scene/Scene'
import { MuteButton } from './ui/MuteButton'
import { CharmList } from './ui/CharmList'
import { Callouts } from './ui/Callouts'
import { Radio } from './ui/Radio'
import { PayPrompt } from './ui/PayPrompt'
import { GameOverScreen } from './ui/GameOverScreen'
import { Shop } from './ui/Shop'
import { OrderSheet } from './ui/OrderSheet'
import { PayoutTable } from './ui/PayoutTable'
import { Hotkeys } from './ui/Hotkeys'

// Screen pixels per rendered pixel. The 3D view is drawn at 1/PIXEL_SIZE
// resolution and scaled up with nearest-neighbour (see index.css), which gives
// the chunky low-res CRT look of the reference (and is cheaper to render).
const PIXEL_SIZE = 2

export default function App() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas dpr={1 / PIXEL_SIZE}>
        <Scene />
      </Canvas>
      <CharmList />
      <Callouts />
      <PayPrompt />
      <Radio />
      <PayoutTable />
      <MuteButton />
      <OrderSheet />
      <Shop />
      <GameOverScreen />
      <Hotkeys />
    </div>
  )
}