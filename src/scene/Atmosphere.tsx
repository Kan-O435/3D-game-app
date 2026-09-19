import { useEffect, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { ChromaticAberration, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { Vector2 } from 'three'
import { tensionFor, heartbeatBpm } from '../game'
import { useGameStore } from '../store/gameStore'
import { setHeartbeat } from '../audio/audioEngine'
import { moodState } from './moodState'

// Fog, the post-processing stack, and the heartbeat. Everything scales with
// the shared mood (see moodState.ts): the vignette closes in, grain and colour
// fringing grow. Kept as one component so the "atmosphere" knobs live together.
export function Atmosphere() {
  // Heartbeat only while playing and turns are actually running low — the
  // slow stage "dread" alone stays silent.
  const tension = useGameStore((s) => (s.status === 'playing' ? tensionFor(s.turnsLeft) : 0))
  useEffect(() => {
    setHeartbeat(tension > 0 ? heartbeatBpm(tension) : 0)
    return () => setHeartbeat(0)
  }, [tension])

  // Effect props are React props, so follow the smoothed mood in coarse steps
  // (0.02) — enough to look continuous, few enough not to re-render every frame.
  const [level, setLevel] = useState(0)
  useFrame(() => {
    const q = Math.round(moodState.value * 50) / 50
    if (q !== level) setLevel(q)
  })

  const fringe = useMemo(() => new Vector2(0.0004 + 0.0025 * level, 0.0004 + 0.0025 * level), [level])

  return (
    <>
      <color attach="background" args={['#050305']} />
      <fogExp2 attach="fog" args={['#050305', 0.06]} />
      <EffectComposer>
        <Vignette offset={0.3} darkness={0.55 + 0.4 * level} />
        <Noise opacity={0.05 + 0.1 * level} />
        <ChromaticAberration offset={fringe} radialModulation={false} modulationOffset={0} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  )
}
