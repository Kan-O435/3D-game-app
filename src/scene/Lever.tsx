import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { useGameStore } from '../store/gameStore'
import { pressPush } from '../store/actions'

// The lever on the machine's right side. Clicking it does what the red button
// does; whenever a spin starts (by any means) it gets yanked toward the camera
// and springs back.
export function Lever({ position }: { position: [number, number, number] }) {
  const pivot = useRef<Group>(null)
  const pull = useRef(0)

  useEffect(
    () =>
      useGameStore.subscribe((s, prev) => {
        if (s.isSpinning && !prev.isSpinning) pull.current = 1
      }),
    [],
  )

  useFrame((_, dt) => {
    pull.current = Math.max(0, pull.current - dt * 1.6)
    // Snap down fast, then ease back: sin(pi * t) over the decay.
    const angle = -0.12 + Math.sin(Math.PI * (1 - pull.current)) * (pull.current > 0 ? 0.95 : 0)
    if (pivot.current) pivot.current.rotation.x = angle
  })

  return (
    <group position={position}>
      {/* bracket on the cabinet side */}
      <mesh>
        <boxGeometry args={[0.1, 0.14, 0.14]} />
        <meshStandardMaterial color="#1c1714" roughness={0.6} metalness={0.4} />
      </mesh>
      <group ref={pivot}>
        <mesh position={[0, 0.34, 0]}>
          <cylinderGeometry args={[0.02, 0.026, 0.68, 10]} />
          <meshStandardMaterial color="#8d949b" roughness={0.35} metalness={0.8} />
        </mesh>
        <mesh
          position={[0, 0.72, 0]}
          onClick={(e) => {
            e.stopPropagation()
            pressPush()
          }}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = '')}
        >
          <sphereGeometry args={[0.085, 18, 14]} />
          <meshStandardMaterial color="#c8281c" roughness={0.25} emissive="#5a0d08" emissiveIntensity={0.6} />
        </mesh>
      </group>
    </group>
  )
}
