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
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        padding: '8px 14px',
        fontSize: 14,
        fontWeight: 700,
        background: '#222',
        color: '#fff',
        border: '1px solid #555',
        borderRadius: 6,
        cursor: 'pointer',
      }}
    >
      {muted ? 'UNMUTE' : 'MUTE'}
    </button>
  )
}
