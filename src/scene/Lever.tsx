import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { leverAngle } from './motion'
import { useGameStore } from '../store/gameStore'
import { pressPush } from '../store/actions'

// The lever on the machine's right side. Clicking it does what the red button
// does; whenever a spin starts (by any means) it gets yanked toward the camera
// and springs back.
export function Lever({ position }: { position: [number, number, number] }) {
  const pivot = useRef<Group>(null)
  const pullAt = useRef(-100)
  const pending = useRef(false)

  useEffect(
    () =>
      useGameStore.subscribe((s, prev) => {
        // Note the pull; the frame loop stamps it with the scene clock.
        if (s.isSpinning && !prev.isSpinning) pending.current = true
      }),
    [],
  )

  useFrame(({ clock }) => {
    const now = clock.elapsedTime
    if (pending.current) {
      pending.current = false
      pullAt.current = now
    }
    if (pivot.current) pivot.current.rotation.x = -0.12 + leverAngle(now - pullAt.current)
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
