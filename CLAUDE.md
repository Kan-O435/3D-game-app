# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A browser-playable homage to *CloverPit* (Steam, Unity, Panik Arcade) — a first-person slot-machine horror roguelite: spin a slot machine, pay a growing debt at each deadline (a fixed number of spins) or lose. This reimplements the game-loop concept in the browser via three.js/React Three Fiber; no assets or code are ported from the original.

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
Vite + TypeScript + React + React Three Fiber (`@react-three/fiber`, `@react-three/drei`, `three`). R3F was chosen over vanilla three.js specifically so the HUD (money / due / turns) can share React state with the 3D scene instead of manually syncing a DOM overlay against a separate render loop. `zustand` holds that shared game state (plain React Context was ruled out — too many re-renders for per-frame-ish updates). `@react-three/postprocessing` + `postprocessing` are in for visual effects (win highlights, horror atmosphere lighting).

### react/react-dom are pinned to exact `19.2.8`
Not `^19.2.8`. `@react-three/fiber`'s peer range is `react@">=19 <19.3"` (true even on its 10.x canary builds as of this writing); a caret range resolves to 19.3.0 and `npm install` fails with ERESOLVE. Keep the exact pin — or re-check `@react-three/fiber`'s current peerDependencies — before bumping React.

### Module boundaries
- `src/game/` — framework-agnostic TS: weighted symbol RNG (`rng.ts`), drifting symbol values (`drift.ts`), grid fill (`spin.ts`), pattern-based win detection + payout (`paylines.ts`: `PATTERNS`, `findLineWins(grid, activePatternIds)`), the symbol/layout tables (`symbols.ts`, `layout.ts`), per-stage order terms (`stage.ts`: due / performance needed / spin fee / turns, `termsFor`), and charms (`charms.ts` — data + `resolveModifiers`/`computePayout`/`drawShopOffer`). No React or three.js imports; kept unit-testable in isolation from rendering (verified manually so far — no test runner wired up yet).
- `src/scene/` — R3F components (`Room`, `Lighting`, `FixedCamera` — glides between three camera *stations* (machine / order wall / shop counter) chosen by `status`, `Props` — crude set dressing for the two off-machine stations, `Cabinet`, `ReelGrid`, `Atmosphere`, `MoodDriver`). Lights/camera/post-processing all react to one shared smoothed `moodState` (a plain mutable object, written only by `MoodDriver`, derived from `src/game/mood.ts`) via per-frame ref mutation, not React state. Reads `src/store` state and renders/animates it; does not decide game outcomes itself — `ReelGrid`'s roll animation just delays *revealing* the grid the store already computed.
- `src/ui/` — DOM-rendered React screens overlaid on the `<Canvas>` (sibling `<div>`s). One per game status: `SpinButton` (title/playing), `OrderSheet` (briefing), `Hud` + `PayoutTable` (playing), `Shop` (shop), `GameOverScreen`; plus `MuteButton` and `Hotkeys` (Space/Enter = the obvious action for the current screen, 1–8 buy in the shop). Overlays that follow a camera move use the `.fade-in` CSS class (delayed so they appear once the camera has settled). All read `src/store` only.
- `src/store/` — zustand (`gameStore.ts`). `status` is `'title' | 'briefing' | 'playing' | 'shop' | 'gameOver'`. Holds the grid/spin result (`lastWins`/`lastPayout`/`lastPerf`), run state (`money`, `stage`, `perf`, `turnsLeft`, `failReason`), the current stage's order (`due`/`perfNeeded`/`spinCost`), and charm state (`charms`/`shopOffer`). Actions: `startRun`, `acceptOrder`, `spin` (decides the result, charges the fee, spends the turn up front), `finishSpin` (called by `ReelGrid` when the animation catches up; banks payout + P, settles the deadline), `buyCharm`, `rerollShop`, `leaveShop`, `restart`. `settleDeadline` is the one place the order is checked.
- `src/audio/` — `audioEngine.ts`, a framework-agnostic Web Audio wrapper (no React/three). Everything is synthesized (oscillators + envelopes) — there are no sound files, same spirit as `scene/icons.ts`'s placeholder textures. `initAudio()` must be called from a user-gesture handler (browser autoplay policy); `store` and `scene` both call into this directly for side effects (spin-start/reel-stop/win SE), which is a deliberate exception to `store`/`scene` otherwise not reaching outside their own layer.

### Game design constants
- Slot grid is 5 reels × 3 rows = 15 visible cells, matching the reference game.
- 15 total icon symbols, weighted by rarity rather than uniform probability — also matching the reference game's design, not an arbitrary choice.
- For calibration only (not to be copied 1:1 — this project has 15 symbols, the reference has 7): CloverPit's own slot uses a tiered payout, roughly lemon/cherry = 2 coins, clover/bell = 3, treasure/diamond = 5, lucky seven = 7. Use this as a shape for "common symbols pay little, rare symbols pay a lot," not as literal values.
- Core loop, precisely (modeled on the *reference site's* flow, not on the full CloverPit — see `docs/NOTES.md`): **title** (machine view, red PUSH) → **briefing** (camera goes to the left wall; the stage's order sheet: coins due, performance points required, turns, fee per spin) → **playing** (back at the machine; every spin costs the fee, wins pay coins *and* performance points P) → on the **last turn** the order is settled: coins ≥ due **and** P ≥ required, else game over → **shop** (camera goes to the right-hand counter: 8 charms, a reroll button, buy with coins) → next stage's briefing. Having enough early doesn't end a stage. If the fee can't be paid the remaining turns are forfeited and the deadline comes immediately; shop spending must leave at least the next fee. Numbers live in `src/game/stage.ts` (placeholder, simulation-tuned).

### Deploy target
Cloudflare Workers (static assets) is the intended deploy target; not yet wired up.

## Roadmap

Phases 1–9 are the MVP loop (playable start to finish); 10+ deepen it. Phase 15 re-shapes the loop after the reference site's flow. Nothing below is started except where marked.

1. **Setup** — Vite + TS + R3F installed, react/react-dom pinned (see above). ✅ done.
2. **3D scene fundamentals** — `src/scene/Room.tsx` (inside-out box, BackSide), `src/scene/Lighting.tsx` (dim ambient + one spotlight), `src/scene/FixedCamera.tsx` (fixed first-person, no controls). ✅ done.
3. **Cabinet + grid** — `src/scene/Cabinet.tsx` + `src/scene/ReelGrid.tsx`: cabinet box and the 15-cell (5×3) plane grid, each cell showing a placeholder numbered swatch texture (`src/scene/icons.ts`). ✅ structurally done — the swatches are throwaway; real icon art swaps in once the icon theme is decided (still undecided, see `docs/NOTES.md`). Grid uses unlit `meshBasicMaterial` so it reads clearly regardless of room lighting, like a backlit real cabinet display.
4. **Spin logic** (`src/game/`) — `layout.ts` (grid shape), `symbols.ts` (weighted symbol table), `rng.ts` (weighted draw), `spin.ts` (fills the grid), `paylines.ts` (row-based win detection + payout). Pure TS, no React/three, no test runner wired up yet but verified manually to draw symbols in the correct weighted proportions and detect wins correctly. ✅ done — weights/payouts/multipliers are placeholders, tracked in `docs/NOTES.md`.
5. **Reel animation** — `src/store/gameStore.ts` + `src/scene/ReelGrid.tsx`: columns roll (cycling textures) and stop left-to-right with a stagger, then reveal the store's already-computed grid; winning cells (from `lastWins`) pulse once stopped. A minimal `src/ui/SpinButton.tsx` triggers it. ✅ done — durations/stagger/pulse are feel, not tuned.
6. **Audio** — `src/audio/audioEngine.ts`: synthesized BGM drone (starts + resumes on first user gesture, via `SpinButton`) and SE for spin-start/reel-stop/win, plus a `MuteButton`. ✅ done — `playWarning()` is now called from the store when ≤2 turns remain (Phase 7).
7. **Game loop** — `src/store/gameStore.ts` (money/stage/due/turnsLeft/status, `restart()`) + `src/game/stage.ts` (turns-per-stage, `dueForStage`). Originally a "reach a quota" model; **reworked to pay-at-deadline** (see `docs/NOTES.md`): the debt is deducted on the stage's last turn, game over if money is short. ✅ done — stages are endless (no final-clear screen), numbers are simulation-tuned.
8. **HUD** (`src/ui/`) — `Hud.tsx` (stage/money/due bar/turns to deadline, red at ≤ `WARNING_TURNS`, payout pop), `GameOverScreen.tsx` (RETRY), `SpinButton.tsx` shown only while playing. ✅ done — styling is functional placeholder (inline styles, no horror theming yet); the old "STAGE CLEAR" banner was folded into `Shop.tsx`'s heading. No final-clear screen since stages are endless (see `docs/NOTES.md`).
9. **Charms + shop** — `src/game/charms.ts` (charms as pure data nudging a `Modifiers`), store `shop` status, `src/ui/Shop.tsx`. A stage clear opens the shop (3 random unowned charms, buy with money, then NEXT STAGE). ✅ done — names/flavor are placeholders, prices/effects simulation-tuned, see `docs/NOTES.md`.
10. **Pattern expansion** — `paylines.ts` now has a `PATTERNS` list (3 rows + V, inverted V, two diagonals; each a row-per-column path with a `payoutFactor`). Only the 3 base rows are active by default; the other 4 are unlocked by the charms `v-scar` and `crooked-blade` (`charms.ts` → `Modifiers.extraPatterns`). `LineWin` carries its matched `cells`, which `ReelGrid` highlights directly. ✅ done — unlocking via charms (rather than always-on) is a deliberate design choice, see `docs/NOTES.md`.
11. **Symbol personality** — `SymbolDef` now has a `kind` (`normal` / `wild` / `scatter`). Wild (id 14) substitutes for any normal symbol in a pattern run (never bridges a scatter; an all-wild run pays as the wild). Scatter (id 13) never joins a run; 3+ anywhere on the grid pays flat coins (`SCATTER_PAYOUT`, always active regardless of unlocked patterns). Scatter wins are returned as a `LineWin` with `patternId: 'scatter'` so highlighting/`computePayout` need no special path. Placeholder icons mark specials with a white border and `W` / `★`; the HUD carries a one-line legend. Two new charms (`wild-tongue`, `star-lure`). ✅ done.
12. **Room + atmosphere** — 🔶 mostly done, visually unverified (no browser/WebGL in the dev environment). `src/game/mood.ts` (`tensionFor` turns→0..1, `dreadFor` stage creep, `moodFor`, `heartbeatBpm`) drives: flickering bare-bulb spotlight with brownout dips + a red heartbeat-pulsed fill light (`Lighting.tsx`), breathing sway / tremble / win-kick on the fixed camera (`FixedCamera.tsx`), fog + vignette + grain + chromatic fringe + ACES tone mapping (`Atmosphere.tsx`), and an audio heartbeat (`setHeartbeat` in `audioEngine.ts`) in the last `WARNING_TURNS` turns. Still open: real icon art and wall/floor detail — both wait on the icon theme decision.
13. **Polish** — Title/how-to-play, best-stage record (localStorage), game-clear decision, mobile layout, bundle splitting, tests for `src/game/`.
15. **Reference-flow rework** (current scope; supersedes the earlier "full CloverPit parity" idea, which was dropped as too heavy) — title → briefing → play → shop loop with camera stations, a per-spin fee, a second requirement (performance points P), an 8-slot shop with reroll, a payout-table panel, keyboard controls. ✅ done, visually unverified. All money numbers were scaled ×5 so the fee is small next to a win. Also in: the reference's `6` "rate limit" symbol — a `curse`-kind symbol (id 12); 3+ anywhere on the grid forfeits the whole spin's coins and P (`findRateLimit` in `paylines.ts`, swapped in by the store; the `firewall` charm ignores it). Also in: **drifting symbol values** (`game/drift.ts`) — after each non-deadline spin there's a 12% chance one ordinary symbol's payout is rescaled by ×0.5/0.75/1.5/2; stored as `valueFactors` in the store, reset each stage, shown in the payout table (▲/▼ rows) and announced by the HUD. Still open: a deck view and the theme/wording (docs/NOTES.md).
16. **Deploy** — wire up Cloudflare Workers static-asset deploy (deliberately last: finish the game first).

## Notes log

`docs/NOTES.md` tracks open questions and small, non-obvious decisions as the project evolves (product name, icon theme, quota/turn numbers, etc. currently live there). Keep it up to date:

- Hit something genuinely unclear (ambiguous spec, a question only the user can answer)? Add it under "Open questions."
- Made a decision that isn't obvious from the code and would be easy to accidentally reverse or contradict later? Add it under "Decisions" with a one-line what + why.
- Resolved an open question? Move it to "Decisions" (with the why) or delete it if it turned out not to matter.

Don't log routine work — this is for things a future session, or the user, would otherwise have to rediscover or ask about again.
