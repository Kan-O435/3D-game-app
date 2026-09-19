import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, type Mesh, type MeshBasicMaterial, type Points } from 'three'
import type { LineWin } from '../game'
import { useGameStore } from '../store/gameStore'
import { CELL_SIZE, cellPosition } from './reelLayout'

// What a win looks like on the reels: the winning cells glow with sparkling
// corner marks, a light path is drawn through them cell by cell (the same shape
// as the pattern that hit), and pixel sparks fly off. Rendered inside the reel
// group so it uses the reels' local coordinates. Rate limits are *not* drawn
// here — ReelGrid tints those cells red instead.

const ROW_COLOR = '#ffd86b'
const PATTERN_COLOR = '#c77dff'
const SCATTER_COLOR = '#ff8ad8'
const LINE_THICKNESS = 0.018
const DRAW_SECONDS = 0.45
const PARTICLE_LIFE = 1.3
const PARTICLES_PER_CELL = 10

const colorFor = (win: LineWin) =>
  win.patternId === 'scatter' ? SCATTER_COLOR : win.patternId.startsWith('row-') ? ROW_COLOR : PATTERN_COLOR

export function WinEffects() {
  const isSpinning = useGameStore((s) => s.isSpinning)
  const lastWins = useGameStore((s) => s.lastWins)
  const spinsMade = useGameStore((s) => s.spinsMade)

  const paying = lastWins.length > 0 && !lastWins.some((w) => w.patternId === 'rate-limit')
  if (isSpinning || !paying) return null
  // Re-keyed per spin so every result replays its effect from the start.
  return <Burst key={spinsMade} wins={lastWins} />
}

interface Segment {
  x: number
  y: number
  length: number
  angle: number
  color: string
  // Where this segment sits in its path's draw-in (0..1 along the whole path).
  from: number
  to: number
}

function Burst({ wins }: { wins: LineWin[] }) {
  const time = useRef(0)
  const segmentMeshes = useRef<(Mesh | null)[]>([])
  const glowMeshes = useRef<(Mesh | null)[]>([])
  const cornerMeshes = useRef<(Mesh | null)[]>([])
  const particles = useRef<Points>(null)

  // Every winning cell once, with the colour of the first win that lit it.
  const cells = useMemo(() => {
    const seen = new Map<number, string>()
    for (const win of wins) for (const cell of win.cells) if (!seen.has(cell)) seen.set(cell, colorFor(win))
    return [...seen.entries()].map(([index, color]) => ({ index, color, pos: cellPosition(index) }))
  }, [wins])

  // The light path: one thin bar per hop between consecutive cells of a run.
  const segments = useMemo(() => {
    const out: Segment[] = []
    for (const win of wins) {
      if (win.patternId === 'scatter' || win.cells.length < 2) continue
      const points = win.cells.map(cellPosition)
      const hops = points.length - 1
      for (let i = 0; i < hops; i++) {
        const [x0, y0] = points[i]
        const [x1, y1] = points[i + 1]
        out.push({
          x: x0,
          y: y0,
          length: Math.hypot(x1 - x0, y1 - y0),
          angle: Math.atan2(y1 - y0, x1 - x0),
          color: colorFor(win),
          from: i / hops,
          to: (i + 1) / hops,
        })
      }
    }
    return out
  }, [wins])

  // Sparks: a fixed pool with a velocity each, all released together.
  const sparks = useMemo(() => makeSparks(cells), [cells])

  useFrame((_, dt) => {
    time.current += dt
    const t = time.current
    stepSegments(segmentMeshes.current, segments, t)
    stepGlow(glowMeshes.current, cornerMeshes.current, t)
    stepSparks(particles.current, sparks, t, dt)
  })

  return (
    <group position={[0, 0, 0.012]}>
      {cells.map((cell, i) => (
        <group key={cell.index} position={[cell.pos[0], cell.pos[1], 0]}>
          {/* soft glow over the whole cell */}
          <mesh
            ref={(el) => {
              glowMeshes.current[i] = el
            }}
          >
            <planeGeometry args={[CELL_SIZE, CELL_SIZE]} />
            <meshBasicMaterial color={cell.color} transparent opacity={0.25} blending={AdditiveBlending} depthWrite={false} />
          </mesh>
          {/* four sparkling corner marks */}
          {[
            [-1, 1],
            [1, 1],
            [-1, -1],
            [1, -1],
          ].map(([sx, sy], k) => (
            <mesh
              key={k}
              position={[sx * (CELL_SIZE / 2 - 0.012), sy * (CELL_SIZE / 2 - 0.012), 0.004]}
              ref={(el) => {
                cornerMeshes.current[i * 4 + k] = el
              }}
            >
              <planeGeometry args={[0.036, 0.036]} />
              <meshBasicMaterial color="#fff6c8" transparent blending={AdditiveBlending} depthWrite={false} />
            </mesh>
          ))}
        </group>
      ))}

      {segments.map((seg, i) => (
        <mesh
          key={i}
          position={[seg.x, seg.y, 0.008]}
          rotation={[0, 0, seg.angle]}
          ref={(el) => {
            segmentMeshes.current[i] = el
          }}
          scale={[0.0001, 1, 1]}
        >
          <planeGeometry args={[1, LINE_THICKNESS]} />
          <meshBasicMaterial color={seg.color} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}

      <points ref={particles} geometry={sparks.geometry}>
        <pointsMaterial size={0.02} vertexColors transparent blending={AdditiveBlending} depthWrite={false} sizeAttenuation />
      </points>
    </group>
  )
}

// The path grows cell by cell over DRAW_SECONDS, then throbs.
function stepSegments(meshes: (Mesh | null)[], segments: Segment[], t: number) {
  const progress = Math.min(1, t / DRAW_SECONDS)
  const throb = 0.75 + 0.25 * Math.sin(t * 9)
  segments.forEach((seg, i) => {
    const mesh = meshes[i]
    if (!mesh) return
    const local = Math.min(1, Math.max(0, (progress - seg.from) / (seg.to - seg.from)))
    const length = seg.length * local
    // The bar's geometry is 1 long, centred on its position: slide it so its
    // start stays pinned at the segment's first cell while it grows.
    mesh.position.x = seg.x + Math.cos(seg.angle) * (length / 2)
    mesh.position.y = seg.y + Math.sin(seg.angle) * (length / 2)
    mesh.scale.x = Math.max(0.0001, length)
    ;(mesh.material as MeshBasicMaterial).opacity = local > 0 ? throb : 0
  })
}

function stepGlow(glows: (Mesh | null)[], corners: (Mesh | null)[], t: number) {
  glows.forEach((mesh, i) => {
    if (mesh) (mesh.material as MeshBasicMaterial).opacity = 0.18 + 0.14 * Math.sin(t * 7 + i)
  })
  corners.forEach((mesh, i) => {
    if (!mesh) return
    const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(t * 8 + i * 1.7))
    ;(mesh.material as MeshBasicMaterial).opacity = twinkle
    mesh.scale.setScalar(0.7 + 0.5 * twinkle)
  })
}

function stepSparks(points: Points | null, sparks: { geometry: BufferGeometry; positions: Float32Array; velocities: Float32Array }, t: number, dt: number) {
  if (!points) return
  const { positions, velocities } = sparks
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] += velocities[i] * dt
    positions[i + 1] += velocities[i + 1] * dt
    positions[i + 2] += velocities[i + 2] * dt
    velocities[i + 1] -= 0.55 * dt // a little gravity
  }
  ;(sparks.geometry.getAttribute('position') as BufferAttribute).needsUpdate = true
  const material = points.material as { opacity: number }
  material.opacity = Math.max(0, 1 - t / PARTICLE_LIFE)
}

interface Cell {
  index: number
  color: string
  pos: [number, number]
}

// Kept out of the component so the randomness isn't part of rendering.
function makeSparks(cells: Cell[], random: () => number = Math.random) {
  const count = cells.length * PARTICLES_PER_CELL
  const positions = new Float32Array(count * 3)
  const velocities = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const white = new Color('#ffffff')
  const tint = new Color()
  cells.forEach((cell, c) => {
    tint.set(cell.color).lerp(white, 0.4)
    for (let k = 0; k < PARTICLES_PER_CELL; k++) {
      const i = (c * PARTICLES_PER_CELL + k) * 3
      positions[i] = cell.pos[0] + (random() - 0.5) * CELL_SIZE * 0.6
      positions[i + 1] = cell.pos[1] + (random() - 0.5) * CELL_SIZE * 0.6
      positions[i + 2] = 0.02
      const angle = random() * Math.PI * 2
      const speed = 0.25 + random() * 0.45
      velocities[i] = Math.cos(angle) * speed
      velocities[i + 1] = Math.sin(angle) * speed + 0.15
      velocities[i + 2] = random() * 0.2
      colors[i] = tint.r
      colors[i + 1] = tint.g
      colors[i + 2] = tint.b
    }
  })
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('color', new BufferAttribute(colors, 3))
  return { geometry, positions, velocities }
}
