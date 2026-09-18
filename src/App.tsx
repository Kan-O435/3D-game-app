import { Canvas } from '@react-three/fiber'
import { Scene } from './scene/Scene'
import { SpinButton } from './ui/SpinButton'

export default function App() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas>
        <Scene />
      </Canvas>
      <SpinButton />
    </div>
  )
}