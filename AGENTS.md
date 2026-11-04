# AGENTS.md — CannonML

Browser-only bullet-pattern (shmup) DSL library, written in TypeScript (ESM). npm + `tsc` (build) + Vitest (tests); no lint or CI yet. The language is **v3** (spec: `docs/reference/v3/cannonML.md`, Japanese). Design notes for the TS migration: `docs/superpowers/specs/2026-10-19-typescript-migration-design.md`.

**Read "Current state" at the bottom first**: it lists the known spec deviations.

## Run / verify

- `npm run build` → `tsc` emits ESM + `.d.ts` to `dist/` (gitignored). `npm run typecheck` = `tsc --noEmit`.
- Demo: `demo/index.html` loads `../dist/index.js` as a module, so build first. Serve from repo root, don't open via `file://`:
  `npm run build && python3 -m http.server 8000` → open `http://localhost:8000/demo/`
- Demo needs network (ace editor via CDN). `three.min.js` / `ptolemy.js` are vendored locally (classic scripts, globals).
- Tests: `npm install && npm test` (Vitest). `test/spec/NN-*.test.js` are written from `docs/reference/v3/cannonML.md`, one file per spec section, and assert observable results (positions, spawn counts, frames) by running scripts through `run()` in `test/helpers/run.js` (`before` hook for targets/rank/user commands; `withTarget(x, y, script?)` places a target). A new command or spec change needs a test there. `test/helpers/global-setup.js` bundles `src/index.ts` into one IIFE (vite lib build, written to `node_modules/.cache/cannonml-test/`); `test/helpers/load.js` evaluates it in a fresh `vm` context per test, because CannonML is a singleton. In watch mode the bundle is built once at start — restart after editing `src/`.
- `test/dist.smoke.test.js` runs `tsc` to a temp dir and imports the output in Node: catches import-order errors and missing `.js` extensions in relative imports. It fails whenever `tsc` fails.
- Pinning a known bug: `it.fails` in a test, with a `// 既知の不具合: ...` comment above it (when fixed, the test fails: drop `.fails`), and/or `// @ts-expect-error known bug: ...` in `src/` (when fixed, tsc fails: drop the comment). The `it.fails` tests keep the spec's expected value, never the buggy one.
- Timing in tests: a command runs in the `update()` that reaches it, and `w n` resumes n frames later; `w0` continues with the next command in the same frame. A bullet already moves by its initial velocity in the frame it is created. An object's `projected` position is stale until its first `update()`, so scripts that read a target/own position at frame 1 start with `w1`.

## Language (v3)

`docs/reference/v3/cannonML.md` is the spec — consult it before changing parser/command behavior. The v2 HTML docs are gone. Authority for what is actually implemented is `State.command_rex` + `State.operators` in `src/core/CMLState.ts`:

- Flow / wait: `w` `w?` `~` `i` `[ ]` `? :` `{...}` (implicit new fiber) `&label` `l$N=` (`l$N+=` …)
- Labels must always be called as `&Label` (with `&`). A bare label name is a syntax error (`A ?`). `&{...}` is a syntax error too.
- Motion, relative to the `d*` direction: `p` `v` `a` `r` (2D), `pz` `vz` `az` (Z, independent of xy), `rx` `ry`. `i` sets interpolation frames; `a`/`az` ignore it.
- Direction: `da` `dt` `do` `dv` `dp` `ds`.
- Spawn: `q` `qx` `qy` (origin), `bm` `bs` `br` (barrage), `f` `fs` (`fs` = relative-position child).
- Fibers: `@x` (exclusive id) `@m` (mirror fiber) `@o` (child object) `@ko` (on destroy), `kf`, `ko`. Targets: `td` `tp` `to`.
- v2 commands that no longer parse (not in `command_rex`): `px` `py` `pd` `vd` `ad` `ha` `ho` `hv` `hp` `ht` `hs` `n` `nc` `fc` `@` `cd` `cs` `gp` `bv` `m` `mx` `my` and all `^…` fake-call forms.
- No `args` array any more: `cml.runner(x, y, z, seq, mirror)` and `runner.execute(seq, mirror)` (`mirror` is a boolean). Locals `$1..$9` live on the object (`CMLObject._variables`) and are shared by its fibers.
- User commands/variables are registered on `cml.globalVariables.registerUserCommand(name, func, argc, requireSequence?)` / `registerUserVariable`.

## Architecture

- Public entry is `src/index.ts` only: `export const CML = { ... }` plus a same-named type-only `namespace CML` (so `CML.Fiber` is both a value and a type), and `export { CannonML }`. `CML.String` / `CML.Object` are exposed names; the classes are `CMLString` / `CMLObject` internally.
- Internal files import siblings directly with a `.js` extension (`./CMLState.js`), never `index.ts`.
- **Import order is load-bearing.** `State ⇄ Sequence ⇄ Fiber` are circular; `Sequence extends State` fails if `State` is not evaluated first. `index.ts` imports `CMLSequence` first, which gives the right order. `Fiber._rootFiber` is created lazily for the same reason. Don't add deep imports as entry points.
- `new CannonML(vertical?, callbacks)` (`src/CannonML.ts`) wires `Global`/`Runner`/`Fiber`/`Sequence`/`State`/`Formula`/`Barrage` singletons. **It is a singleton; a second `new` throws.**
- Per-frame driver: host app must call `cml.update()` every frame (`Fiber._updateAll` + `Object._updateAll`). Pattern execution: `cml.sequence(script)` → `cml.runner(x,y,z,seq)` → `runner.execute(...)` returns a `Fiber`. See `demo/main.js` for the wiring including `setDefaultTarget` / `setScreenSize` and the `onCreateNewRunner` / `onDestroy` / `onUpdate` callback contract (`demo/actor.js`).
- `src/core/` holds the parser/state-machine internals (`CMLParser`, `CMLState`, `CMLFormula*`, `CMLBarrage*`, `CMLObject`, `CMLVector`, `interpolation`, ...). `src/CML{Fiber,Runner,Sequence}.ts` are the public runtime.
- Adding a command = an entry in **both** `State.command_rex` (longer alternatives first: `pz` before `p`, `@ko` before `@o`) and `State.operators`. An operator is `{ argc, type, func(state, $, fiber, object) }`; unused leading params are named `_`. Commands typed `STF_BE_INTERPOLATED` are run together by `~` / `$init4int`. `$`-prefixed operators are internal and not in `command_rex`.
- The parser regex is assembled from plain JS string literals in `Parser._createCMLRegExp`. Write `\\s` / `\\w`: a single `\s` / `\w` silently becomes `s` / `w`, and tsc cannot see it. This has already broken the parser twice. Text the regexp does not match is a syntax error (`Parser._checkSkipped`), and unbalanced `(` `)` is rejected in `Formula`.
- Units: script angles are degrees (counter-clockwise positive). They become radians in `State._setHeadAngle`, in `rx`/`ry`, and in the `BarrageElem.set*` setters (which take degrees). `fiber.headAngle` and `CMLObject` angles are radians.
- Mirror: `@m` starts a fiber with `fiber.mirror = true` (nested `@m` toggles). It negates `d*` angles, the perpendicular component of `p`/`v`/`a`, and `b*` rotations. `q` is in screen coordinates: `_mirrorX` flips x on vertical scroll, `_mirrorY` flips y on horizontal scroll. `dt` still aims at the target; only its offset is mirrored.

## Conventions / gotchas

- `old/` is a frozen archive (`v1(actionscript)`, and `v2(javascript)` = the pre-TypeScript sources). Never edit or mirror changes there.
- Off-screen culling: `CML.Runner.onUpdate` auto-destroys runners outside `setScreenSize` bounds unless `runner.scopeEnabled = false` (player objects in `demo/main.js`). Without `setScreenSize` the bounds are 0, so a runner is destroyed on its first `update`.
- `docs/remaining-tasks.md` and `README.md` describe the v2 / pre-TypeScript state and link to deleted v2 docs. Do not treat them as current.

## Current state (2026-11-04) — delete an entry when it is fixed

`npm run typecheck` and `npm test` pass: 189 tests, no `it.fails`. `demo/` still has a v2 default script (`demo/index.html`) that does not parse.

Spec vs. implementation, pinned in `test/spec/` (each has a `既知の不具合` / `要確認` comment):

- Not in the spec, unpinned: `bm1,30` fires its single bullet at -15° (the fan edge), not the centre.
- `dp` is relative to the parent's angle only for `fs` children; for `f` children the reference is the screen's 0° (scroll direction). The spec was corrected to match.
- Arguments are accepted after `&label` only (also `f0 &A 4`, which sets the bullet's `$1..`); an argument after `{...}` / `{.}` is a syntax error (`Parser._check_argument`). Locals are per object (`CMLObject._variables`), shared by all its fibers (spec documents this), so two calls on one object overwrite each other's `$1..$9`.
