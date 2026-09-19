import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { Vector3 } from 'three'
import { useGameStore, type GameStatus } from '../store/gameStore'
import { moodState } from './moodState'

interface Pose {
  position: Vector3
  lookAt: Vector3
}

// The three places the camera stands. The machine is home; the order sheet is
// pinned on the left wall and the exchange counter sits on the right.
const STATIONS = {
  machine: { position: new Vector3(0, 1.6, 3), lookAt: new Vector3(0, 1.15, 0) },
  order: { position: new Vector3(-2.3, 1.55, 1.0), lookAt: new Vector3(-4.9, 1.65, 0.3) },
  shop: { position: new Vector3(2.3, 1.5, 0.3), lookAt: new Vector3(4.9, 1.2, -0.6) },
} satisfies Record<string, Pose>

function stationFor(status: GameStatus): keyof typeof STATIONS {
  if (status === 'briefing') return 'order'
  if (status === 'shop') return 'shop'
  return 'machine'
}

// How quickly the camera settles onto a station (higher = snappier).
const TRAVEL_SPEED = 2.6

// Deliberately no way for the *player* to move the view — the game moves it
// between stations. It is never perfectly still though: a slow breathing sway,
// a tremble that grows with the mood, and a short kick when a spin pays out.
export function FixedCamera() {
  const kick = useRef(0)
  const base = useRef(STATIONS.machine.position.clone())
  const look = useRef(STATIONS.machine.lookAt.clone())

  useEffect(
    () =>
      useGameStore.subscribe((s, prev) => {
        // A spin just finished (isSpinning true -> false) and it paid.
        if (prev.isSpinning && !s.isSpinning && s.lastPayout > 0) {
          kick.current = Math.min(1, 0.3 + s.lastPayout / 200)
        }
      }),
    [],
  )

  useFrame(({ camera, clock }, dt) => {
    const t = clock.elapsedTime
    const m = moodState.value
    kick.current = Math.max(0, kick.current - dt * 2.5)

    // Glide (exponential ease) toward the station for the current status.
    const target = STATIONS[stationFor(useGameStore.getState().status)]
    const k = 1 - Math.exp(-dt * TRAVEL_SPEED)
    base.current.lerp(target.position, k)
    look.current.lerp(target.lookAt, k)

    const tremble = 0.0015 + 0.006 * m * m
    const jitter = Math.sin(t * 47) * Math.sin(t * 31)
    camera.position.set(
      base.current.x + Math.sin(t * 0.6) * 0.01 + jitter * tremble,
      base.current.y + Math.sin(t * 0.9) * 0.008 + Math.sin(t * 60) * kick.current * 0.02,
      base.current.z + Math.sin(t * 0.45) * 0.006,
    )
    camera.lookAt(look.current)
  })

  return <PerspectiveCamera makeDefault position={[0, 1.6, 3]} fov={50} />
}
