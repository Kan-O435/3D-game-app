import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'
import { motion } from './motion'

// Coins spat out of the machine's tray after a win: they fly out toward the
// player, fall, bounce on the floor and fade. A fixed pool is recycled; how many
// spawn is decided by the win (motion.pendingCoins, see coinsFor).
const POOL = 40
const TRAY = { x: 0, y: 0.3, z: 0.38 } // where they come out
const GRAVITY = 6.5
const FLOOR_Y = 0.03
const BOUNCE = 0.45
const LIFE = 2.6

interface Coin {
  alive: boolean
  age: number
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  spin: number
}

const freshCoin = (): Coin => ({ alive: false, age: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, spin: 0 })

export function CoinBurst() {
  const coins = useRef<Coin[]>(Array.from({ length: POOL }, freshCoin))
  const meshes = useRef<(Mesh | null)[]>([])
  const material = useMemo(() => ({ color: '#ffd54a' }), [])

  useFrame((_, dt) => {
    // spawn what the last win asked for
    while (motion.pendingCoins > 0) {
      motion.pendingCoins--
      const coin = coins.current.find((c) => !c.alive)
      if (!coin) break
      spawn(coin)
    }
    coins.current.forEach((coin, i) => {
      const mesh = meshes.current[i]
      if (!mesh) return
      if (!coin.alive) {
        mesh.visible = false
        return
      }
      step(coin, Math.min(dt, 0.05))
      mesh.visible = coin.alive
      mesh.position.set(coin.x, coin.y, coin.z)
      mesh.rotation.x = coin.spin
      mesh.scale.setScalar(coin.age > LIFE - 0.5 ? Math.max(0.01, (LIFE - coin.age) / 0.5) : 1)
    })
  })

  return (
    <>
      {Array.from({ length: POOL }, (_, i) => (
        <mesh
          key={i}
          visible={false}
          ref={(el) => {
            meshes.current[i] = el
          }}
        >
          <cylinderGeometry args={[0.048, 0.048, 0.01, 14]} />
          <meshBasicMaterial color={material.color} toneMapped={false} />
        </mesh>
      ))}
    </>
  )
}

function spawn(coin: Coin, random: () => number = Math.random) {
  coin.alive = true
  coin.age = 0
  coin.x = TRAY.x + (random() - 0.5) * 0.5
  coin.y = TRAY.y
  coin.z = TRAY.z
  coin.vx = (random() - 0.5) * 1.8
  coin.vy = 2.6 + random() * 1.8
  coin.vz = 0.15 + random() * 0.7
  coin.spin = random() * Math.PI
}

function step(coin: Coin, dt: number) {
  coin.age += dt
  coin.vy -= GRAVITY * dt
  coin.x += coin.vx * dt
  coin.y += coin.vy * dt
  coin.z += coin.vz * dt
  coin.spin += 9 * dt
  if (coin.y < FLOOR_Y) {
    coin.y = FLOOR_Y
    coin.vy = Math.abs(coin.vy) * BOUNCE
    coin.vx *= 0.7
    coin.vz *= 0.7
  }
  if (coin.age >= LIFE) coin.alive = false
}
