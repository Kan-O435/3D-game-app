import { initAudio } from '../audio/audioEngine'
import { useGameStore } from './gameStore'

// "Press the big red button": what PUSH means on the current screen. Shared by
// the 3D button / lever and the keyboard. It's the first guaranteed user
// gesture, so it also starts/resumes audio (browser autoplay policy).
export function pressPush(): void {
  const s = useGameStore.getState()
  if (s.status === 'title') {
    initAudio()
    s.startRun()
  } else if (s.status === 'playing') {
    initAudio()
    s.spin()
  }
}
