import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import { useGameStore } from '../store/gameStore'
import { pressPush } from '../store/actions'
import { noiseCanvas, toTexture } from './canvasTextures'
import { ReelGrid } from './ReelGrid'
import { Lever } from './Lever'
import { motion, shake, thud, winHop } from './motion'
import { DisplayStrip, FeePlate, MarqueeSign, StagePlate, TerminalPlate, Ticker } from './MachineScreens'

// The slot machine, modelled after the reference's default screen: a lit sign on
// top, the framed reel window, an engraved plate and button row, the PUSH panel
// with its big red button and readout, a scrolling ticker on the base, and the
// lever on the right. Everything is built from boxes and canvas textures.
// The front face of the body is at z = FRONT; details sit just proud of it.
const WIDTH = 1.55
const FRONT = 0.25
const BODY_Y = 0.16 // bottom of the body (top of the plinth)
const BODY_H = 1.62

const BULBS = 11 // chase lights along the top of the sign

export function Cabinet() {
  const root = useRef<Group>(null)
  const rattle = useRef(0)
  const bodyTexture = useMemo(() => toTexture(noiseCanvas(32, '#57231d', ['#43190f', '#6a2c24', '#36140f', '#7a3a2c'], 260, 21), { repeat: [3, 5] }), [])
  const frameColor = '#15110e'

  // The whole machine has weight: it rattles while the reels spin, thumps as each
  // reel lands, hops after a win and shudders after a win or a rate limit. The
  // offsets come from event times in motion.ts, so there's no per-frame decay state.
  useFrame(({ clock }, dt) => {
    const group = root.current
    if (!group) return
    const now = clock.elapsedTime
    rattle.current += ((motion.spinning ? 1 : 0) - rattle.current) * Math.min(1, dt * 10)
    const landing = thud(now, motion.landings)
    const hop = winHop(now, motion.winAt, motion.winPower)
    const hit = Math.max(shake(now, motion.winAt, motion.winPower * 0.5), shake(now, motion.limitAt, 1.2))
    group.position.set(
      Math.sin(now * 71) * 0.0035 * rattle.current + Math.sin(now * 53) * 0.01 * hit,
      hop - landing * 0.014 + Math.sin(now * 83) * 0.002 * rattle.current + Math.sin(now * 61) * 0.008 * hit,
      0,
    )
    group.scale.y = 1 - landing * 0.004 + hop * 0.05
  })

  return (
    <group ref={root}>
      {/* plinth + body + sign box */}
      <mesh position={[0, BODY_Y / 2, 0.03]}>
        <boxGeometry args={[WIDTH + 0.22, BODY_Y, 0.62]} />
        <meshStandardMaterial color="#1c1512" roughness={0.9} />
      </mesh>
      <mesh position={[0, BODY_Y + BODY_H / 2, 0]}>
        <boxGeometry args={[WIDTH, BODY_H, FRONT * 2]} />
        <meshStandardMaterial map={bodyTexture} roughness={0.85} />
      </mesh>
      <mesh position={[0, BODY_Y + BODY_H + 0.17, 0.03]}>
        <boxGeometry args={[WIDTH, 0.34, FRONT * 2 + 0.06]} />
        <meshStandardMaterial color="#2a1613" roughness={0.8} />
      </mesh>
      <MarqueeSign position={[0, BODY_Y + BODY_H + 0.17, FRONT + 0.065]} />
      <ChaseBulbs y={BODY_Y + BODY_H + 0.355} z={FRONT + 0.04} />
      {/* the little red dome on top */}
      <mesh position={[0.02, BODY_Y + BODY_H + 0.37, 0.0]}>
        <sphereGeometry args={[0.05, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#b3261a" emissive="#5a0d08" emissiveIntensity={0.8} />
      </mesh>

      {/* plates above the reels */}
      <StagePlate position={[-0.42, 1.71, FRONT + 0.03]} />
      <FeePlate position={[0.45, 1.71, FRONT + 0.03]} />

      {/* reel window: dark frame, then the grid */}
      <mesh position={[0, 1.2, FRONT + 0.015]}>
        <boxGeometry args={[1.46, 0.86, 0.03]} />
        <meshStandardMaterial color={frameColor} roughness={0.7} />
      </mesh>
      <ReelGrid position={[0, 1.2, FRONT + 0.035]} />

      {/* engraved plate + a row of little buttons */}
      <TerminalPlate position={[0, 0.685, FRONT + 0.012]} />
      {[-0.42, -0.14, 0.14, 0.42].map((x, i) => (
        <mesh key={x} position={[x, 0.605, FRONT + 0.02]}>
          <boxGeometry args={[0.1, 0.05, 0.03]} />
          <meshStandardMaterial color={['#6b5a44', '#8a6a44', '#b03a2a', '#2f6a4a'][i]} roughness={0.5} />
        </mesh>
      ))}

      {/* the PUSH panel: frame, readout, big red button */}
      <mesh position={[0, 0.365, FRONT + 0.012]}>
        <boxGeometry args={[1.42, 0.4, 0.03]} />
        <meshStandardMaterial color={frameColor} roughness={0.6} />
      </mesh>
      <DisplayStrip position={[0.12, 0.365, FRONT + 0.03]} />
      <PushButton position={[-0.58, 0.365, FRONT + 0.03]} />

      <Ticker position={[0, 0.085, 0.03 + 0.31 + 0.002]} />
      <Lever position={[WIDTH / 2 + 0.05, 0.95, 0.04]} />
    </group>
  )
}

/** The big red button. Lit when pressing it would do something. */
function PushButton({ position }: { position: [number, number, number] }) {
  const cap = useRef<Mesh>(null)
  const material = useRef<MeshStandardMaterial>(null)

  useFrame(({ clock }) => {
    const s = useGameStore.getState()
    const live = s.status === 'title' || (s.status === 'playing' && !s.isSpinning && s.money >= s.spinCost)
    const pulse = live ? 0.55 + 0.45 * Math.sin(clock.elapsedTime * 4) : 0.05
    if (material.current) material.current.emissiveIntensity = pulse * (s.status === 'title' ? 1.2 : 0.8)
    // pressed in while the reels spin
    if (cap.current) cap.current.position.z = s.isSpinning ? -0.012 : 0
  })

  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.115, 0.115, 0.02, 20]} />
        <meshStandardMaterial color="#0e0b09" roughness={0.6} />
      </mesh>
      <mesh
        ref={cap}
        rotation={[Math.PI / 2, 0, 0]}
        onClick={(e) => {
          e.stopPropagation()
          pressPush()
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <cylinderGeometry args={[0.085, 0.09, 0.05, 20]} />
        <meshStandardMaterial ref={material} color="#c8281c" roughness={0.25} emissive="#ff3b24" emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}

/** Small bulbs along the top of the sign; they chase, faster while spinning. */
function ChaseBulbs({ y, z }: { y: number; z: number }) {
  const bulbs = useRef<(MeshStandardMaterial | null)[]>([])

  useFrame(({ clock }) => {
    const s = useGameStore.getState()
    const speed = s.isSpinning ? 9 : 2.2
    // right after a win the whole row strobes
    const strobing = clock.elapsedTime - motion.winAt < 1.4
    bulbs.current.forEach((m, i) => {
      if (!m) return
      m.emissiveIntensity = strobing
        ? Math.sin(clock.elapsedTime * 34 + (i % 2) * Math.PI) > 0 ? 1.6 : 0.12
        : 0.25 + 0.75 * Math.max(0, Math.sin(clock.elapsedTime * speed - i * 0.7))
    })
  })

  return (
    <>
      {Array.from({ length: BULBS }, (_, i) => (
        <mesh key={i} position={[-0.6 + (i * 1.2) / (BULBS - 1), y, z]}>
          <sphereGeometry args={[0.022, 8, 6]} />
          <meshStandardMaterial
            ref={(el) => {
              bulbs.current[i] = el
            }}
            color="#ffd66b"
            emissive="#ffb000"
            emissiveIntensity={0.6}
          />
        </mesh>
      ))}
    </>
  )
}
