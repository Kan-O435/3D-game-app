import { useState } from 'react'
import { isMuted, setMuted } from '../audio/audioEngine'

export function MuteButton() {
  const [muted, setMutedState] = useState(isMuted())

  return (
    <button
      onClick={() => {
        const next = !muted
        setMuted(next)
        setMutedState(next)
      }}
      className="arcade-btn gray small"
      style={{ position: 'absolute', top: 16, right: 16 }}
    >
      {muted ? 'UNMUTE' : 'MUTE'}
    </button>
  )
}
