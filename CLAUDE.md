# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A browser-playable homage to *CloverPit* (Steam, Unity, Panik Arcade) — a first-person slot-machine horror roguelite: spin a slot machine, meet a payout quota within a turn limit or lose. This reimplements the game-loop concept in the browser via three.js/React Three Fiber; no assets or code are ported from the original.

Client-side only, intentionally — no backend/DB.

## Commands

```bash
npm run dev       # start Vite dev server
npm run build     # tsc -b && vite build (type-checks, then builds)
npm run lint      # oxlint (see .oxlintrc.json — react/typescript/oxc plugins)
npm run preview   # preview the production build locally
```

No test suite is set up yet.

## Architecture

### Stack, and why
Vite + TypeScript + React + React Three Fiber (`@react-three/fiber`, `@react-three/drei`, `three`). R3F was chosen over vanilla three.js specifically so the HUD (money / quota / turns) can share React state with the 3D scene instead of manually syncing a DOM overlay against a separate render loop. `zustand` holds that shared game state (plain React Context was ruled out — too many re-renders for per-frame-ish updates). `@react-three/postprocessing` + `postprocessing` are in for visual effects (win highlights, horror atmosphere lighting).

### react/react-dom are pinned to exact `19.2.8`
Not `^19.2.8`. `@react-three/fiber`'s peer range is `react@">=19 <19.3"` (true even on its 10.x canary builds as of this writing); a caret range resolves to 19.3.0 and `npm install` fails with ERESOLVE. Keep the exact pin — or re-check `@react-three/fiber`'s current peerDependencies — before bumping React.

### Module boundaries
- `src/game/` — framework-agnostic TS: weighted symbol RNG (`rng.ts`), grid fill (`spin.ts`), win-line detection + payout (`paylines.ts`), the symbol/layout tables (`symbols.ts`, `layout.ts`). No React or three.js imports; kept unit-testable in isolation from rendering (verified manually so far — no test runner wired up yet).
- `src/scene/` — R3F components (`Room`, `Lighting`, `FixedCamera`, `Cabinet`, `ReelGrid`). Reads `src/store` state and renders/animates it; does not decide game outcomes itself — `ReelGrid`'s roll animation just delays *revealing* the grid the store already computed.
- `src/ui/` — DOM-rendered React HUD, overlaid on the `<Canvas>` (a sibling `<div>`, not inside the Canvas tree). Only `SpinButton.tsx` exists so far, pulled forward from its Phase 8 slot because Phase 5's reel animation needed something to trigger it; Phase 8 extends this into the full HUD (money/quota/turns, game-over/clear screens).
- `src/store/` — zustand (`gameStore.ts`). Currently holds `grid`/`isSpinning`/`lastWins`/`lastPayout` and the `spin()`/`finishSpin()` actions; `spin()` computes the full result immediately, `finishSpin()` is called by `ReelGrid` once the reel animation visually catches up. Phase 7 extends this store with money/quota/turn state.
- `src/audio/` — `audioEngine.ts`, a framework-agnostic Web Audio wrapper (no React/three). Everything is synthesized (oscillators + envelopes) — there are no sound files, same spirit as `scene/icons.ts`'s placeholder textures. `initAudio()` must be called from a user-gesture handler (browser autoplay policy); `store` and `scene` both call into this directly for side effects (spin-start/reel-stop/win SE), which is a deliberate exception to `store`/`scene` otherwise not reaching outside their own layer.

### Game design constants
- Slot grid is 5 reels × 3 rows = 15 visible cells, matching the reference game.
- 15 total icon symbols, weighted by rarity rather than uniform probability — also matching the reference game's design, not an arbitrary choice.
- For calibration only (not to be copied 1:1 — this project has 15 symbols, the reference has 7): CloverPit's own slot uses a tiered payout, roughly lemon/cherry = 2 coins, clover/bell = 3, treasure/diamond = 5, lucky seven = 7. Use this as a shape for "common symbols pay little, rare symbols pay a lot," not as literal values.
- Core loop, precisely: spin → payout added to money → if money ≥ quota before turns run out, advance to the next stage (quota/difficulty increases) → if turns run out first, game over. Turns and quota values are still undecided (see Open decisions).

### Deploy target
Cloudflare Workers (static assets) is the intended deploy target; not yet wired up.

## Roadmap

Scoped as one MVP effort, in this order. Nothing below is started except where marked.

1. **Setup** — Vite + TS + R3F installed, react/react-dom pinned (see above). ✅ done.
2. **3D scene fundamentals** — `src/scene/Room.tsx` (inside-out box, BackSide), `src/scene/Lighting.tsx` (dim ambient + one spotlight), `src/scene/FixedCamera.tsx` (fixed first-person, no controls). ✅ done.
3. **Cabinet + grid** — `src/scene/Cabinet.tsx` + `src/scene/ReelGrid.tsx`: cabinet box and the 15-cell (5×3) plane grid, each cell showing a placeholder numbered swatch texture (`src/scene/icons.ts`). ✅ structurally done — the swatches are throwaway; real icon art swaps in once the icon theme is decided (still undecided, see `docs/NOTES.md`). Grid uses unlit `meshBasicMaterial` so it reads clearly regardless of room lighting, like a backlit real cabinet display.
4. **Spin logic** (`src/game/`) — `layout.ts` (grid shape), `symbols.ts` (weighted symbol table), `rng.ts` (weighted draw), `spin.ts` (fills the grid), `paylines.ts` (row-based win detection + payout). Pure TS, no React/three, no test runner wired up yet but verified manually to draw symbols in the correct weighted proportions and detect wins correctly. ✅ done — weights/payouts/multipliers are placeholders, tracked in `docs/NOTES.md`.
5. **Reel animation** — `src/store/gameStore.ts` + `src/scene/ReelGrid.tsx`: columns roll (cycling textures) and stop left-to-right with a stagger, then reveal the store's already-computed grid; winning cells (from `lastWins`) pulse once stopped. A minimal `src/ui/SpinButton.tsx` triggers it. ✅ done — durations/stagger/pulse are feel, not tuned.
6. **Audio** — `src/audio/audioEngine.ts`: synthesized BGM drone (starts + resumes on first user gesture, via `SpinButton`) and SE for spin-start/reel-stop/win, plus a `MuteButton`. ✅ done — `playWarning()` exists but isn't called from anywhere yet; wire it up when Phase 7 adds turn-count state.
7. **Game loop** — extend `src/store/gameStore.ts` with money/quota/turn state, stage advance, game-over/clear transitions. 🔶 next.
8. **HUD** (`src/ui/`) — money/quota/turns display, PUSH button, game-over/clear screens.
9. **Deploy** — wire up Cloudflare Workers static-asset deploy.

## Notes log

`docs/NOTES.md` tracks open questions and small, non-obvious decisions as the project evolves (product name, icon theme, quota/turn numbers, etc. currently live there). Keep it up to date:

- Hit something genuinely unclear (ambiguous spec, a question only the user can answer)? Add it under "Open questions."
- Made a decision that isn't obvious from the code and would be easy to accidentally reverse or contradict later? Add it under "Decisions" with a one-line what + why.
- Resolved an open question? Move it to "Decisions" (with the why) or delete it if it turned out not to matter.

Don't log routine work — this is for things a future session, or the user, would otherwise have to rediscover or ask about again.
