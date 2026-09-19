// The two off-machine stations the camera visits (see FixedCamera): a wall with
// the stage order pinned to it on the left, and the exchange counter on the
// right. Deliberately crude — the readable content (order text, shop cards) is
// the DOM overlay; these are just enough set dressing that the camera move has
// somewhere to go. Real art comes with the theme decision (docs/NOTES.md).
export function Props() {
  return (
    <>
      {/* left wall: order sheet + rules sheet */}
      <mesh position={[-4.96, 1.65, 0.3]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.3, 1.8]} />
        <meshStandardMaterial color="#cfc8b3" />
      </mesh>
      <mesh position={[-4.96, 1.65, -1.2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.9, 1.5]} />
        <meshStandardMaterial color="#b9b39f" />
      </mesh>
      <pointLight position={[-3.6, 2.5, 0.5]} color="#ffe2b0" intensity={4} distance={6} />

      {/* right wall: counter, monitor, and a board of item slips */}
      <mesh position={[4.35, 0.45, -0.6]}>
        <boxGeometry args={[1.2, 0.9, 2.6]} />
        <meshStandardMaterial color="#2a1f1a" />
      </mesh>
      <mesh position={[4.3, 1.15, -0.1]} rotation={[0, -Math.PI / 2 + 0.25, 0]}>
        <boxGeometry args={[0.55, 0.42, 0.45]} />
        <meshStandardMaterial color="#1c1c18" emissive="#1d3a24" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[4.96, 1.7, -0.6]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[2.4, 1.3]} />
        <meshStandardMaterial color="#2b2a24" />
      </mesh>
      <pointLight position={[3.4, 2.3, -0.3]} color="#9fe6b0" intensity={3} distance={6} />
    </>
  )
}
