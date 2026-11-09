# AGENTS.md — CannonML

Browser-only bullet-pattern (shmup) DSL library, written in TypeScript (ESM). npm + `tsc` (build) + Vitest (tests); no lint or CI yet. The language is **v3** (spec: `docs/reference/v3/cannonML.md`, Japanese). Design notes for the TS migration: `docs/superpowers/specs/2026-10-19-typescript-migration-design.md`.

**Read "Current state" at the bottom first.**

## Run / verify

- `npm run build` → `tsc` emits ESM + `.d.ts` to `dist/` (gitignored). `npm run typecheck` = `tsc --noEmit`.
- Demo: `demo/index.html` loads `../dist/index.js` as a module, so build first. Serve from repo root, don't open via `file://`:
  `npm run build && python3 -m http.server 8000` → open `http://localhost:8000/demo/`
- Demo needs network (ace editor via CDN). `three.min.js` / `ptolemy.js` are vendored locally (classic scripts, globals).
- Tests: `npm install && npm test` (Vitest). `test/spec/NN-*.test.js` are written from `docs/reference/v3/cannonML.md`, one file per spec section, and assert observable results (positions, spawn counts, frames) by running scripts through `run()` in `test/helpers/run.js` (`before` hook for targets/rank/user commands; `withTarget(x, y, script?)` places a target). A new command or spec change needs a test there. `test/helpers/global-setup.js` bundles `src/index.ts` into one IIFE (vite lib build, written to `node_modules/.cache/cannonml-test/`); `test/helpers/load.js` evaluates it in a fresh `vm` context per test, because CannonML is a singleton. In watch mode the bundle is built once at start — restart after editing `src/`.
- `test/dist.smoke.test.js` runs `tsc` to a temp dir and imports the output in Node: catches import-order errors and missing `.js` extensions in relative imports. It fails whenever `tsc` fails.
- Pinning a known bug (currently none): `it.fails` in a test, with a `// 既知の不具合: ...` comment above it (when fixed, the test fails: drop `.fails`), and/or `// @ts-expect-error known bug: ...` in `src/` (when fixed, tsc fails: drop the comment). The `it.fails` tests keep the spec's expected value, never the buggy one.
- Timing in tests: a command runs in the `update()` that reaches it, and `w n` resumes n frames later; `w0` continues with the next command in the same frame. A bullet already moves by its initial velocity in the frame it is created. An object's `projected` position is stale until its first `update()`, so scripts that read a target/own position at frame 1 start with `w1`.

## Language (v3)

`docs/reference/v3/cannonML.md` is the spec — consult it before changing parser/command behavior. The v2 HTML docs are gone. Authority for what is actually implemented is `State.command_rex` + `State.operators` in `src/core/CMLState.ts`:

- Flow / wait: `w` `w?` `~` `i` `[ ]` `? :` `{...}` (implicit new fiber) `&label` `l$N=` (`l$N+=` …)
- Labels must always be called as `&Label` (with `&`). A bare label name is a syntax error (`A ?`). `&{...}` is a syntax error too. An undefined `&name` is a syntax error (`&name ?`). Label names match longest-first: with only `#A` defined, `&AB` is `&A` plus a stray `B` (`B ?`).
- Arguments: after `&label` only (also `f0 &A 4`, which sets the bullet's `$1..`); an argument after `{...}` / `{.}` is a syntax error (`Parser._check_argument`). `(` `)` function form (`p(1,2)`) is also valid. User variables: `registerUserVariable` / `$name` (a name must not end with a digit; built-in names win).
- Motion, relative to the `d*` direction: `p` `v` `a` `r` (2D), `pz` `vz` `az` (Z, independent of xy), `rx` `ry`. `i` sets interpolation frames; `a`/`az` ignore it.
- Direction: `da` `dt` `do` `dv` `dp` `ds`. `dp` is relative to the parent's angle only for `fs` children; for `f` children the reference is the screen's 0° (scroll direction). `dt` / `dv` rotate by the shortest way (`Fiber.shortestRotation`, 360° periodic); `da` / `do` / `dp` / `ds` take the angle literally.
- Spawn: `o` `ox` `oy` (origin), `bm` `bs` `br` (barrage), `f` `fs` (`fs` = relative-position child). `bm1,30` fires its single bullet at the fan edge (-15°), not the centre; this is the specified behaviour.
- Fibers: `@x` (exclusive id) `@m` (mirror fiber) `@o` (child object) `@ko` (on destroy), `kf`, `ko`. Targets: `td` `tp` `to`.
- IDs: both the object ID (`f` / `fs` 2nd argument, `@o`, `to`, `$o*`) and the fiber exclusive ID (`@x`) are `>= 0`; "unspecified" is `-1` (`CMLObject.ID_NOT_SPECIFYED` / `Fiber.ID_NOT_SPECIFYED`). ID 0 is a valid ID. A negative ID is a runtime error for `f` `fs` (`Invalid object ID`) and `@x` (`Invalid exclusive ID`); `@o-1` just matches nothing. `$o` counts every object that has an ID; `$o1`..`$o9` count one ID. An ID given by a variable (`f0,$1`) works: `Formula.answerCount` is set for dynamic formulas too.
- Negative `w` / `i` / `~` frame counts are runtime errors; a fractional `~` / `i` count is floored (`~0.5` is `~0`, i.e. it uses the `i` value).
- v2 commands that no longer parse (not in `command_rex`): `q` `qx` `qy` (renamed to `o` `ox` `oy`), `px` `py` `pd` `vd` `ad` `ha` `ho` `hv` `hp` `ht` `hs` `n` `nc` `fc` `@` `cd` `cs` `gp` `bv` `m` `mx` `my` and all `^…` fake-call forms.
- No `args` array any more: `cml.runner(x, y, z, seq, mirror)` and `runner.execute(seq, mirror)` (`mirror` is a boolean). Locals `$1..$9` live on the object (`CMLObject._variables`), are shared by all its fibers (spec documents this) and are not per call, so two calls on one object overwrite each other's `$1..$9`.
- User commands/variables are registered on `cml.globalVariables.registerUserCommand(name, func, argc, requireSequence?)` / `registerUserVariable`.

## Architecture

- Public entry is `src/index.ts` only: `export const CML = { ... }` plus a same-named type-only `namespace CML` (so `CML.Fiber` is both a value and a type), and `export { CannonML }`. `CML.String` / `CML.Object` are exposed names; the classes are `CMLString` / `CMLObject` internally.
- Internal files import siblings directly with a `.js` extension (`./CMLState.js`), never `index.ts`.
- **Import order is load-bearing.** `State ⇄ Sequence ⇄ Fiber` are circular; `Sequence extends State` fails if `State` is not evaluated first. `index.ts` imports `CMLSequence` first, which gives the right order. `Fiber._rootFiber` is created lazily for the same reason. Don't add deep imports as entry points.
- `new CannonML(vertical?, callbacks)` (`src/CannonML.ts`) wires `Global`/`Runner`/`Fiber`/`Sequence`/`CMLObject`/`Barrage` singletons (`Formula` is initialized by `Parser`, which `Sequence._initialize` creates; `State` has no global state). **It is a singleton; a second `new` throws.**
- `CMLObject._parent` is `CMLObject | null` and is read only through `getParent()`, which returns the root when the parent died and throws `This object is not active.` when the object itself is inactive (check `isActive` first). `Fiber._pointer` is `State | null` (null once the fiber finished); `Fiber._object` / `_target` are null after finalize but typed non-null.
- Statics that `new CannonML()` sets (`Fiber._globalVariables`, `Fiber._defaultTarget`, `Sequence._parser`, `Formula._globalVariables` / `_prefixRegExp` / `_postfixRegExp`, `CMLObject._root` / `_globalVariables`, `BarrageElem._globalVariables`) are stored as `_xValue: T | null` and read through a getter that calls `required()` (`src/core/CMLGlobal.ts`). Using one before `new CannonML()` throws `CannonML is not initialized: ...`. Don't read `_xValue` directly and don't use `null!` / `!` for these.
- Name tables (`Global._mapUsrDefRef` / `_mapUsrDefCmd`, `Sequence._childSequences`) are `Object.create(null)`, so names like `constructor` or `toString` are plain names. Look up `FormulaLiteral.operators` with `hasOwnProperty`, not with a bare `[name]` or `in`.
- Lists: `ListElem<T>` / `List<T>` (`src/core/CMLList*.ts`) are for `Fiber`, `CMLObject` and `BarrageElem`: a ring with a sentinel `term`, links are never null, and an element that is not in a list points to itself (`next === prev === this`). `is_linked()` tells whether it is in a list (a pooled fiber in `_freeFibers` is linked too; use `isActive` for liveness). `push` / `unshift` / `insert_*` throw on a linked element, `remove_from_list` throws on an unlinked one, and `pop` / `shift` throw on an empty list (check `isEmpty()`; pools use `Fiber._allocFiber()` / `Barrage.alloc()`). Walk a ring with `let elem = list.begin; while (elem != list.end) { const next = elem.next; ...; elem = next; }` and read `next` before anything that may unlink or destroy `elem`. `fiber.bul` is deliberately not in a list.
- `State` is not a list element: it is the statement chain itself. `prev` / `next` are `State | null` and the chain is null-terminated (`Fiber._pointer === null` means finished; `State.cutChain(start, end)` detaches a range and nulls both ends). The parser builds the chain with `_chainHead` / `_chainTail`; appending the same statement twice (which happens after `}`) keeps it at the tail.
- Invariants checked at runtime: `Fiber._popMirrorFlag` throws on an empty mirror stack (`jstc` and `mstc` are pushed and popped together by `&` / `}`), and `State._gosub` throws on an unresolved label (`verify()` should have resolved it).
- Per-frame driver: host app must call `cml.update()` every frame (`Fiber._updateAll` + `Object._updateAll`). Pattern execution: `cml.sequence(script)` → `cml.runner(x,y,z,seq)` → `runner.execute(...)` returns a `Fiber`. See `demo/main.js` for the wiring including `setDefaultTarget` / `setScreenSize` and the `onCreateNewRunner` / `onDestroy` / `onUpdate` callback contract (`demo/actor.js`).
- `src/core/` holds the parser/state-machine internals (`CMLParser`, `CMLState`, `CMLFormula*`, `CMLBarrage*`, `CMLObject`, `CMLVector`, `interpolation`, ...). `src/CML{Fiber,Runner,Sequence}.ts` are the public runtime.
- Adding a command = an entry in **both** `State.command_rex` (longer alternatives first: `pz` before `p`, `@ko` before `@o`) and `State.operators`. An operator is `{ argc, type, func(state, $, fiber, object) }`; unused leading params are named `_`. Commands typed `STF_BE_INTERPOLATED` are run together by `~` / `$init4int`. `$`-prefixed operators are internal and not in `command_rex`.
- The parser regex is assembled from plain JS string literals in `Parser._createCMLRegExp`. Write `\\s` / `\\w`: a single `\s` / `\w` silently becomes `s` / `w`, and tsc cannot see it. This has already broken the parser twice. Text the regexp does not match is a syntax error (`Parser._checkSkipped`), and unbalanced `(` `)` is rejected in `Formula`.
- Units: script angles are degrees (counter-clockwise positive). They become radians in `State._setHeadAngle`, in `rx`/`ry`, and in the `BarrageElem.set*` setters (which take degrees). `fiber.headAngle` and `CMLObject` angles are radians.
- Mirror: `@m` starts a fiber with `fiber.mirror = true` (nested `@m` toggles). It negates `d*` angles, the perpendicular component of `p`/`v`/`a`, and `b*` rotations. `o` is in screen coordinates: `_mirrorX` flips x on vertical scroll, `_mirrorY` flips y on horizontal scroll. `dt` still aims at the target; only its offset is mirrored.

## Conventions / gotchas

- `old/` is a frozen archive (`v1(actionscript)`, and `v2(javascript)` = the pre-TypeScript sources). Never edit or mirror changes there.
- Off-screen culling: `CML.Runner.onUpdate` auto-destroys runners outside `setScreenSize` bounds unless `runner.scopeEnabled = false` (player objects in `demo/main.js`). Without `setScreenSize` the screen is 200 x 200 (bounds ±100), so a runner placed outside it is destroyed on its first `update`.
- `README.md` still describes the v2 / pre-TypeScript state and links to deleted v2 docs. Do not treat it as current. Open tasks are in `docs/remaining-tasks.md`.

## Current state (2026-11-09)

`npm run typecheck` passes; `npm test` passes 250 tests (`it.fails` none); no `@ts-expect-error`. No `var`, no `any`, `null!` is 4 (all in `Fiber`: `_object` / `_target`). List constraints are F-bounded (`T extends ListElem<T>`); the statement chain lives on `State` itself (`ChainList` was removed). The spec and the implementation agree, with no known defects. The full list of open items (including typing cleanup, README, demo) is in `docs/remaining-tasks.md`.
