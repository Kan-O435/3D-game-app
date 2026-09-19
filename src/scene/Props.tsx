import { useMemo } from 'react'
import { AdditiveBlending, DoubleSide } from 'three'
import { glowCanvas, noiseCanvas, toTexture, windowCanvas } from './canvasTextures'
import { exchangeSignCanvas, idolPosterCanvas, monitorCanvas, noteCanvas, plateCanvas, rulesCanvas, slipsBoardCanvas, workOrderCanvas } from './propCanvases'
import { AimedSpot } from './AimedSpot'
import { ROOM } from './roomLayout'

const BACK = ROOM.minZ // z of the back wall
const WINDOW_X = 2.05 // the barred window sits well to the right of the machine

// Set dressing: the barred window and its blue light, a bucket, crates, pipes,
// and the two stations the camera visits off the machine (order wall on the
// left, exchange counter on the right — see FixedCamera). Simple shapes with
// procedural paper/text textures; real art comes with the theme decision
// (docs/NOTES.md).
export function Props() {
  const windowTexture = useMemo(() => toTexture(windowCanvas()), [])
  const glow = useMemo(() => toTexture(glowCanvas(), { smooth: true }), [])
  const crate = useMemo(() => toTexture(noiseCanvas(32, '#3b2c20', ['#2a1e15', '#4a3828', '#1e150e'], 200, 11)), [])
  const paperTextures = useMemo(
    () => ({
      order: toTexture(workOrderCanvas()),
      rules: toTexture(rulesCanvas()),
      notes: [61, 62, 63].map((seed) => toTexture(noteCanvas(seed))),
      board: toTexture(slipsBoardCanvas()),
      sign: toTexture(exchangeSignCanvas()),
      idol: toTexture(idolPosterCanvas()),
      monitor: toTexture(monitorCanvas()),
      reroll: toTexture(plateCanvas('REROLL', '#8a2a20', '#f4e1d8')),
      next: toTexture(plateCanvas('NEXT', '#3a3a3a', '#e6e0d0')),
    }),
    [],
  )
  const metal = useMemo(() => toTexture(noiseCanvas(32, '#3c4650', ['#2d353d', '#4a5560', '#252b31'], 160, 5)), [])

  return (
    <>
      {/* ---- barred window on the back wall, with the blue light it lets in ---- */}
      <mesh position={[WINDOW_X, 2.05, BACK + 0.01]}>
        <planeGeometry args={[0.8, 0.6]} />
        <meshBasicMaterial map={windowTexture} toneMapped={false} />
      </mesh>
      {/* soft glow on the wall around/below the window, and a pool on the floor */}
      <mesh position={[WINDOW_X - 0.15, 1.3, BACK + 0.02]}>
        <planeGeometry args={[2.4, 2.8]} />
        <meshBasicMaterial map={glow} color="#3f78c8" transparent opacity={0.55} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[WINDOW_X - 0.35, 0.012, -0.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.6, 2.2]} />
        <meshBasicMaterial map={glow} color="#3f78c8" transparent opacity={0.6} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      <AimedSpot position={[WINDOW_X, 2.2, BACK + 0.15]} aim={[WINDOW_X - 0.75, 0, 0.6]} angle={0.7} penumbra={0.9} intensity={22} distance={6} color="#4d8be0" />

      {/* ---- the idol poster on the back wall, lit pink ---- */}
      <mesh position={[-1.85, 1.75, BACK + 0.012]}>
        <planeGeometry args={[0.72, 1.02]} />
        <meshBasicMaterial map={paperTextures.idol} toneMapped={false} />
      </mesh>
      <pointLight position={[-1.85, 1.8, BACK + 0.6]} color="#ff7ab8" intensity={2.2} distance={3} />

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

      {/* ---- left wall: the order sheet, the rules sheet and a few pinned scraps ---- */}
      <group position={[ROOM.minX + 0.01, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[-0.3, 1.65, 0]}>
          <planeGeometry args={[1.1, 1.45]} />
          <meshStandardMaterial map={paperTextures.order} roughness={1} />
        </mesh>
        <mesh position={[1.0, 1.6, 0.002]}>
          <planeGeometry args={[0.8, 1.2]} />
          <meshStandardMaterial map={paperTextures.rules} roughness={1} />
        </mesh>
        {[
          [-1.5, 1.95, 0.05],
          [-1.55, 1.4, -0.04],
          [0.45, 1.05, 0.03],
        ].map(([x, y, tilt], i) => (
          <mesh key={i} position={[x, y, 0.004]} rotation={[0, 0, tilt]}>
            <planeGeometry args={[0.25, 0.3]} />
            <meshStandardMaterial map={paperTextures.notes[i]} roughness={1} />
          </mesh>
        ))}
        {/* strips of tape holding the order up */}
        {[-0.75, 0.15].map((x) => (
          <mesh key={x} position={[x, 2.36, 0.004]}>
            <planeGeometry args={[0.16, 0.06]} />
            <meshStandardMaterial color="#c9b45a" transparent opacity={0.8} roughness={1} />
          </mesh>
        ))}
      </group>
      <pointLight position={[ROOM.minX + 1.4, 2.4, 0.4]} color="#ffe2b0" intensity={4} distance={5} />

      {/* ---- right wall: the exchange counter — sign, board of slips, monitor, desk buttons ---- */}
      <mesh position={[ROOM.maxX - 0.5, 0.45, -0.5]}>
        <boxGeometry args={[1.0, 0.9, 2.4]} />
        <meshStandardMaterial map={crate} roughness={1} />
      </mesh>
      <group position={[ROOM.maxX - 0.55, 0.9, -0.1]} rotation={[0, -Math.PI / 2 + 0.25, 0]}>
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.55, 0.42, 0.45]} />
          <meshStandardMaterial color="#26241e" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.27, 0.2255]}>
          <planeGeometry args={[0.44, 0.34]} />
          <meshBasicMaterial map={paperTextures.monitor} toneMapped={false} />
        </mesh>
      </group>
      {[
        { z: -0.85, texture: paperTextures.reroll },
        { z: -0.55, texture: paperTextures.next },
      ].map(({ z, texture }) => (
        <mesh key={z} position={[ROOM.maxX - 0.75, 0.905, z]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
          <planeGeometry args={[0.24, 0.075]} />
          <meshStandardMaterial map={texture} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[ROOM.maxX - 0.01, 1.7, -0.5]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[2.4, 1.3]} />
        <meshStandardMaterial map={paperTextures.board} roughness={1} />
      </mesh>
      <mesh position={[ROOM.maxX - 0.012, 2.56, -0.5]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[1.1, 0.2]} />
        <meshBasicMaterial map={paperTextures.sign} toneMapped={false} />
      </mesh>
      <pointLight position={[ROOM.maxX - 1.4, 2.3, -0.3]} color="#c9dcc4" intensity={2} distance={5} />
    </>
  )
}
