import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { useGameStore } from '../store/gameStore'
import { moodState } from './moodState'

const REST = { x: 0, y: 1.6, z: 3 } as const
const LOOK_AT = { x: 0, y: 1.15, z: 0 } as const

// Deliberately fixed — no OrbitControls or any other way for the *player* to
// move the view. The camera itself is never perfectly still though: a slow
// breathing sway, a tremble that grows with the mood, and a short kick when a
// spin pays out. It always re-aims at the cabinet, so the framing never drifts.
export function FixedCamera() {
  const kick = useRef(0)

  useEffect(
    () =>
      useGameStore.subscribe((s, prev) => {
        // A spin just finished (isSpinning true -> false) and it paid.
        if (prev.isSpinning && !s.isSpinning && s.lastPayout > 0) {
          kick.current = Math.min(1, 0.3 + s.lastPayout / 40)
        }
      }),
    [],
  )

  useFrame(({ camera, clock }, dt) => {
    const t = clock.elapsedTime
    const m = moodState.value
    kick.current = Math.max(0, kick.current - dt * 2.5)

    const tremble = 0.0015 + 0.006 * m * m
    const jitter = Math.sin(t * 47) * Math.sin(t * 31)
    camera.position.set(
      REST.x + Math.sin(t * 0.6) * 0.01 + jitter * tremble,
      REST.y + Math.sin(t * 0.9) * 0.008 + Math.sin(t * 60) * kick.current * 0.02,
      REST.z + Math.sin(t * 0.45) * 0.006,
    )
    camera.lookAt(LOOK_AT.x, LOOK_AT.y, LOOK_AT.z)
  })

  return <PerspectiveCamera makeDefault position={[REST.x, REST.y, REST.z]} fov={50} />
}
