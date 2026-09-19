import { Canvas } from '@react-three/fiber'
import { Scene } from './scene/Scene'
import { SpinButton } from './ui/SpinButton'
import { MuteButton } from './ui/MuteButton'

export default function App() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas>
        <Scene />
      </Canvas>
      <SpinButton />
      <MuteButton />
    </div>
  )
}