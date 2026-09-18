// Dim room, bright cabinet: a weak cool ambient fill plus one warm spotlight
// aimed at the cabinet (which sits at/near the origin). No target is wired up
// explicitly — the spotlight's default target is the world origin, which is
// close enough to the cabinet's base for this phase.
export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.15} color="#2a2a35" />
      <spotLight
        position={[0, 3.2, 1.2]}
        angle={0.5}
        penumbra={0.5}
        intensity={15}
        distance={10}
        color="#ffe9c2"
      />
    </>
  )
}
