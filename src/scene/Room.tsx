import { useMemo } from 'react'
import { BackSide, MeshStandardMaterial } from 'three'
import { floorCanvas, toTexture, wallCanvas } from './canvasTextures'
import { ROOM } from './roomLayout'

// The cell. Built from the inside: a box rendered with BackSide so we see its
// inner faces. Floor at y = 0 (dimensions in roomLayout.ts).
const WIDTH = ROOM.maxX - ROOM.minX
const DEPTH = ROOM.maxZ - ROOM.minZ

export function Room() {
  // BoxGeometry face order: +x, -x, +y (ceiling), -y (floor), +z, -z.
  const materials = useMemo(() => {
    const wall = (repeatX: number, repeatY: number) =>
      new MeshStandardMaterial({ map: toTexture(wallCanvas(), { repeat: [repeatX, repeatY] }), roughness: 1, side: BackSide })
    const floor = new MeshStandardMaterial({
      map: toTexture(floorCanvas(), { repeat: [WIDTH * 1.6, DEPTH * 1.6] }),
      roughness: 1,
      side: BackSide,
    })
    const ceiling = new MeshStandardMaterial({ color: '#15110f', roughness: 1, side: BackSide })
    return [wall(DEPTH, 2), wall(DEPTH, 2), ceiling, floor, wall(WIDTH, 2), wall(WIDTH, 2)]
  }, [])

  return (
    <mesh position={[(ROOM.minX + ROOM.maxX) / 2, ROOM.height / 2, (ROOM.minZ + ROOM.maxZ) / 2]} material={materials}>
      <boxGeometry args={[WIDTH, ROOM.height, DEPTH]} />
    </mesh>
  )
}
