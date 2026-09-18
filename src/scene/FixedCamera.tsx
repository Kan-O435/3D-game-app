import { PerspectiveCamera } from '@react-three/drei'

// Deliberately fixed — no OrbitControls or any other way to move the view.
// The player stands in front of the cabinet and that's the whole game.
export function FixedCamera() {
  return (
    <PerspectiveCamera
      makeDefault
      position={[0, 1.6, 3]}
      fov={50}
      onUpdate={(camera) => camera.lookAt(0, 1.15, 0)}
    />
  )
}
