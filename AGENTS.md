# AGENTS.md — CannonML

Browser-only bullet-pattern (shmup) DSL library, written in TypeScript (ESM). npm + `tsc` (build) + Vitest (tests); no lint or CI yet. Design notes: `docs/superpowers/specs/2026-10-19-typescript-migration-design.md`.

## Run / verify

- `npm run build` → `tsc` emits ESM + `.d.ts` to `dist/` (gitignored). `npm run typecheck` = `tsc --noEmit`.
- Demo: `demo/index.html` loads `../dist/index.js` as a module, so build first. Serve from repo root, don't open via `file://`:
  `npm run build && python3 -m http.server 8000` → open `http://localhost:8000/demo/`
- Demo needs network (ace editor via CDN). `three.min.js` / `ptolemy.js` are vendored locally (classic scripts, globals).
- Tests: `npm install && npm test` (Vitest, `test/*.test.js`). `test/helpers/global-setup.js` bundles `src/index.ts` into one IIFE (vite lib build); `test/helpers/load.js` evaluates it in a fresh `vm` context per test, because CannonML is a singleton. In watch mode the bundle is built once at start — restart after editing `src/`.
- `test/dist.smoke.test.js` runs `tsc` to a temp dir and imports the output in Node: catches import-order errors and missing `.js` extensions in relative imports.
- Known bugs are pinned twice: `it.fails` in tests (when fixed, the test fails: drop `.fails`) and `// @ts-expect-error known bug: ...` in `src/` (when fixed, tsc fails: drop the comment).

## Architecture

- Public entry is `src/index.ts` only: `export const CML = { ... }` plus a same-named type-only `namespace CML` (so `CML.Fiber` is both a value and a type), and `export { CannonML }`. `CML.String` / `CML.Object` are exposed names; the classes are `CMLString` / `CMLObject` internally.
- Internal files import siblings directly with a `.js` extension (`./CMLState.js`), never `index.ts`.
- **Import order is load-bearing.** `State ⇄ Sequence ⇄ Fiber` are circular; `Sequence extends State` fails if `State` is not evaluated first. `index.ts` imports `CMLSequence` first, which gives the right order. `Fiber._rootFiber` is created lazily for the same reason. Don't add deep imports as entry points.
- `new CannonML(vertical?, callbacks)` (`src/CannonML.ts`) wires `Global`/`Runner`/`Fiber`/`Sequence`/`State`/`Formula`/`Barrage` singletons. **It is a singleton; a second `new` throws.**
- Per-frame driver: host app must call `cml.update()` every frame (`Fiber._updateAll` + `Object._updateAll`). Pattern execution: `cml.sequence(script)` → `cml.runner(x,y,z,seq)` → `runner.execute(...)` returns a `Fiber`. See `demo/main.js` for canonical wiring including `setDefaultTarget` / `setScreenSize` and the `onCreateNewRunner` / `onDestroy` / `onUpdate` callback contract (`demo/actor.js`).
- `src/core/` holds the parser/state-machine internals (`CMLParser`, `CMLState`, `CMLFormula*`, `CMLBarrage*`, `CMLObject`, `CMLVector`, ...). `src/CML{Fiber,Runner,Sequence}.ts` are the public runtime.

## Conventions / gotchas

- `old/` is a frozen archive (`v1(actionscript)`, and `v2(javascript)` = the pre-TypeScript sources). Never edit or mirror changes there.
- `docs/reference/v2/cannonML_e.html` (English) / `cannonML.html` (Japanese) is the language spec — consult before changing parser/command behavior.
- Off-screen culling: `CML.Runner.onUpdate` auto-destroys runners outside `setScreenSize` bounds unless `runner.scopeEnabled = false` (player objects in `demo/main.js`).
