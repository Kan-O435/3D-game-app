import { ReelGrid } from './ReelGrid'

const WIDTH = 1.4
const HEIGHT = 1.9
const DEPTH = 0.5

export function Cabinet() {
  return (
    <group>
      <mesh position={[0, HEIGHT / 2, 0]}>
        <boxGeometry args={[WIDTH, HEIGHT, DEPTH]} />
        <meshStandardMaterial color="#2b2320" />
      </mesh>
      {/* meshBasicMaterial on the grid itself means it reads clearly even in
          this dim room, like a backlit real slot machine display would. */}
      <ReelGrid position={[0, HEIGHT * 0.62, DEPTH / 2 + 0.01]} />
    </group>
  )
}
