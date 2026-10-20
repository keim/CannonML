# 残タスク（TypeScript 化のあと）

TS 化（段階 1〜5）は完了。ここには、TS 化の範囲外として残したものをまとめる。
バグ修正は挙動を変えるので、TS 化とは別のコミットで行うこと。

## 1. 既知の不具合の修正

不具合は 2 か所に固定してある。直したら対応する印を外す（外さないとテスト/tsc が失敗するので、取り忘れに気づける）。

- テスト: `it.fails`（11 件）。直るとそのテストが失敗する → `.fails` を外す。
- ソース: `// @ts-expect-error known bug: ...`（24 行）。直ると tsc が失敗する → コメントを外す。

### 1-1. テストで固定済み（`it.fails`）

| # | 症状 | 原因と直し方（案） | 固定しているテスト |
|---|---|---|---|
| 1 | `l$1=5` などの代入で例外 | `Assign` の `_asg` 系は `fbr` を第 1 引数に取るが、`State.execute` は `(state, $, fiber, object)` で呼ぶので state が渡る。`this.func = (_s, _$, fiber) => this._asg(fiber)` のように包む。`src/core/CMLAssign.ts` | `commands.test.js` の「l$N= 代入」3 件 |
| 2 | `&A 7` のように、コマンドと引数の間に空白を入れると引数にならない。`&{...}9` も解析できない | `CMLParser._createCMLRegExp` の文字列リテラル中の `"\s*"` が `"\\s*"` になっていない（2 か所）。`src/core/CMLParser.ts` | `commands.test.js` の「コマンドと引数の間に空白」「無名シーケンスの直後の引数」 |
| 3 | `'abc'` 文字列で `this.func is not a function` | `State` のコンストラクタが `State._nop`（static）を参照するが、実体はインスタンスメソッド。static にするか `State.prototype._nop` を使う。`src/core/CMLState.ts:45` | `commands.test.js` の「'...' 文字列は無視して続行する」 |
| 4 | `@ko` で例外 | `$w4d` が `state._wait4destruction(state, $, fiber, object)` と 4 引数で呼ぶが、定義は `(fiber)`。`state._wait4destruction(fiber)` に直す。`src/core/CMLState.ts:834` | `commands.test.js` の「@ko」 |
| 5 | `0xff` が 0 になる | `FormulaLiteral` が `parseFloat` で読む。`Number()` にする。`src/core/CMLFormulaLiteral.ts` | `commands.test.js` の「16 進リテラル」 |
| 6 | `bm4,360`（全方位）が等間隔にならない | `BarrageElem.setMultiple` の `angle_ == 360` 判定が、ラジアン変換後の値に対して行われている。判定を `2π` に合わせるか、変換前に判定する。`src/core/CMLBarrageElem.ts` | `commands.test.js` の「bm4,360」 |
| 7 | `setLagrange` が Lagrange 補間になっていない | 係数 P, Q の式が誤り（`0,1,2,3` で曲線になる）。`src/core/interpolation.ts` | `interpolation.test.js` |
| 8 | `cml.runner(x, y, z)` の z が反映されない | z を `create()` の第 3 引数（parent）に渡している。`src/CannonML.ts:59` | `cannonml.test.js` |

### 1-2. `@ts-expect-error` だけで固定（テストなし）

直す前に、まず再現するテストを書くこと。

| 場所 | 症状 |
|---|---|
| `src/CannonML.ts:57` | `runner()` が `new Runner(seq, false)`。引数は `(createdby, sequence)` なので、seq が createdby に入る |
| `src/CMLFiber.ts:384` | `hv`（速度方向基準の角度）が `angleVelocity`（存在しない。正しくは `angleVelocityOnScreen`）を参照し NaN になる |
| `src/core/CMLState.ts:129` | `&` 呼び出しで `fiber._pushInvertion()` の引数が欠けており、`invertFlag` が undefined になる（ミラーが呼び出し先に引き継がれるか仕様を確認） |
| `src/core/CMLState.ts:225,227` | 時間差発射で `fiber.hopt`（存在しない。`headAngleOption`）をコピーしている |
| `src/core/CMLObject.ts` `reset()` | `setScaler`（typo。`setScalar`）。呼ぶと例外 |
| `src/core/CMLObject.ts` `setChangeDirection` / `setChangeSpeed` | `this.conter`（typo。`counter`）。BulletML 系の `cd` / `cs` で `counter` が更新されない |
| `src/core/CMLObject.ts` `calcAbsPosition` / `calcRelatedPosition` / `update` | `related`（typo。`relative`）、`nagate`（`negate`）、`his`（`this`）。親に対する相対配置（`nc` / `fc`、`changeParent`）が壊れている。下の `_initialize` の typo のため `fc` では相対にならず、`changeParent` では例外 |
| `src/core/CMLObject.ts:699` | `_initialize` が `this.isRelative`（正しくは `_isRelative`）に代入する |

## 2. 仕様との差

`docs/reference/v2/cannonML_e.html` を基準に確認が要るもの。

- 仕様にある `n`（`nc`）と `m`（ミラー）が、`CMLState.operators` / `command_rex` に無い（`n{}` は `n ?`、`m0` は `m ?` の構文エラー）。`@` 単独も同様に要確認。テストは現行の実装にあるコマンドだけを書いている。
- `mx` は内部で Y 反転、`my` は X 反転。名前と軸が逆に見える。仕様のミラー軸の定義と突き合わせる（現状の挙動は `commands.test.js` の「ミラー」で固定）。
- 画面サイズ未設定（`setScreenSize` を呼ばない）だと、Runner が最初の `update` で画面外として破棄される。仕様か、既定値を決めるかを検討する。

## 3. 型と可読性

- `any` が約 9 か所、`null!`（「破棄後 null だが型は非 null」）が約 20 か所。主なもの:
  - `ListElem.prev` / `next` と `List` の取り出し系が `any`（State / Fiber / Object の混在のため）。ジェネリクス化で絞れる。
  - `Fiber._object` / `_target` / `_pointer`、`CMLObject._parent`、`State.jump` の扱い。
- `var` が約 33 か所（`CMLFiber.ts` 13、`CMLSequence.ts` 15 など）。`let` / `const` に置き換える。
- 型だけで表せていない暗黙の約束:
  - `State.operators` の各 `func` は `(state, $, fiber, object)` の位置引数。未使用は `_` 始まりにしてある。
  - `CML.String` / `CML.Object` は組み込みと同名のため、クラス名は `CMLString` / `CMLObject`。

## 4. 環境・ドキュメント

- `README.md` を TS 版に更新する（現在の README は作業中の変更で、未コミット）。内容: ビルド手順（`npm run build`）、`import { CML, CannonML } from ".../dist/index.js"` の使い方、demo の起動方法。
- 開発環境:
  - `npm run test:watch` では、テスト用バンドルを起動時に 1 回しか作らない。`src/` を変えたら再起動が必要（`test/helpers/global-setup.js`）。必要なら vitest のプラグイン化か `src` の監視で再ビルドする。
  - lint と CI は未導入。
  - `tsconfig.json` の `lib` に `DOM` が入っている（sion に揃えたため）。ライブラリ本体がブラウザ API を使っていなければ外せる。
  - `package.json` の `name` / `version` は暫定値（`cannonml` / `0.0.0`）。
- `old/v2(javascript)/` は旧 JS の参照用。不要になった時点で消してよい（git 履歴にも残る）。
- `demo/` のブラウザ動作確認は人手。自動化するなら Playwright などを検討。

## 5. この作業と無関係な未コミットの変更（ユーザーの作業）

`.gitattributes`、`README.md`、`demo/server.bat` の削除、`old/` の削除（多数）、`old/v1(actionscript)/`（未追跡）は、TS 化とは別の変更。
