import { useMemo, type Ref } from 'react'
import { Object3D, type SpotLight } from 'three'
import type { ThreeElements } from '@react-three/fiber'

type SpotProps = Omit<ThreeElements['spotLight'], 'target' | 'ref'>

// A spotlight that actually points where you say. Three's SpotLight aims at its
// `target` object, and that object only takes effect if it lives in the scene
// graph — so this adds one next to the light instead of leaving it dangling.
export function AimedSpot({ aim, ref, ...props }: SpotProps & { aim: [number, number, number]; ref?: Ref<SpotLight> }) {
  const target = useMemo(() => new Object3D(), [])
  return (
    <>
      <spotLight ref={ref} target={target} {...props} />
      <primitive object={target} position={aim} />
    </>
  )
}
