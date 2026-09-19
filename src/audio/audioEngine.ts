// Framework-agnostic Web Audio wrapper. No sound files — everything here is
// synthesized (oscillators + envelopes), same spirit as scene/icons.ts's
// placeholder textures: good enough to prove the plumbing works, not final
// content.

let audioContext: AudioContext | null = null
let masterGain: GainNode | null = null
let bgmGain: GainNode | null = null
let sfxGain: GainNode | null = null
let bgmStarted = false
let muted = false

const UNMUTED_VOLUME = 0.6

function ensureContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()

    masterGain = audioContext.createGain()
    masterGain.gain.value = muted ? 0 : UNMUTED_VOLUME
    masterGain.connect(audioContext.destination)

    bgmGain = audioContext.createGain()
    bgmGain.gain.value = 0.5
    bgmGain.connect(masterGain)

    sfxGain = audioContext.createGain()
    sfxGain.gain.value = 1
    sfxGain.connect(masterGain)
  }
  return audioContext
}

// Must be called from a user-gesture handler (browser autoplay policy blocks
// audio otherwise) — resumes the context and starts the BGM loop, once.
export function initAudio(): void {
  const ctx = ensureContext()
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
  if (!bgmStarted) {
    startBgm()
    bgmStarted = true
  }
}

export function setMuted(nextMuted: boolean): void {
  muted = nextMuted
  if (masterGain) {
    masterGain.gain.value = muted ? 0 : UNMUTED_VOLUME
  }
}

export function isMuted(): boolean {
  return muted
}

function startBgm(): void {
  const ctx = ensureContext()
  if (!bgmGain) return

  // A slow, ominous two-oscillator drone with a wandering detune — not a
  // real music track, just enough ambience to prove BGM/mute plumbing works.
  const osc1 = ctx.createOscillator()
  osc1.type = 'sine'
  osc1.frequency.value = 55 // A1

  const osc2 = ctx.createOscillator()
  osc2.type = 'sine'
  osc2.frequency.value = 55 * 1.5 // fifth above, detuned by the LFO below

  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.07
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 6
  lfo.connect(lfoGain)
  lfoGain.connect(osc2.frequency)

  osc1.connect(bgmGain)
  osc2.connect(bgmGain)

  osc1.start()
  osc2.start()
  lfo.start()
}

interface ToneOptions {
  type?: OscillatorType
  gain?: number
  delay?: number
}

function playTone(freq: number, duration: number, options: ToneOptions = {}): void {
  const { type = 'sine', gain = 0.3, delay = 0 } = options
  const ctx = ensureContext()
  if (!sfxGain) return

  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.value = freq

  const envelope = ctx.createGain()
  envelope.gain.value = 0
  osc.connect(envelope)
  envelope.connect(sfxGain)

  const startAt = ctx.currentTime + delay
  envelope.gain.setValueAtTime(0, startAt)
  envelope.gain.linearRampToValueAtTime(gain, startAt + 0.01)
  envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

  osc.start(startAt)
  osc.stop(startAt + duration + 0.02)
}

export function playSpinStart(): void {
  playTone(220, 0.12, { type: 'square', gain: 0.2 })
}

export function playReelStop(): void {
  playTone(440, 0.06, { type: 'square', gain: 0.25 })
}

export function playWin(): void {
  // Quick rising arpeggio.
  for (const [i, freq] of [523.25, 659.25, 783.99, 1046.5].entries()) {
    playTone(freq, 0.18, { type: 'triangle', gain: 0.25, delay: i * 0.08 })
  }
}

// Fired by the store when the stage is nearly out of turns.
export function playWarning(): void {
  playTone(110, 0.3, { type: 'sawtooth', gain: 0.3 })
}

let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let heartbeatBpmNow = 0

function thump(): void {
  // "lub-dub": two low, short sine hits.
  playTone(58, 0.14, { gain: 0.55 })
  playTone(48, 0.16, { gain: 0.4, delay: 0.17 })
}

// Loops a heartbeat at `bpm`; 0 (or anything <= 0) stops it. Safe to call
// every time the level changes — an unchanged bpm is a no-op. Does nothing
// until the audio context exists (i.e. after the first user gesture), so the
// caller doesn't need to know about the autoplay policy.
export function setHeartbeat(bpm: number): void {
  if (bpm === heartbeatBpmNow) return
  if (heartbeatTimer !== null) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
  if (bpm <= 0 || !audioContext) {
    // Stay at 0 (not `bpm`) so a later call with the same value can still start.
    heartbeatBpmNow = 0
    return
  }
  heartbeatBpmNow = bpm
  thump()
  heartbeatTimer = setInterval(thump, 60000 / bpm)
}
