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
| 2 | `&{px$1}9` のように無名シーケンス `{...}` の直後の引数が `$` に入らず、0 になる（`{px$1}9` も同じ） | `_parseNonLabeledSequenceCall` が `Refer` を引数より先に確定（construct）しているため、後から付いた引数が反映されない。引数を反映させる順序に直す。`src/core/CMLParser.ts` | `commands.test.js` の「無名シーケンスの直後の引数」 |

### 1-2. `@ts-expect-error` だけで固定（テストなし）

なし（2026-10-22 時点。ソース中の `known bug` 印はすべて外した）。

## 2. 仕様との差

`docs/reference/v2/cannonML_e.html` を基準に確認が要るもの。

- 仕様にある `m`（ミラー）が、`CMLState.operators` / `command_rex` に無い（`m0` は `m ?` の構文エラー）。`@` 単独も同様に要確認。テストは現行の実装にあるコマンドだけを書いている。
- `n` / `nc` / `^n` は仕様から削除済み（生成は `f` / `fc` に統一）。
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
