import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { canPayEarly, useGameStore } from '../store/gameStore'
import { toTexture } from './canvasTextures'
import { paySlipCanvas } from './propCanvases'

const REST = { x: -1.12, y: 1.28, z: 0.32 }
const DROP_HEIGHT = 1.2 // how far above its resting place it starts
const STRING_LENGTH = 3

// The 納付伝票 (pay slip): once both requirements are met it drops on a string
// beside the machine and swings a little. Clicking it pays the debt early —
// the same as the gold button / Enter (see ui/PayPrompt.tsx).
export function PaySlip() {
  const payable = useGameStore((s) => canPayEarly(s))
  return payable ? <Slip /> : null
}

function Slip() {
  const group = useRef<Group>(null)
  const drop = useRef(0)
  const texture = useMemo(() => toTexture(paySlipCanvas()), [])
  const payEarly = useGameStore((s) => s.payEarly)

  useFrame(({ clock }, dt) => {
    drop.current = Math.min(1, drop.current + dt * 1.4)
    const eased = 1 - (1 - drop.current) ** 3
    if (!group.current) return
    group.current.position.set(REST.x, REST.y + (1 - eased) * DROP_HEIGHT, REST.z)
    // swings a bit while it settles, then just sways
    group.current.rotation.z = Math.sin(clock.elapsedTime * 1.6) * (0.03 + 0.12 * (1 - eased))
  })

  return (
    <group ref={group} position={[REST.x, REST.y + DROP_HEIGHT, REST.z]}>
      {/* the string, up out of frame */}
      <mesh position={[0, 0.22 + STRING_LENGTH / 2, 0]}>
        <cylinderGeometry args={[0.004, 0.004, STRING_LENGTH, 4]} />
        <meshBasicMaterial color="#2a2118" />
      </mesh>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          payEarly()
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <planeGeometry args={[0.3, 0.4]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  )
}
