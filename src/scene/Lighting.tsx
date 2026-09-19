import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, type Mesh, type MeshBasicMaterial, type PointLight, type SpotLight } from 'three'
import { heartbeatBpm } from '../game'
import { AimedSpot } from './AimedSpot'
import { moodState } from './moodState'

const BASE_SPOT_INTENSITY = 30
// Where the bare bulb hangs: high and to the left of the machine, like the reference.
const BULB: [number, number, number] = [-1.15, 2.85, 1.3]
const WARM = new Color('#ffe9c2')
const RED = new Color('#ff3b24')

// Dim room, bright cabinet: a weak cool ambient fill plus one warm spotlight
// aimed at the cabinet (which sits at/near the origin) — hung from a bare bulb
// you can see. The bulb flickers, more and more as the mood rises, and a red
// fill light pulses at heartbeat speed once turns are running out. All of it
// is mutated per frame through refs (no React re-renders).
export function Lighting() {
  const spot = useRef<SpotLight>(null)
  const bulb = useRef<Mesh>(null)
  const red = useRef<PointLight>(null)
  const level = useRef(1)

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    const m = moodState.value

    // Steady shimmer plus occasional brownout dips (rarer at low mood).
    const shimmer = Math.sin(t * 13.1) * Math.sin(t * 7.3) * 0.04 * (1 + m * 4)
    const dipping = Math.sin(t * 2.3) + Math.sin(t * 3.7) + Math.sin(t * 5.1) > 2.35 - m * 1.1
    level.current += ((dipping ? 0.25 : 1) - level.current) * Math.min(1, dt * 25)
    const k = Math.max(0, level.current * (1 + shimmer))

    if (spot.current) {
      spot.current.intensity = BASE_SPOT_INTENSITY * k
      spot.current.color.copy(WARM).lerp(RED, m * 0.6)
    }
    if (bulb.current) {
      const material = bulb.current.material as MeshBasicMaterial
      material.color.copy(WARM).lerp(RED, m * 0.6).multiplyScalar(Math.min(1, 0.15 + k))
    }
    if (red.current) {
      const beat = Math.max(0, Math.sin((t * heartbeatBpm(m) * Math.PI) / 30)) ** 6
      red.current.intensity = m * 7 * (0.25 + 0.75 * beat)
    }
  })

  return (
    <>
      <ambientLight intensity={0.5} color="#3a4560" />
      <AimedSpot
        ref={spot}
        position={BULB}
        aim={[0.1, 1.1, 0]}
        angle={0.62}
        penumbra={0.7}
        intensity={BASE_SPOT_INTENSITY}
        distance={12}
        color="#ffe9c2"
      />
      <pointLight ref={red} position={[0, 2.2, 2.2]} color="#ff2a1a" intensity={0} distance={8} />
      {/* a low fill in front of the machine so its face never goes fully black */}
      <pointLight position={[0.2, 1.5, 2.0]} color="#ffd9b0" intensity={2.2} distance={5} />

      {/* the bulb itself + its cord up to the ceiling (room is 3.2 high) */}
      <mesh ref={bulb} position={BULB}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color="#ffe9c2" />
      </mesh>
      <mesh position={[BULB[0], (BULB[1] + 3.2) / 2, BULB[2]]}>
        <cylinderGeometry args={[0.006, 0.006, 3.2 - BULB[1], 6]} />
        <meshBasicMaterial color="#0a0808" />
      </mesh>
    </>
  )
}
