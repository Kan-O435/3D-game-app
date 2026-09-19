# Notes

Running scratch log for this project — things that are unclear, and decisions worth remembering. This is not a polished doc; append short entries as work happens so nothing only lives in chat history or gets re-asked later. See `CLAUDE.md` for the stable architecture description; this file is for the smaller, evolving stuff.

## Open questions

Things that are unresolved or ambiguous. When one gets resolved, move it to "Decisions" below with a one-line why, or delete it if it turned out not to matter.

- **Product name**: not finalized. Repo/package name (`3D-game-app` / `3d-game`) is a placeholder, not the intended final title.
- **Icon theme**: what the 15 slot symbols actually depict is undecided.
- **Turn count / quota curve**: exact numbers (turns per stage, quota per stage) not decided — needed before the game-loop/state-management work.
- **Stage/difficulty progression depth**: how many stages, how the quota scales — out of scope for MVP unless decided otherwise.
- **Symbol weights/payouts** (`src/game/symbols.ts`) and the **payline match multiplier** (`src/game/paylines.ts`): placeholder numbers picked to get the RNG/win-detection logic working, not a tuned game balance. Revisit once quota/turn numbers above are decided — they interact (payout scale must roughly match how fast the quota needs to be met).

## Decisions

Notable choices made along the way that aren't obvious from the code and would be easy to accidentally reverse or contradict later. One line: what + why. (Big architectural ones already live in `CLAUDE.md` — don't duplicate those here; this is for the smaller in-the-weeds ones that come up while implementing.)

- **Paylines are rows only, matched left-to-right from column 0** (`src/game/paylines.ts`): simplest classic-slot rule (no diagonals/other patterns) to get win detection working end-to-end first. Revisit if the game needs richer win patterns.
- **`SpinButton` (`src/ui/`) was built early, in Phase 5 instead of its scheduled Phase 8**: the reel animation needed something to trigger a spin to be testable at all. It's a real (if minimal) start of the HUD, not a throwaway — Phase 8 extends it rather than replacing it.
- **The store decides the spin result immediately; the reel animation only delays revealing it** (`src/store/gameStore.ts` + `src/scene/ReelGrid.tsx`): `spin()` computes the final grid/wins up front, and `ReelGrid`'s roll-then-stop animation is purely visual, calling `finishSpin()` when it catches up. Keeps game logic and animation timing fully decoupled.
- **No sound files — all audio is synthesized** (`src/audio/audioEngine.ts`): oscillators + gain envelopes for SE, two detuned drone oscillators for BGM. Same "prove the plumbing, not the content" approach as the placeholder icon textures. Swap in real audio assets later without changing the call sites (`initAudio`/`playSpinStart`/`playReelStop`/`playWin`/`setMuted`).
- **`playWarning()` exists but nothing calls it yet**: it needs turn-count state, which doesn't exist until Phase 7. Wire it up then (e.g. "N turns left" threshold).
