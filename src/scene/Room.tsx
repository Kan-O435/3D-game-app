import { BackSide } from 'three'

// Room is built from the inside: a box rendered with BackSide so we see its
// inner walls instead of culling them away as usual. Floor sits at y = 0.
const WIDTH = 10
const HEIGHT = 5
const DEPTH = 10

export function Room() {
  return (
    <mesh position={[0, HEIGHT / 2, 0]}>
      <boxGeometry args={[WIDTH, HEIGHT, DEPTH]} />
      <meshStandardMaterial color="#141013" side={BackSide} />
    </mesh>
  )
}
