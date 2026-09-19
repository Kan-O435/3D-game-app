import { useMemo } from 'react'
import { AdditiveBlending, DoubleSide } from 'three'
import { glowCanvas, noiseCanvas, toTexture, windowCanvas } from './canvasTextures'
import { AimedSpot } from './AimedSpot'
import { ROOM } from './roomLayout'

const BACK = ROOM.minZ // z of the back wall

// Set dressing: the barred window and its blue light, a bucket, crates, pipes,
// and the two stations the camera visits off the machine (order wall on the
// left, exchange counter on the right — see FixedCamera). All crude on purpose;
// real art comes with the theme decision (docs/NOTES.md).
export function Props() {
  const windowTexture = useMemo(() => toTexture(windowCanvas()), [])
  const glow = useMemo(() => toTexture(glowCanvas(), { smooth: true }), [])
  const crate = useMemo(() => toTexture(noiseCanvas(32, '#3b2c20', ['#2a1e15', '#4a3828', '#1e150e'], 200, 11)), [])
  const metal = useMemo(() => toTexture(noiseCanvas(32, '#3c4650', ['#2d353d', '#4a5560', '#252b31'], 160, 5)), [])

  return (
    <>
      {/* ---- barred window on the back wall, with the blue light it lets in ---- */}
      <mesh position={[1.25, 2.05, BACK + 0.01]}>
        <planeGeometry args={[0.8, 0.6]} />
        <meshBasicMaterial map={windowTexture} toneMapped={false} />
      </mesh>
      {/* soft glow on the wall around/below the window, and a pool on the floor */}
      <mesh position={[1.1, 1.3, BACK + 0.02]}>
        <planeGeometry args={[2.4, 2.8]} />
        <meshBasicMaterial map={glow} color="#3f78c8" transparent opacity={0.55} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[0.9, 0.012, -0.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.6, 2.2]} />
        <meshBasicMaterial map={glow} color="#3f78c8" transparent opacity={0.6} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      <AimedSpot position={[1.25, 2.2, BACK + 0.15]} aim={[0.5, 0, 0.6]} angle={0.7} penumbra={0.9} intensity={22} distance={6} color="#4d8be0" />

      {/* ---- bucket (with a puddle) ---- */}
      <mesh position={[-1.55, 0.16, 1.0]}>
        <cylinderGeometry args={[0.15, 0.12, 0.32, 14, 1, true]} />
        <meshStandardMaterial map={metal} roughness={0.8} side={DoubleSide} />
      </mesh>
      <mesh position={[-1.55, 0.011, 1.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.32, 20]} />
        <meshBasicMaterial color="#1c2a33" transparent opacity={0.6} />
      </mesh>

      {/* ---- crates stacked in the back-left corner ---- */}
      <mesh position={[-1.7, 0.3, -1.0]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial map={crate} roughness={1} />
      </mesh>
      <mesh position={[-1.3, 0.22, -0.75]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.44, 0.44, 0.44]} />
        <meshStandardMaterial map={crate} roughness={1} />
      </mesh>

      {/* ---- pipes along the ceiling and down the left wall ---- */}
      <mesh position={[-1.0, 3.0, BACK + 0.15]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 6.4, 10]} />
        <meshStandardMaterial map={metal} roughness={0.7} />
      </mesh>
      <mesh position={[ROOM.minX + 0.12, 1.6, -0.4]}>
        <cylinderGeometry args={[0.05, 0.05, 3.2, 10]} />
        <meshStandardMaterial map={metal} roughness={0.7} />
      </mesh>

      {/* ---- left wall: the order sheet + rules sheet ---- */}
      <mesh position={[ROOM.minX + 0.01, 1.65, 0.3]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.3, 1.8]} />
        <meshStandardMaterial color="#cfc8b3" />
      </mesh>
      <mesh position={[ROOM.minX + 0.01, 1.65, -1.0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.9, 1.5]} />
        <meshStandardMaterial color="#b9b39f" />
      </mesh>
      <pointLight position={[ROOM.minX + 1.4, 2.4, 0.4]} color="#ffe2b0" intensity={4} distance={5} />

      {/* ---- right wall: exchange counter, monitor and a board of slips ---- */}
      <mesh position={[ROOM.maxX - 0.5, 0.45, -0.5]}>
        <boxGeometry args={[1.0, 0.9, 2.4]} />
        <meshStandardMaterial map={crate} roughness={1} />
      </mesh>
      <mesh position={[ROOM.maxX - 0.55, 1.15, -0.05]} rotation={[0, -Math.PI / 2 + 0.25, 0]}>
        <boxGeometry args={[0.55, 0.42, 0.45]} />
        <meshStandardMaterial color="#1c1c18" emissive="#1d3a24" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[ROOM.maxX - 0.01, 1.7, -0.5]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[2.4, 1.3]} />
        <meshStandardMaterial color="#2b2a24" />
      </mesh>
      <pointLight position={[ROOM.maxX - 1.4, 2.3, -0.3]} color="#b8d8c0" intensity={1.6} distance={5} />
    </>
  )
}
