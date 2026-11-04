# 残タスク（2026-11-04 時点）

現状: `npm run typecheck` / `npm test` ともに通る（189 件、`it.fails` なし、`@ts-expect-error` なし）。
言語は v3（仕様: `docs/reference/v3/cannonML.md`）。バグ修正や仕様変更は、リファクタとは別のコミットで行うこと。

## 1. 仕様と実装の差（要決定）

実装が仕様と食い違うか、仕様が未定のもの。決めたら仕様・実装・テスト（`test/spec/`）を揃え、ここと AGENTS.md の「Current state」から消す。

- `bm1,30` は 1 発だけ撃つとき、扇の端（-15°）に撃つ。中央ではない。仕様には記述なし。
- 画面サイズ未設定（`setScreenSize` を呼ばない）だと、Runner が最初の `update` で画面外として破棄される。既定値を決めるか、仕様に明記する。
- `@m` の入れ子（打ち消し）と `dt`（狙いは反転せずオフセットだけ反転）は仕様に記載済み。意図どおりか、使ってみて再確認する。

## 2. demo

- `demo/index.html` の既定スクリプトが v2 構文で、パースできない。v3 に書き直す。
- ブラウザでの動作確認は人手。自動化するなら Playwright などを検討。

## 3. 型と可読性

- `any` が 9 か所、`null!`（「破棄後 null だが型は非 null」）が 21 か所。主なもの:
  - `ListElem.prev` / `next` と `List` の取り出し系が `any`（State / Fiber / Object の混在のため）。ジェネリクス化で絞れる。
  - `Fiber._object` / `_target` / `_pointer`、`CMLObject._parent`、`State.jump` の扱い。
- `var` が 32 か所（`CMLFiber.ts` 13、`CMLSequence.ts` 15、`CMLObject.ts` 2、`CMLBarrage.ts` 1、`CMLState.ts` 1）。`let` / `const` に置き換える。
- 型で表せていない暗黙の約束:
  - `State.operators` の各 `func` は `(state, $, fiber, object)` の位置引数。未使用は `_` 始まり。
  - `CML.String` / `CML.Object` は組み込みと同名のため、クラス名は `CMLString` / `CMLObject`。
- パーサの正規表現は JS 文字列リテラルで組み立てている（`\\s` / `\\w` と書く）。単一の `\s` は黙って `s` になり、`tsc` で検出できない。過去に 2 回これで壊れた。テスト以外に守る手段がないので、リテラルの書き方を変えるか、検出するテストを足す。

## 4. 環境・ドキュメント

- `README.md` が v2（プレーン JS・ビルドなし・`docs/reference/v2/`）のまま。TS 版・v3 に書き直す。内容: ビルド手順（`npm run build`）、`import { CML, CannonML } from ".../dist/index.js"`、demo の起動方法、v3 仕様へのリンク。API 表のシグネチャは `args` を外し `mirror` にしただけで、他は古い。
- 開発環境:
  - `npm run test:watch` はテスト用バンドルを起動時に 1 回しか作らない。`src/` を変えたら再起動が必要（`test/helpers/global-setup.js`）。必要なら vitest のプラグイン化か `src` の監視で再ビルドする。
  - lint と CI は未導入。
  - `tsconfig.json` の `lib` に `DOM` が入っている。ライブラリ本体がブラウザ API を使っていなければ外せる。
  - `package.json` の `name` / `version` は暫定値（`cannonml` / `0.0.0`）。`CannonML.VERSION` は `"0.5.0"` で食い違っている。
- `old/` は v1・v2 の凍結アーカイブ。編集しない。不要になった時点で消してよい（git 履歴にも残る）。
