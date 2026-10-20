# CannonML TypeScript 化 方針

## 目的

- 可読性のために `src/` を TypeScript にする。
- 最終成果物は `tsc` が出す ESM の `.js`（+ `.d.ts`）で、`<script type="module">` と `import` で読み込める。
- 公開 API の形（`CML.Fiber`、`new CannonML(...)` など）は変えない。変わるのは読み込み方だけ。

## ゴール / 非ゴール

ゴール
- `src/**/*.ts` が `tsc` で型チェックを通り、`dist/` に ESM が出る。
- demo とテストが `dist/` で動く。
- 型で読める（公開 API・主要フィールドに型注釈）。

非ゴール
- 言語仕様・実行時の挙動の変更（TS 化の過程でのバグ修正は別コミット）。
- バンドラ（vite 等）の導入。
- `old/` の保守（凍結アーカイブ）。
- CJS 出力、npm 公開の整備。

アンチゴール
- `CML` の使い勝手が悪化する（`import` した内部名を全部覚えさせる、等）。
- 型を通すために実行時の挙動が変わる。

## 決定事項（ユーザー決定）

- パッケージマネージャ: **npm**。
- ビルド: **`tsc` のみ**（バンドラなし）。
- `tsconfig.json` は sion（`javascript/sion/tsconfig.json`）に設定を揃える。ただし `noEmit` / `allowImportingTsExtensions` は出力が要るため除外（下記）。
- 現 `src/` は `old/v2(javascript)/` に移す（既存の空フォルダ）。`old/` 配下の ts/js は削除済み（混乱防止）。
- `test/` はテストコード置き場。テストツールは **Vitest**（ユーザー承認）。TS 化の**前に**、現行 JS に対するユニットテストを先に作る。
- 参照形は sion の `index.ts` 方式: 値の `const` オブジェクト + 同名の型専用 `namespace` を併置し、`CML.Fiber` を値・型どちらでも使えるようにする。

## 設計

### ファイル構成

```
src/
  index.ts            // CML (const + namespace) と CannonML を export
  CannonML.ts
  CMLFiber.ts  CMLRunner.ts  CMLSequence.ts
  core/*.ts
dist/                 // tsc 出力（.gitignore）
test/*.test.ts|js
demo/                 // dist を module で読む
old/v2(javascript)/   // 旧 src をそのまま
```

`namespace.js` は廃止（`const CML = {}` を `index.ts` の `export const CML` が置き換える）。

### 参照形

```ts
// src/index.ts
export const CML = { ListElem, List, State, Object: CMLObject, String: CMLString, Fiber, Runner, Sequence, ... }
export namespace CML {
  export type Fiber = InstanceType<typeof Fiber>
  ...
}
export { CannonML }
```

利用側は `import { CML, CannonML } from "../dist/index.js"`。

### 内部参照のルール

- 内部ファイルは **`index.ts` を import しない**。兄弟ファイルを直接 import する（循環で `extends` の評価順が壊れるため）。
  既存の `CML.State` 等（約 500 箇所）は `State` 等に置換。
- 継承の鎖は非循環: `ListElem → State → Sequence/Assign/Refer/String`、`ListElem → Object → Runner`、`ListElem → Fiber/BarrageElem`。メソッド内の相互参照はライブバインディングで可。
- `CML.String` / `CML.Object` は組み込みと衝突するため、クラス名は `CMLString` / `CMLObject`、公開名のみ `String` / `Object`。
- 相対 import は拡張子 `.js` を付ける（`import { State } from "./CMLState.js"`）。`tsc` は拡張子を書き換えないため。

### tsconfig / package

- 設定は sion 準拠: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `esModuleInterop`, `skipLibCheck`, `target: ES2020`, `module: ESNext`, `moduleResolution: bundler`, `lib: ["ES2020","DOM","DOM.Iterable"]`。
- `moduleResolution: bundler` は拡張子なしの import（`./CMLState`）を許す。ブラウザでは 404 になるため、`.js` 付け忘れは `dist/index.js` の Node スモークテスト（「テスト」節）で検出する。
- 差分: `noEmit` と `allowImportingTsExtensions` は使わない。`outDir: dist`, `rootDir: src`, `declaration: true`, `sourceMap: true` を足す。
- `package.json`: `"private": true`, `"type": "module"`（導入済み）。devDependencies は導入済みの `vitest` に `typescript`（sion と同じ ^7.0.2）を足す。
- scripts: 既存の `test`（`vitest run`）に `build`（`tsc`）と `typecheck`（`tsc --noEmit`）を足す。`test` は build 不要（`src/*.ts` を直接テストする）。

### demo

- `demo/index.html` の個別 `<script src="../src/...">` 24 本を `<script type="module" src="main.js">` 1 本にする。`main.js` / `actor.js` は `import` に書き換え、`../dist/index.js` を読む。
- 動作確認は従来通り repo ルートで HTTP サーバを立てて `http://localhost:8000/demo/`（`file://` 不可）。`dist/` が必要なので先に `npm run build`。

### テスト

- ツールは Vitest（導入済み）。段階 5 で `test/*.test.js` は `src/index.ts` を直接 import する形に変える（build 不要）。
- **モジュールはテストファイル内で 1 回しか評価されない**ため、`CannonML` の singleton（`CannonML._mutex`）と `Fiber._rootFiber` 等のモジュール状態が、テスト間で共有されてしまう。現行の「テストごとに `vm` で再読み込み」は ESM では成り立たない。
  - 対処: `test/helpers/load.js` の `loadCML()` を `async` にし、`vi.resetModules()` のあと `await import("../../src/index.ts")` で毎回読み直す。`createCML()` も `async` になるので、各テストの呼び出しに `await` を足す（本体の書き換えはこれだけ）。
  - `loadCML()` が返す形（`{ CML, CannonML }`）は今の vm 版と揃え、テスト本体の変更を最小にする。
- `dist/` 向けには、Node で `dist/index.js` を import するスモークテストを 1 本だけ置く（`node --input-type=module -e "import('./dist/index.js')"` 相当）。評価順の誤りと、`.js` 拡張子の付け忘れ（`moduleResolution: bundler` は許してしまうが Node の ESM は拒否する）をここで検出する。
- 現行の `test/helpers/load.js` は `demo/index.html` の `<script>` 順に `src/*.js` を `vm` へ読む。環境変数 `CML_SRC`（既定 `src`）で読み込み元を切り替えられる（実装済み）。段階 2 の後は `CML_SRC="old/v2(javascript)" npm test` で旧版が緑のままであることを確認できる。

## 進め方（段階）

0. **（完了）Vitest 導入と現行 JS のユニットテスト作成**: `package.json`（`vitest` のみ）、`test/*.test.js`、`test/helpers/{load,run}.js`。既知の不具合は `it.fails` で固定。

1. **（完了）環境整備**: `package.json` / `tsconfig.json` / `.gitignore`（`node_modules`, `dist`）追加、`typescript` を導入、空の `src/index.ts` で `npm run build` が通ることを確認。
2. **（完了）** 現 `src/*.js` を `git mv` で `old/v2(javascript)/` へ移動（履歴を保つ）。`src/` には仮の `index.ts` だけが残る。テストの読み込み元（`test/helpers/load.js`）の既定は `old/v2(javascript)` に変更済み。demo は段階 5 まで動かない（`../src/*.js` が無いため）。
3. **（完了）** 依存の葉から順に、`old/v2(javascript)/X.js` を `src/X.ts` へコピーして `.ts` 化（`interpolation`, `RangeLimitNumber`, `CMLVector`, `CMLListElem`, `CMLList`, ...）。ファイルごとに `npm run typecheck`。
4. **（完了）** `index.ts` で `CML` を組み立て、`CannonML.ts` を最後に。
5. **（完了）** demo を `dist` 向けに更新し、テストを `src/index.ts` 直接 import（上記「テスト」節）に切り替え、全件が移行前と同じ結果になることを確認。`dist` のスモークテストを追加。

### 循環参照と評価順（ビルダーチェックで判明）

実コードには `State ⇄ Sequence`、`Fiber ⇄ State/Barrage` の循環があり、`Sequence extends State` が基底の評価前に走ると TDZ の `ReferenceError` になる。例: エントリが `State` を先に読むと、`State → Sequence` で Sequence が先に評価され落ちる。逆に `Sequence` を先に読めば通る。

- 対処（私の判断）: `src/index.ts` に **評価順を固定した import 列**を書く（基底クラス → 派生クラスの順、元の `<script>` の並び＝`demo/index.html` の順に従う）。理由をコメントで一行残す。
- 公開エントリは `index.js` のみ。個別ファイルの deep import は非サポート。
- モジュール先頭の副作用（`new Fiber()`, `new List()` 等）は挙動不変のため維持し、依存先の評価後に走る順序で import する。
- 回帰防止: `dist/index.js` を import するスモークテストを必ず置く（順序ミスは `ReferenceError` で即落ちる）。
- 将来の構造的解決（遅延バインディング等）は、順序が負担になった時点で検討。今はやらない。

## 段階の扱い（私の判断）

- この文書は全段階（1〜5）を扱う。**実装は段階 1 から始め、次の段階へは都度ユーザーの了承を取る**。
- 段階 2〜5 の間、demo と旧テストは壊れてよい。作業用ブランチ上で行い、段階 5 の終了時点で全て緑にする。
- 旧 `src/` は `old/v2(javascript)/` に置く（段階 1 で置いた仮の `src/index.ts` は含めない。`git mv` ではなく `cp` して `.js` だけ残す）。TS 化は `src/` 内で `.js` を `.ts` にリネームして行う。
- コミットはユーザーの指示があるまでしない。

## 動作不変の検証基準

- 段階 0 で作った Vitest のユニットテストが、移行の前後（現行 JS → `src/*.ts`）で**全件同じ結果**で通ること。通常テストは通り、`it.fails`（既知の不具合 11 件）も失敗のまま維持される。
- 追加で demo を手動で一度動かす（ブラウザ確認）。
- 基準点を揃えるため、段階 1 に入る前に、`src/` の未コミットの変更（`getVeriable` → `getVariable` などの修正）をテストとあわせてコミットしておく。

## ビルダーに任せる点

- `noUnusedParameters` 対策: `State.operators`（約 60 関数が `(state, $, fiber, object)` を受ける）など、使わない引数は `_` 始まりにする（例: `_state`, `_$`）。シグネチャは変えない。

- 各クラスの型注釈の詳細、`any` を許す箇所の判断（ただし公開 API は型を付ける）。
- `lib` から DOM が本当に要るか（要らなければ外してよい）。
- 凍結した `old/v2(javascript)/` を参照して挙動を突き合わせる方法。

## 確認が必要な前提（私の判断）

- `dist/` は gitignore し、コミットしない。リポジトリを clone した人は `npm run build` が必要になる。
- `package.json` の `name` は `cannonml`、バージョンは `0.0.0` の暫定値。
- 作業ツリーにあるユーザーの未コミット変更（`old/` の削除等）には触れない。

## 段階 3〜4 の結果と判断（実施済み）

- `src/` の 22 ファイル（`index.ts` 含む）を TS 化。`tsc --noEmit` はエラー 0。
- 検証: `src/index.ts` を rolldown で IIFE にバンドルし、既存テスト 170 件を `vm` で実行して**同じ結果**（159 通過 + 期待失敗 11）。また 34 本のスクリプトで旧 JS と `dist/` の出力（位置列・生成物・エラーメッセージ）が完全一致。
- **`Fiber._rootFiber` を遅延生成にした**（唯一の構造変更）。循環 import のためモジュール評価時に `State` が未初期化で、`new Fiber()` が `State.HO_AIM` を参照して落ちるため。挙動は同じ。
- `ListElem.prev/next` と `List` の取り出し系は `any`（要素が State / Fiber / Object の混在のため）。`Fiber._object` などは「破棄後 null」だが型は非 null（`null!`）。
- 既存の不具合は挙動を変えず `// @ts-expect-error known bug: ...` で固定した（修正時はコメントごと外す）: `State._nop` 未定義、`_pushInvertion()` の引数欠落、`hopt` 参照、`angleVelocity` の typo、`@ko` の `_wait4destruction` 引数、`Assign` が fiber でなく state を受け取る、`Object` の `setScaler`/`conter`/`related`/`nagate`/`isRelative`/`his` の typo、`CannonML.runner()` の引数ずれ（z と createdby）。
- 段階 5 のテスト読み込みは、`vi.resetModules()` + 動的 import のほか、**rolldown でバンドルして `vm` で毎回評価する方式**（同期で今の `createCML()` を変えずに済む）も動作確認済み。

## 段階 5 の結果（実施済み）

- テスト: `vi.resetModules()` 方式ではなく、**`src/index.ts` を vite（lib・IIFE）で 1 本にバンドルし、`vm` で毎回評価する方式**を採用（`test/helpers/global-setup.js` + `load.js`）。`createCML()` が同期のままで、テスト本体は無変更。`vite` を devDependency に追加（vitest が内部で使うものと同じ ^8）。watch モードではバンドルは起動時 1 回のみ。
- `CML_SRC`（旧 JS を指す切り替え）は廃止。`demo/index.html` の `<script>` 並びに依存していたため。旧版との比較が必要なら、コミット `9c0e4ab` 以前をチェックアウトする。
- `test/dist.smoke.test.js`: `tsc` を一時ディレクトリに出力して Node で import。`.js` 付け忘れで `ERR_MODULE_NOT_FOUND` になることを実際に確認済み。
- demo: `<script>` 24 本を `<script type="module" src="main.js">` 1 本に。`main.js` は `../dist/index.js` と `actor.js` を import（`editor` を明示宣言）。
- 結果: `npm test` 160 通過 + 期待失敗 11、`npm run typecheck` / `npm run build` はエラー 0。
