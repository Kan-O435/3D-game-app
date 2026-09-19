# Notes

Running scratch log for this project — things that are unclear, and decisions worth remembering. This is not a polished doc; append short entries as work happens so nothing only lives in chat history or gets re-asked later. See `CLAUDE.md` for the stable architecture description; this file is for the smaller, evolving stuff.

## Open questions

Things that are unresolved or ambiguous. When one gets resolved, move it to "Decisions" below with a one-line why, or delete it if it turned out not to matter.

- **Product name**: not finalized. Repo/package name (`3D-game-app` / `3d-game`) is a placeholder, not the intended final title.
- **Icon theme**: what the 15 slot symbols actually depict is undecided.
- **Stage/difficulty progression depth**: how many stages, how the quota scales — out of scope for MVP unless decided otherwise.
- **Balance is simulation-tuned, not playtested**: symbol weights/payouts (`symbols.ts`), payline multipliers (`paylines.ts`) and the turn/quota curve (`stage.ts`) were picked together by Monte Carlo (stage 1 clears ~89%, median run reaches stage ~5). Real feel needs playtesting — expect to retune.
- **Stage depth / clear condition**: stages currently continue forever (quota keeps rising) — there is no "final stage" / true game-clear screen yet. Issue #2 mentions ゲームオーバー/クリア処理; decide whether MVP needs an ending or just endless-until-fail.

## Decisions

Notable choices made along the way that aren't obvious from the code and would be easy to accidentally reverse or contradict later. One line: what + why. (Big architectural ones already live in `CLAUDE.md` — don't duplicate those here; this is for the smaller in-the-weeds ones that come up while implementing.)

- **Paylines are rows only, matched left-to-right from column 0** (`src/game/paylines.ts`): simplest classic-slot rule (no diagonals/other patterns) to get win detection working end-to-end first. Revisit if the game needs richer win patterns.
- **`SpinButton` (`src/ui/`) was built early, in Phase 5 instead of its scheduled Phase 8**: the reel animation needed something to trigger a spin to be testable at all. It's a real (if minimal) start of the HUD, not a throwaway — Phase 8 extends it rather than replacing it.
- **The store decides the spin result immediately; the reel animation only delays revealing it** (`src/store/gameStore.ts` + `src/scene/ReelGrid.tsx`): `spin()` computes the final grid/wins up front, and `ReelGrid`'s roll-then-stop animation is purely visual, calling `finishSpin()` when it catches up. Keeps game logic and animation timing fully decoupled.
- **No sound files — all audio is synthesized** (`src/audio/audioEngine.ts`): oscillators + gain envelopes for SE, two detuned drone oscillators for BGM. Same "prove the plumbing, not the content" approach as the placeholder icon textures. Swap in real audio assets later without changing the call sites (`initAudio`/`playSpinStart`/`playReelStop`/`playWin`/`setMuted`).
- **Paylines now match from 2 symbols, not 3** (`src/game/paylines.ts`, `MIN_MATCH = 2`): with 15 weighted symbols a 3-run hit only ~3% of spins (EV ≈ 0.09 coin/spin), which made any turn-limited quota pure luck. 2-runs hit ~29% of spins. Multipliers were retuned to `{2:2, 3:6, 4:20, 5:60}` alongside. Supersedes the earlier "3-match" rule.
- **Money carries over between stages; quota is a target on the running total** (`src/store/gameStore.ts`, `src/game/stage.ts`): surplus from a stage isn't wasted, quota therefore grows cumulatively (10, 23, 39, 58, 80…). Turns reset to 15 each stage.
- **Turn is spent at `spin()`, payout is banked at `finishSpin()`** (`gameStore.ts`): money only changes when the reels visibly stop, so the HUD number can't spoil the result. Clearing the quota on the very last turn counts as a clear, not game over. `playWarning()` fires when ≤2 turns remain after a spin that neither cleared nor ended the run.
