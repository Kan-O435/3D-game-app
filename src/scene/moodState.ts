// Shared, smoothed "how creepy is it right now" (0..1) for everything in the
// scene that reacts to it. A plain mutable object rather than React state so
// per-frame readers (lights, camera) don't cause re-renders; <MoodDriver />
// (MoodDriver.tsx) is the only writer.
export const moodState = { value: 0 }
